import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getKendraMembers } from "./kendra-members";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.TUTURUUU_API_BASE_URL;
const originalWorkspaceId = process.env.TUTURUUU_KENDRA_WORKSPACE_ID;

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

describe("Kendra workspace members", () => {
	beforeEach(() => {
		process.env.TUTURUUU_API_BASE_URL = "https://platform.example.com/api/v1/";
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID = "ws-linked";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		restoreEnvValue("TUTURUUU_API_BASE_URL", originalApiBaseUrl);
		restoreEnvValue("TUTURUUU_KENDRA_WORKSPACE_ID", originalWorkspaceId);
	});

	test("requests enhanced members for the linked workspace", async () => {
		const calls: Array<{ init?: RequestInit; url: string }> = [];
		globalThis.fetch = (async (input, init) => {
			calls.push({ init, url: String(input) });
			return jsonResponse([
				{
					avatar_url: "https://example.com/avatar.png",
					created_at: "2026-06-15T01:00:00.000Z",
					display_name: "Kendra Braun",
					email: "kendra@example.com",
					id: "user-1",
					is_creator: true,
					pending: false,
					roles: [{ id: "role-1", name: "Owner" }],
					workspace_member_type: "MEMBER",
				},
				{
					email: "guest@example.com",
					id: "invite-1",
					pending: true,
					roles: [],
					workspace_member_type: "GUEST",
				},
			]);
		}) as typeof fetch;

		const result = await getKendraMembers("access-token");

		expect(result).toEqual({
			data: {
				invitedCount: 1,
				items: [
					{
						avatarUrl: "https://example.com/avatar.png",
						createdAt: "2026-06-15T01:00:00.000Z",
						directBoardGuest: false,
						displayName: "Kendra Braun",
						email: "kendra@example.com",
						id: "user-1",
						isCreator: true,
						pending: false,
						roles: [{ id: "role-1", name: "Owner" }],
						workspaceMemberType: "MEMBER",
					},
					{
						avatarUrl: null,
						createdAt: null,
						directBoardGuest: false,
						displayName: null,
						email: "guest@example.com",
						id: "invite-1",
						isCreator: false,
						pending: true,
						roles: [],
						workspaceMemberType: "GUEST",
					},
				],
				joinedCount: 1,
				total: 2,
			},
			status: "ready",
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"https://platform.example.com/api/v1/workspaces/ws-linked/external-projects/members/enhanced",
		);
		expect(calls[0]?.init).toMatchObject({
			cache: "no-store",
			headers: {
				Accept: "application/json",
				Authorization: "Bearer access-token",
			},
		});
	});

	test("returns unavailable when the platform response is not usable", async () => {
		globalThis.fetch = (async () =>
			jsonResponse({ message: "Forbidden" }, 403)) as typeof fetch;

		await expect(getKendraMembers("access-token")).resolves.toEqual({
			message: "Members are not available right now.",
			status: "unavailable",
		});
	});
});
