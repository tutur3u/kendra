import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import {
	getKendraPublicManifestAssetPlan,
	uploadKendraPublicManifestAssets,
} from "./kendra-public-asset-sync";

type Manifest = Parameters<typeof uploadKendraPublicManifestAssets>[2];

const tempDirs: string[] = [];
const onePixelPng = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
	0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
]);

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
	test("builds asset plan metadata from local public files", async () => {
		const publicDir = await createPublicDir();
		await writeFile(join(publicDir, "featured.png"), onePixelPng);

		const plan = await getKendraPublicManifestAssetPlan(manifestFor("/featured.png"), {
			publicDir,
		});

		expect(plan).toMatchObject([
			{
				filename: "featured.png",
				metadata: {
					bytes: onePixelPng.byteLength,
					contentType: "image/png",
					filename: "featured.png",
					height: 1,
					publicPath: "/featured.png",
					width: 1,
				},
				publicPath: "/featured.png",
			},
		]);
	});

	test("uploads a manifest asset from local public files", async () => {
		const publicDir = await createPublicDir();
		await writeFile(join(publicDir, "featured.png"), onePixelPng);
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
				contentType: "image/png",
				entrySlug: "profile",
				filename: "featured.png",
				size: onePixelPng.byteLength,
				upsert: true,
			},
		]);
		expect(result.skipped).toEqual([]);
		expect(result.uploaded).toMatchObject([
			{
				bytes: onePixelPng.byteLength,
				contentType: "image/png",
				metadata: {
					height: 1,
					width: 1,
				},
				publicPath: "/featured.png",
				source: "local",
				storagePath: "external-projects/kendra/profile/profile/featured.png",
			},
		]);
		expect(result.manifest.content.entries[0]?.assets?.[0]?.storagePath).toBe(
			"external-projects/kendra/profile/profile/featured.png",
		);
		expect(result.manifest.content.entries[0]?.assets?.[0]?.metadata).toMatchObject({
			observedPublicAsset: {
				bytes: onePixelPng.byteLength,
				contentType: "image/png",
				filename: "featured.png",
				height: 1,
				publicPath: "/featured.png",
				width: 1,
			},
			publicPath: "/featured.png",
		});
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
