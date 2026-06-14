import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

function createRequest() {
	return new NextRequest("http://localhost/api/auth/verify-app-token", {
		body: JSON.stringify({ token: "cross-app-token" }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

function createCallbackRequest(search = "token=cross-app-token&nextUrl=/admin") {
	return new NextRequest(
		`http://localhost/api/auth/verify-app-token?${search}`,
	);
}

function mockPlatformExchange(status: 200 | 401 | 403) {
	const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];

	globalThis.fetch = (async (input, init) => {
		calls.push({ init, input });

		if (status === 200) {
			return Response.json({
				accessToken: "app-token",
				app: { name: "kendra" },
				expiresAt: new Date(Date.now() + 60_000).toISOString(),
				refreshEarlySeconds: 900,
				refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				refreshToken: "refresh-token",
				tokenType: "Bearer",
				user: { email: "admin@example.com", id: "user-1" },
				workspaceId: "ws-linked",
			});
		}

		return Response.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
	}) as typeof fetch;

	return calls;
}

describe("Kendra app token verification", () => {
	beforeEach(() => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example.com/api/v1";
		process.env.KENDRA_APP_SECRET = "app-secret";
		process.env.KENDRA_SESSION_SECRET = "session-secret";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
		console.error = (() => undefined) as typeof console.error;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		console.error = originalConsoleError;
		delete process.env.TUTURUUU_API_BASE_URL;
		delete process.env.KENDRA_APP_SECRET;
		delete process.env.KENDRA_SESSION_SECRET;
		delete process.env.TUTURUUU_KENDRA_WORKSPACE_ID;
	});

	test("sends the configured linked workspace id during exchange", async () => {
		const calls = mockPlatformExchange(200);
		const response = await POST(createRequest());

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			refreshEarlySeconds: 900,
			valid: true,
		});
		expect(response.headers.get("set-cookie")).toContain("kendra_admin_session");
		expect(calls).toHaveLength(1);
		expect(JSON.parse(calls[0]?.init?.body as string)).toMatchObject({
			appId: "kendra",
			requestedScopes: ["external-projects:*"],
			token: "cross-app-token",
			workspaceId: "ws-linked",
		});
	});

	test("sets the session cookie and redirects from the server callback", async () => {
		const calls = mockPlatformExchange(200);
		const response = await GET(createCallbackRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("http://localhost/admin");
		expect(response.headers.get("set-cookie")).toContain("kendra_admin_session");
		expect(calls).toHaveLength(1);
		expect(JSON.parse(calls[0]?.init?.body as string)).toMatchObject({
			token: "cross-app-token",
			workspaceId: "ws-linked",
		});
	});

	test("falls back to the dashboard when callback nextUrl is external", async () => {
		mockPlatformExchange(200);
		const response = await GET(
			createCallbackRequest(
				`token=cross-app-token&nextUrl=${encodeURIComponent("https://evil.example/admin")}`,
			),
		);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("http://localhost/admin");
		expect(response.headers.get("set-cookie")).toContain("kendra_admin_session");
	});

	test("redirects callback failures to the verification error screen", async () => {
		mockPlatformExchange(401);
		const response = await GET(createCallbackRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain(
			"http://localhost/verify-token?",
		);
		expect(response.headers.get("location")).toContain("error=Unauthorized");
		expect(response.headers.get("set-cookie")).toBeNull();
	});

	for (const status of [401, 403] as const) {
		test(`does not set a session cookie when exchange returns ${status}`, async () => {
			mockPlatformExchange(status);
			const response = await POST(createRequest());

			expect(response.status).toBe(status);
			expect(response.headers.get("set-cookie")).toBeNull();
		});
	}
});
