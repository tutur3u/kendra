import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { uploadKendraPublicManifestAssets } from "./kendra-public-asset-sync";

type Manifest = Parameters<typeof uploadKendraPublicManifestAssets>[2];

const tempDirs: string[] = [];

function manifestFor(publicPath: string): Manifest {
	return {
		adapter: "kendra",
		content: {
			entries: [
				{
					assets: [
						{
							assetType: "image",
							metadata: { publicPath },
							sourceUrl: null,
							stableSourceId: "kendra:test:asset",
						},
					],
					collectionSlug: "profile",
					slug: "profile",
					stableSourceId: "kendra:test:entry",
					title: "Profile",
				},
			],
		},
		schema: {
			collections: [
				{
					assetTypes: ["image"],
					collection_type: "profile",
					slug: "profile",
					title: "Profile",
				},
			],
		},
		version: 1,
	} as Manifest;
}

async function createPublicDir() {
	const dir = await mkdtemp(join(tmpdir(), "kendra-public-assets-"));
	tempDirs.push(dir);
	return dir;
}

function createClient() {
	const calls: unknown[] = [];

	return {
		calls,
		client: {
			createAssetUploadUrl: async (_workspaceId: string, payload: unknown) => {
				calls.push(payload);
				return {
					fullPath: null,
					path: "external-projects/kendra/profile/profile/featured.png",
					signedUrl: "https://storage.example/upload",
					token: "upload-token",
				};
			},
		},
	};
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("uploadKendraPublicManifestAssets", () => {
	test("uploads a manifest asset from local public files", async () => {
		const publicDir = await createPublicDir();
		await writeFile(join(publicDir, "featured.png"), new Uint8Array([1, 2, 3]));
		const { calls, client } = createClient();
		const uploads: RequestInit[] = [];

		const result = await uploadKendraPublicManifestAssets(
			client,
			"workspace-1",
			manifestFor("/featured.png"),
			{
				appBaseUrl: "https://kendra.example",
				fetch: (async (_url, init) => {
					uploads.push(init ?? {});
					return new Response(null, { status: 200 });
				}) as typeof fetch,
				publicDir,
			},
		);

		expect(calls).toEqual([
			{
				collectionType: "profile",
				entrySlug: "profile",
				filename: "featured.png",
				upsert: true,
			},
		]);
		expect(result.skipped).toEqual([]);
		expect(result.uploaded).toMatchObject([
			{
				bytes: 3,
				contentType: "image/png",
				publicPath: "/featured.png",
				source: "local",
				storagePath: "external-projects/kendra/profile/profile/featured.png",
			},
		]);
		expect(result.manifest.content.entries[0]?.assets?.[0]?.storagePath).toBe(
			"external-projects/kendra/profile/profile/featured.png",
		);
		expect(uploads[0]?.headers).toMatchObject({
			Authorization: "Bearer upload-token",
			"Content-Type": "image/png",
		});
	});

	test("falls back to fetching the public asset from the Kendra origin", async () => {
		const publicDir = await createPublicDir();
		const { client } = createClient();
		const requestedUrls: string[] = [];

		const result = await uploadKendraPublicManifestAssets(
			client,
			"workspace-1",
			manifestFor("/images/featured.png"),
			{
				appBaseUrl: "https://kendra.example",
				fetch: (async (url, init) => {
					requestedUrls.push(String(url));

					if (String(url) === "https://kendra.example/images/featured.png") {
						return new Response(new Uint8Array([4, 5, 6, 7]), {
							headers: { "content-type": "image/png" },
							status: 200,
						});
					}

					expect(init?.method).toBe("PUT");
					return new Response(null, { status: 200 });
				}) as typeof fetch,
				publicDir,
			},
		);

		expect(requestedUrls).toContain("https://kendra.example/images/featured.png");
		expect(result.skipped).toEqual([]);
		expect(result.uploaded[0]).toMatchObject({
			bytes: 4,
			publicPath: "/images/featured.png",
			source: "public-url",
		});
	});

	test("reports missing assets without uploading the manifest", async () => {
		const publicDir = await createPublicDir();
		const { calls, client } = createClient();

		const result = await uploadKendraPublicManifestAssets(
			client,
			"workspace-1",
			manifestFor("/images/missing.png"),
			{
				appBaseUrl: "https://kendra.example",
				fetch: (async () => new Response(null, { status: 404 })) as typeof fetch,
				publicDir,
			},
		);

		expect(calls).toEqual([]);
		expect(result.uploaded).toEqual([]);
		expect(result.skipped).toHaveLength(1);
		expect(result.skipped[0]).toMatchObject({
			filename: "missing.png",
			publicPath: "/images/missing.png",
			reason: expect.stringContaining("public-url: HTTP 404"),
			stableSourceId: "kendra:test:asset",
			storagePath: "external-projects/kendra/profile/profile/missing.png",
		});
		expect(result.skipped[0]?.attempts.map((attempt) => attempt.source)).toEqual([
			"local",
			"public-url",
		]);
	});
});
