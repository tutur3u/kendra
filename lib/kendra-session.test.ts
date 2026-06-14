import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest, NextResponse } from "next/server";
import type { KendraAdminSession } from "./kendra-session";

let sessionCookieValue: string | null = null;

mock.module("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) =>
			sessionCookieValue ? { name, value: sessionCookieValue } : undefined,
		set: (_name: string, value: string) => {
			sessionCookieValue = value;
		},
	}),
}));

const originalFetch = globalThis.fetch;

function createSession(
	overrides: Partial<KendraAdminSession> = {},
): KendraAdminSession {
	return {
		accessToken: "app-token",
		app: { name: "kendra" },
		expiresAt: new Date(Date.now() + 60_000).toISOString(),
		tokenType: "Bearer",
		user: { email: "admin@example.com", id: "user-1" },
		workspaceId: "ws-linked",
		...overrides,
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
		process.env.KENDRA_APP_SECRET = "app-secret";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
		process.env.KENDRA_SESSION_SECRET = "session-secret";
		sessionCookieValue = null;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		delete process.env.TUTURUUU_API_BASE_URL;
		delete process.env.KENDRA_APP_SECRET;
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

	test("does not refresh during page-safe reads inside the early refresh window", async () => {
		const { getKendraSessionFromCookies, setKendraSessionCookie } = await import(
			"./kendra-session"
		);
		const response = NextResponse.json({});
		setKendraSessionCookie(
			response,
			createSession({
				expiresAt: new Date(Date.now() + 60_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
			}),
		);
		sessionCookieValue = readSessionCookieValue(response);

		const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, input });
			return Response.json({ ok: true });
		}) as typeof fetch;

		const session = await getKendraSessionFromCookies();

		expect(session?.accessToken).toBe("app-token");
		expect(calls).toHaveLength(1);
		expect(String(calls[0]?.input)).toBe(
			"https://platform.example.com/api/v1/workspaces/ws-linked/external-projects/summary",
		);
	});

	test("reports expired access with a valid refresh token as refreshable", async () => {
		const { getKendraSessionReadStateFromCookies, setKendraSessionCookie } =
			await import("./kendra-session");
		const response = NextResponse.json({});
		setKendraSessionCookie(
			response,
			createSession({
				expiresAt: new Date(Date.now() - 1_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
			}),
		);
		sessionCookieValue = readSessionCookieValue(response);

		const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, input });
			return Response.json({ ok: true });
		}) as typeof fetch;

		const state = await getKendraSessionReadStateFromCookies();

		expect(state.status).toBe("refreshable");
		expect(state.session?.refreshToken).toBe("refresh-token");
		expect(calls).toHaveLength(0);
	});

	test("refreshes stored sessions through the explicit refresh helper", async () => {
		const { refreshKendraSessionFromCookies, setKendraSessionCookie } =
			await import("./kendra-session");
		const response = NextResponse.json({});
		setKendraSessionCookie(
			response,
			createSession({
				expiresAt: new Date(Date.now() - 1_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
			}),
		);
		sessionCookieValue = readSessionCookieValue(response);

		const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, input });

			if (String(input).endsWith("/auth/app-token/exchange")) {
				return Response.json({
					accessToken: "new-app-token",
					app: { name: "kendra" },
					expiresAt: new Date(Date.now() + 60_000).toISOString(),
					refreshEarlySeconds: 900,
					refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
					refreshToken: "new-refresh-token",
					tokenType: "Bearer",
					user: { email: "admin@example.com", id: "user-1" },
					workspaceId: "ws-linked",
				});
			}

			return Response.json({ ok: true });
		}) as typeof fetch;

		const session = await refreshKendraSessionFromCookies();

		expect(session?.accessToken).toBe("new-app-token");
		expect(session?.refreshToken).toBe("new-refresh-token");
		expect(calls).toHaveLength(2);
		expect(String(calls[0]?.input)).toBe(
			"https://platform.example.com/api/v1/auth/app-token/exchange",
		);
		expect(JSON.parse(calls[0]?.init?.body as string)).toMatchObject({
			appId: "kendra",
			appSecret: "app-secret",
			refreshToken: "refresh-token",
			requestedScopes: ["external-projects:*"],
			workspaceId: "ws-linked",
		});
		expect(calls[1]?.init?.headers).toMatchObject({
			Accept: "application/json",
			Authorization: "Bearer new-app-token",
		});
	});

	test("refresh route rotates and persists the refreshed admin session cookie", async () => {
		const { setKendraSessionCookie } = await import("./kendra-session");
		const { POST } = await import("../app/api/auth/session/refresh/route");
		const response = NextResponse.json({});
		setKendraSessionCookie(
			response,
			createSession({
				expiresAt: new Date(Date.now() - 1_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
			}),
		);
		sessionCookieValue = readSessionCookieValue(response);

		const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, input });

			if (String(input).endsWith("/auth/app-token/exchange")) {
				return Response.json({
					accessToken: "new-app-token",
					app: { name: "kendra" },
					expiresAt: new Date(Date.now() + 60_000).toISOString(),
					refreshEarlySeconds: 900,
					refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
					refreshToken: "new-refresh-token",
					tokenType: "Bearer",
					user: { email: "admin@example.com", id: "user-1" },
					workspaceId: "ws-linked",
				});
			}

			return Response.json({ ok: true });
		}) as typeof fetch;

		const refreshResponse = await POST();
		const payload = await refreshResponse.json();

		expect(refreshResponse.status).toBe(200);
		expect(payload).toMatchObject({ userId: "user-1", valid: true });
		expect(refreshResponse.headers.get("set-cookie")).toContain(
			"kendra_admin_session=",
		);
		expect(calls).toHaveLength(2);
		expect(JSON.parse(calls[0]?.init?.body as string)).toMatchObject({
			refreshToken: "refresh-token",
			workspaceId: "ws-linked",
		});
	});

	test("refresh route redirects with a rotated cookie for browser navigation", async () => {
		const { setKendraSessionCookie } = await import("./kendra-session");
		const { GET } = await import("../app/api/auth/session/refresh/route");
		const response = NextResponse.json({});
		setKendraSessionCookie(
			response,
			createSession({
				expiresAt: new Date(Date.now() - 1_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
			}),
		);
		sessionCookieValue = readSessionCookieValue(response);

		globalThis.fetch = (async (input) => {
			if (String(input).endsWith("/auth/app-token/exchange")) {
				return Response.json({
					accessToken: "new-app-token",
					app: { name: "kendra" },
					expiresAt: new Date(Date.now() + 60_000).toISOString(),
					refreshEarlySeconds: 900,
					refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
					refreshToken: "new-refresh-token",
					tokenType: "Bearer",
					user: { email: "admin@example.com", id: "user-1" },
					workspaceId: "ws-linked",
				});
			}

			return Response.json({ ok: true });
		}) as typeof fetch;

		const refreshResponse = await GET(
			new NextRequest(
				"http://localhost/api/auth/session/refresh?nextUrl=/admin",
			),
		);

		expect(refreshResponse.status).toBe(307);
		expect(refreshResponse.headers.get("location")).toBe("http://localhost/admin");
		expect(refreshResponse.headers.get("set-cookie")).toContain(
			"kendra_admin_session=",
		);
	});
});
