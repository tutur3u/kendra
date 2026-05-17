import { afterEach, describe, expect, test } from "bun:test";
import { DEFAULT_KENDRA_CONTENT } from "./kendra-content";
import { getUncachedKendraContent } from "./kendra-delivery";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.TUTURUUU_API_BASE_URL;
const originalPublicApiBaseUrl = process.env.NEXT_PUBLIC_TUTURUUU_API_BASE_URL;
const originalWorkspaceId = process.env.TUTURUUU_KENDRA_WORKSPACE_ID;
const originalPublicWorkspaceId = process.env.NEXT_PUBLIC_TUTURUUU_KENDRA_WORKSPACE_ID;

function restoreEnvValue(key: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[key];
		return;
	}

	process.env[key] = value;
}

function restoreEnv() {
	restoreEnvValue("TUTURUUU_API_BASE_URL", originalApiBaseUrl);
	restoreEnvValue("NEXT_PUBLIC_TUTURUUU_API_BASE_URL", originalPublicApiBaseUrl);
	restoreEnvValue("TUTURUUU_KENDRA_WORKSPACE_ID", originalWorkspaceId);
	restoreEnvValue("NEXT_PUBLIC_TUTURUUU_KENDRA_WORKSPACE_ID", originalPublicWorkspaceId);
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	restoreEnv();
});

describe("Kendra CMS delivery fallback", () => {
	test("uses current static content while no CMS workspace is configured", async () => {
		delete process.env.TUTURUUU_KENDRA_WORKSPACE_ID;
		delete process.env.NEXT_PUBLIC_TUTURUUU_KENDRA_WORKSPACE_ID;
		globalThis.fetch = (() => {
			throw new Error("fetch should not run without workspace config");
		}) as typeof fetch;

		await expect(getUncachedKendraContent()).resolves.toEqual(DEFAULT_KENDRA_CONTENT);
	});

	test("uses current static content when CMS delivery is unavailable", async () => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example/api/v1";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-kendra";
		globalThis.fetch = (async () =>
			new Response(JSON.stringify({ error: "not ready" }), {
				status: 404,
			})) as typeof fetch;

		await expect(getUncachedKendraContent()).resolves.toEqual(DEFAULT_KENDRA_CONTENT);
	});

	test("keeps static fallback sections when CMS delivery is only partially set up", async () => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example/api/v1";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-kendra";
		globalThis.fetch = (async () =>
			Response.json({
				adapter: "kendra",
				canonicalProjectId: "kendra-main",
				collections: [],
				generatedAt: "2026-05-17T09:00:00.000Z",
				loadingData: null,
				profileData: {},
				workspaceId: "ws-kendra",
			})) as typeof fetch;

		await expect(getUncachedKendraContent()).resolves.toEqual(DEFAULT_KENDRA_CONTENT);
	});
});
