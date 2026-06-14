import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";

let currentSession: { accessToken: string } | null = { accessToken: "app-token" };
const withSessionCookie = mock((response: NextResponse) => response);
const getKendraMembers = mock(async (accessToken: string) => ({
	data: {
		invitedCount: 0,
		items: [
			{
				avatarUrl: null,
				createdAt: null,
				directBoardGuest: false,
				displayName: "Kendra Braun",
				email: "kendra@example.com",
				id: "user-1",
				isCreator: true,
				pending: false,
				roles: [],
				workspaceMemberType: "MEMBER",
			},
		],
		joinedCount: 1,
		total: 1,
	},
	requestedWith: accessToken,
	status: "ready",
}));

mock.module("@/lib/kendra-admin-route-session", () => ({
	getKendraAdminRouteSession: async () =>
		currentSession
			? {
					session: currentSession,
					withSessionCookie,
				}
			: {
					response: NextResponse.json(
						{ error: "Unauthorized" },
						{ status: 401 },
					),
					session: null,
					withSessionCookie: null,
				},
}));

mock.module("@/lib/kendra-members", () => ({
	getKendraMembers,
}));

const route = await import("./route");

beforeEach(() => {
	currentSession = { accessToken: "app-token" };
	getKendraMembers.mockClear();
	withSessionCookie.mockClear();
});

describe("Kendra members admin route", () => {
	test("returns read-only members through the current admin session", async () => {
		const response = await route.GET();
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.requestedWith).toBe("app-token");
		expect(payload.data.items[0].displayName).toBe("Kendra Braun");
		expect(getKendraMembers).toHaveBeenCalledWith("app-token");
		expect(withSessionCookie).toHaveBeenCalledTimes(1);
	});

	test("requires an admin session", async () => {
		currentSession = null;

		const response = await route.GET();

		expect(response.status).toBe(401);
		expect(getKendraMembers).not.toHaveBeenCalled();
	});
});
