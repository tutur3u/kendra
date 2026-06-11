import { afterEach, describe, expect, test } from "bun:test";
import {
	buildKendraSignedUploadHeaders,
	createKendraExternalProjectsClient,
} from "./kendra-admin-api";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("createKendraExternalProjectsClient", () => {
	test("prepares signed upload URLs without proxying files", async () => {
		const requests: Array<{ init?: RequestInit; url: string }> = [];

		globalThis.fetch = (async (input, init) => {
			requests.push({ init, url: String(input) });

			if (String(input).endsWith("/external-projects/assets/upload-url")) {
				return Response.json({
					fullPath: null,
					path: "external-projects/kendra/voice-reels/interactive/reel.mp3",
					signedUrl: "https://storage.example/upload/reel.mp3",
					token: "signed-upload-token",
				});
			}

			return new Response(null, { status: 200 });
		}) as typeof fetch;
		const client = createKendraExternalProjectsClient("access-token");

		const uploadUrl = await client.createAssetUploadUrl(
			"workspace-1",
			{
				collectionType: "voice-reels",
				contentType: "audio/mpeg",
				entrySlug: "interactive",
				filename: "reel.mp3",
				size: 5,
				upsert: true,
			} as Parameters<typeof client.createAssetUploadUrl>[1] & {
				contentType: string;
				size: number;
			},
		);

		expect(uploadUrl).toEqual({
			fullPath: null,
			path: "external-projects/kendra/voice-reels/interactive/reel.mp3",
			signedUrl: "https://storage.example/upload/reel.mp3",
			token: "signed-upload-token",
		});
		expect(requests).toHaveLength(1);
		expect(requests[0]?.url).toBe(
			"https://tuturuuu.com/api/v1/workspaces/workspace-1/external-projects/assets/upload-url",
		);
		expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
			collectionType: "voice-reels",
			contentType: "audio/mpeg",
			entrySlug: "interactive",
			filename: "reel.mp3",
			size: 5,
			upsert: true,
		});

		expect(buildKendraSignedUploadHeaders(uploadUrl, "audio/mpeg")).toEqual({
			Authorization: "Bearer signed-upload-token",
			"Content-Type": "audio/mpeg",
		});
	});

	test("rejects accidental server-side file uploads", async () => {
		const client = createKendraExternalProjectsClient("access-token");

		await expect(
			client.uploadAssetFile(
				"workspace-1",
				new File(["audio"], "reel.mp3", { type: "audio/mpeg" }),
				{
					collectionType: "voice-reels",
					entrySlug: "interactive",
				},
			),
		).rejects.toThrow("Kendra audio uploads must use a signed browser upload URL.");
	});

	test("preserves flat downstream error payloads", async () => {
		globalThis.fetch = (async () =>
			Response.json(
				{ error: "Failed to create workspace external project entry" },
				{ status: 500, statusText: "Internal Server Error" },
			)) as typeof fetch;
		const client = createKendraExternalProjectsClient("access-token");

		await expect(
			client.createEntry("workspace-1", {
				collection_id: "collection-1",
				metadata: {},
				profile_data: {},
				slug: "interactive",
				status: "draft",
				title: "Interactive",
			}),
		).rejects.toMatchObject({
			details: expect.objectContaining({
				endpoint: "/api/v1/workspaces/workspace-1/external-projects/entries",
				response: {
					error: "Failed to create workspace external project entry",
				},
				status: 500,
			}),
			message: "Failed to create workspace external project entry",
			statusCode: 500,
		});
	});
});
