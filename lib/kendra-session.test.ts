import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";
import type { KendraAdminSession } from "./kendra-session";

let sessionCookieValue: string | null = null;

mock.module("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) =>
			sessionCookieValue ? { name, value: sessionCookieValue } : undefined,
	}),
}));

const originalFetch = globalThis.fetch;

function createSession(): KendraAdminSession {
	return {
		accessToken: "app-token",
		app: { name: "kendra" },
		expiresAt: new Date(Date.now() + 60_000).toISOString(),
		tokenType: "Bearer",
		user: { email: "admin@example.com", id: "user-1" },
		workspaceId: "ws-linked",
	};
}

function readSessionCookieValue(response: NextResponse) {
	const setCookie = response.headers.get("set-cookie");
	expect(setCookie).toContain("kendra_admin_session=");
	return setCookie?.split(";")[0]?.slice("kendra_admin_session=".length) ?? "";
}

describe("Kendra session validation", () => {
	beforeEach(() => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example.com/api/v1";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
		process.env.KENDRA_SESSION_SECRET = "session-secret";
		sessionCookieValue = null;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		delete process.env.TUTURUUU_API_BASE_URL;
		delete process.env.TUTURUUU_KENDRA_WORKSPACE_ID;
		delete process.env.KENDRA_SESSION_SECRET;
		sessionCookieValue = null;
	});

	for (const status of [401, 403, 404] as const) {
		test(`rejects stored sessions when platform revalidation returns ${status}`, async () => {
			const { getKendraSessionFromCookies, setKendraSessionCookie } = await import(
				"./kendra-session"
			);
			const response = NextResponse.json({});
			setKendraSessionCookie(response, createSession());
			sessionCookieValue = readSessionCookieValue(response);

			const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
			globalThis.fetch = (async (input, init) => {
				calls.push({ init, input });
				return Response.json({ error: "Invalid session" }, { status });
			}) as typeof fetch;

			await expect(getKendraSessionFromCookies()).resolves.toBeNull();
			expect(calls).toHaveLength(1);
			expect(String(calls[0]?.input)).toBe(
				"https://platform.example.com/api/v1/workspaces/ws-linked/external-projects/summary",
			);
			expect(calls[0]?.init?.headers).toMatchObject({
				Accept: "application/json",
				Authorization: "Bearer app-token",
			});
		});
	}
});
