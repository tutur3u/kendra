import { afterEach, describe, expect, test } from "bun:test";
import { createKendraExternalProjectsClient } from "./kendra-admin-api";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("createKendraExternalProjectsClient", () => {
	test("uploads files through signed upload URLs", async () => {
		const requests: Array<{ init?: RequestInit; url: string }> = [];
		const file = new File(["audio"], "reel.mp3", { type: "audio/mpeg" });

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

		const result = await client.uploadAssetFile("workspace-1", file, {
			collectionType: "voice-reels",
			entrySlug: "interactive",
			upsert: true,
		});

		expect(result).toEqual({
			fullPath: null,
			path: "external-projects/kendra/voice-reels/interactive/reel.mp3",
		});
		expect(requests).toHaveLength(2);
		expect(requests[0]?.url).toBe(
			"https://tuturuuu.com/api/v1/workspaces/workspace-1/external-projects/assets/upload-url",
		);
		expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
			collectionType: "voice-reels",
			contentType: "audio/mpeg",
			entrySlug: "interactive",
			filename: "reel.mp3",
			size: file.size,
			upsert: true,
		});
		expect(requests[1]?.url).toBe("https://storage.example/upload/reel.mp3");
		expect(requests[1]?.init).toMatchObject({
			body: file,
			cache: "no-store",
			method: "PUT",
		});
		expect(requests[1]?.init?.headers).toMatchObject({
			Authorization: "Bearer signed-upload-token",
			"Content-Type": "audio/mpeg",
		});
	});
});
