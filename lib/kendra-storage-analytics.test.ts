import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { StorageAnalytics } from "tuturuuu";
import { getKendraStorageAnalytics } from "./kendra-storage-analytics";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.TUTURUUU_API_BASE_URL;
const originalWorkspaceId = process.env.TUTURUUU_KENDRA_WORKSPACE_ID;

const populatedAnalytics: StorageAnalytics = {
	fileCount: 12,
	largestFile: {
		createdAt: "2026-04-19T01:00:00.000Z",
		name: "interactive-demo.mp3",
		size: 4096,
	},
	smallestFile: {
		createdAt: "2026-04-19T02:00:00.000Z",
		name: "session-note.txt",
		size: 24,
	},
	storageLimit: 10_240,
	totalSize: 5120,
	usagePercentage: 50,
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

describe("Kendra storage analytics", () => {
	beforeEach(() => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example.com/api/v1/";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		restoreEnvValue("TUTURUUU_API_BASE_URL", originalApiBaseUrl);
		restoreEnvValue("TUTURUUU_KENDRA_WORKSPACE_ID", originalWorkspaceId);
	});

	test("requests analytics for the linked workspace with the admin access token", async () => {
		const calls: Array<{ init?: RequestInit; url: string }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, url: String(input) });
			return jsonResponse({ data: populatedAnalytics });
		}) as typeof fetch;

		const result = await getKendraStorageAnalytics("access-token");

		expect(result).toEqual({
			data: populatedAnalytics,
			status: "ready",
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"https://platform.example.com/api/v1/workspaces/ws-linked/external-projects/storage-analytics",
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

		await expect(getKendraStorageAnalytics("access-token")).resolves.toEqual({
			message: "Storage details are not available right now.",
			status: "unavailable",
		});
	});

	test("accepts empty storage analytics without file highlights", async () => {
		const emptyAnalytics: StorageAnalytics = {
			fileCount: 0,
			largestFile: null,
			smallestFile: null,
			storageLimit: 10_240,
			totalSize: 0,
			usagePercentage: 0,
		};
		globalThis.fetch = (async () =>
			jsonResponse({ data: emptyAnalytics })) as typeof fetch;

		await expect(getKendraStorageAnalytics("access-token")).resolves.toEqual({
			data: emptyAnalytics,
			status: "ready",
		});
	});
});
