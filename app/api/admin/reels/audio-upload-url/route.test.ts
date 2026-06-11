import { beforeEach, describe, expect, mock, test } from "bun:test";

const createAssetUploadUrl = mock(async () => ({
	fullPath: "ws-1/external-projects/kendra/voice-reels/interactive/reel.mp3",
	path: "external-projects/kendra/voice-reels/interactive/reel.mp3",
	signedUrl: "https://storage.example/upload/reel.mp3",
	token: "signed-upload-token",
}));
let hasSession = true;

mock.module("@/lib/kendra-admin-api", () => ({
	buildKendraSignedUploadHeaders: (
		uploadUrl: { contentType?: string; headers?: Record<string, string>; token?: string },
		contentType?: string,
	) => ({
		...(uploadUrl.headers ?? {}),
		...(uploadUrl.token ? { Authorization: `Bearer ${uploadUrl.token}` } : {}),
		"Content-Type": uploadUrl.contentType || contentType || "application/octet-stream",
	}),
	createKendraExternalProjectsClient: () => ({
		createAssetUploadUrl,
	}),
	getKendraAdminSession: async () =>
		hasSession ? { accessToken: "app-token" } : null,
}));

mock.module("@/lib/kendra-config", () => ({
	getKendraWorkspaceId: () => "ws-1",
}));

const { POST } = await import("./route");

function createRequest(body: Record<string, unknown>) {
	return new Request("http://localhost/api/admin/reels/audio-upload-url", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

describe("Kendra audio upload URL route", () => {
	beforeEach(() => {
		createAssetUploadUrl.mockClear();
		hasSession = true;
	});

	test("returns a signed direct upload target", async () => {
		const response = await POST(
			createRequest({
				contentType: "audio/mpeg",
				filename: "reel.mp3",
				size: 5,
				slug: "interactive",
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({
			fullPath: "ws-1/external-projects/kendra/voice-reels/interactive/reel.mp3",
			headers: {
				Authorization: "Bearer signed-upload-token",
				"Content-Type": "audio/mpeg",
			},
			method: "PUT",
			path: "external-projects/kendra/voice-reels/interactive/reel.mp3",
			signedUrl: "https://storage.example/upload/reel.mp3",
		});
		expect(createAssetUploadUrl).toHaveBeenCalledWith("ws-1", {
			collectionType: "voice-reels",
			contentType: "audio/mpeg",
			entrySlug: "interactive",
			filename: "reel.mp3",
			size: 5,
			upsert: true,
		});
	});

	test("rejects non-audio and oversized files", async () => {
		const response = await POST(
			createRequest({
				contentType: "text/plain",
				filename: "notes.txt",
				size: 97 * 1024 * 1024,
				slug: "interactive",
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.errors).toEqual({
			filename: "Upload an audio file.",
			size: "Audio files must stay under 96 MB.",
		});
		expect(createAssetUploadUrl).not.toHaveBeenCalled();
	});

	test("requires an admin session", async () => {
		hasSession = false;
		const response = await POST(
			createRequest({
				contentType: "audio/mpeg",
				filename: "reel.mp3",
				size: 5,
				slug: "interactive",
			}),
		);

		expect(response.status).toBe(401);
		expect(createAssetUploadUrl).not.toHaveBeenCalled();
	});
});
