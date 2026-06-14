import { beforeEach, describe, expect, mock, test } from "bun:test";
import type {
	KendraAdminSession,
	KendraSessionReadState,
} from "@/lib/kendra-session";

function createSession(
	overrides: Partial<KendraAdminSession> = {},
): KendraAdminSession {
	return {
		accessToken: "app-token",
		app: { name: "kendra" },
		expiresAt: "2026-06-14T12:00:00.000Z",
		refreshEarlySeconds: 20,
		tokenType: "Bearer",
		user: { email: "admin@example.com", id: "user-1" },
		workspaceId: "ws-1",
		...overrides,
	};
}

let readState: KendraSessionReadState = {
	session: createSession(),
	status: "authenticated",
};
let refreshedSession: KendraAdminSession | null = null;
const setKendraSessionCookie = mock(
	(_response: Response, _session: KendraAdminSession) => {},
);

mock.module("@/lib/kendra-session", () => ({
	getKendraSessionReadStateFromCookies: async () => readState,
	refreshKendraSessionFromCookies: async () => refreshedSession,
	setKendraSessionCookie,
}));

const route = await import("./route");

beforeEach(() => {
	readState = {
		session: createSession(),
		status: "authenticated",
	};
	refreshedSession = null;
	setKendraSessionCookie.mockClear();
});

describe("Kendra admin session status route", () => {
	test("returns expiry metadata for current admin sessions", async () => {
		const response = await route.GET();
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({
			authenticated: true,
			email: "admin@example.com",
			expiresAt: "2026-06-14T12:00:00.000Z",
			refreshEarlySeconds: 20,
		});
		expect(setKendraSessionCookie).not.toHaveBeenCalled();
	});

	test("refreshes and persists refreshable sessions", async () => {
		const staleSession = createSession({
			accessToken: "stale-token",
			expiresAt: "2026-06-14T11:00:00.000Z",
			refreshExpiresAt: "2026-06-15T11:00:00.000Z",
			refreshToken: "refresh-token",
		});
		const nextSession = createSession({
			accessToken: "new-token",
			expiresAt: "2026-06-14T12:10:00.000Z",
			refreshEarlySeconds: 30,
			user: { email: "new-admin@example.com", id: "user-1" },
		});
		readState = {
			session: staleSession,
			status: "refreshable",
		};
		refreshedSession = nextSession;

		const response = await route.GET();
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({
			authenticated: true,
			email: "new-admin@example.com",
			expiresAt: "2026-06-14T12:10:00.000Z",
			refreshEarlySeconds: 30,
		});
		expect(setKendraSessionCookie).toHaveBeenCalledTimes(1);
		expect(setKendraSessionCookie.mock.calls[0]?.[0]).toBe(response);
		expect(setKendraSessionCookie.mock.calls[0]?.[1]).toBe(nextSession);
	});

	test("returns signed out when a refreshable session cannot refresh", async () => {
		readState = {
			session: createSession({
				expiresAt: "2026-06-14T11:00:00.000Z",
				refreshExpiresAt: "2026-06-15T11:00:00.000Z",
				refreshToken: "refresh-token",
			}),
			status: "refreshable",
		};
		refreshedSession = null;

		const response = await route.GET();
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({
			authenticated: false,
			email: null,
			expiresAt: null,
			refreshEarlySeconds: null,
		});
		expect(setKendraSessionCookie).not.toHaveBeenCalled();
	});
});
