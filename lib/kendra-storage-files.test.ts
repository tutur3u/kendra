import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	getKendraStorageFiles,
	type KendraStorageFilesPayload,
} from "./kendra-storage-files";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.TUTURUUU_API_BASE_URL;
const originalWorkspaceId = process.env.TUTURUUU_KENDRA_WORKSPACE_ID;

const populatedFiles: KendraStorageFilesPayload = {
	items: [
		{
			contentType: "audio/mpeg",
			createdAt: "2026-06-09T01:00:00.000Z",
			kind: "file",
			name: "demo.mp3",
			path: "voice-reels/demo.mp3",
			size: 2048,
			updatedAt: "2026-06-09T02:00:00.000Z",
		},
		{
			contentType: null,
			createdAt: null,
			kind: "folder",
			name: "voice-reels",
			path: "voice-reels",
			size: 0,
			updatedAt: null,
		},
	],
	path: "voice-reels",
	provider: "supabase",
	total: 2,
};

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		headers: { "Content-Type": "application/json" },
		status,
	});
}

function restoreEnvValue(key: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[key];
		return;
	}

	process.env[key] = value;
}

describe("Kendra storage files", () => {
	beforeEach(() => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example.com/api/v1/";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		restoreEnvValue("TUTURUUU_API_BASE_URL", originalApiBaseUrl);
		restoreEnvValue("TUTURUUU_KENDRA_WORKSPACE_ID", originalWorkspaceId);
	});

	test("requests files for the linked workspace with the admin access token", async () => {
		const calls: Array<{ init?: RequestInit; url: string }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, url: String(input) });
			return jsonResponse({ data: populatedFiles });
		}) as typeof fetch;

		const result = await getKendraStorageFiles("access-token", "voice-reels");

		expect(result).toEqual({
			data: populatedFiles,
			status: "ready",
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"https://platform.example.com/api/v1/workspaces/ws-linked/external-projects/storage?limit=100&sortBy=updated_at&sortOrder=desc&path=voice-reels",
		);
		expect(calls[0]?.init).toMatchObject({
			cache: "no-store",
			headers: {
				Accept: "application/json",
				Authorization: "Bearer access-token",
			},
		});
	});

	test("returns an unavailable state when the platform response is not ok", async () => {
		globalThis.fetch = (async () =>
			jsonResponse({ message: "Forbidden" }, 403)) as typeof fetch;

		await expect(getKendraStorageFiles("access-token")).resolves.toEqual({
			message: "Files are not available right now.",
			status: "unavailable",
		});
	});
});
