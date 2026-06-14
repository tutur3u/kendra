import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";
import {
	DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
	type KendraEditableSiteContent,
} from "@/lib/kendra-admin-site-content-model";
import type { KendraAdminStudioPayload } from "@/lib/kendra-admin-api";

let currentSession: { accessToken: string } | null = { accessToken: "app-token" };
let currentStudio: KendraAdminStudioPayload = {
	assets: [],
	blocks: [],
	collections: [],
	entries: [],
};
const client = { name: "external-projects-client" };
const withSessionCookie = mock((response: NextResponse) => response);
const saveKendraAdminSiteContent = mock(
	async (
		_client: unknown,
		_workspaceId: string,
		content: KendraEditableSiteContent,
	) => content,
);

mock.module("@/lib/kendra-admin-api", () => ({
	createKendraExternalProjectsClient: () => client,
	getKendraAdminStudio: async () => currentStudio,
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

mock.module("@/lib/kendra-admin-site-content", () => ({
	saveKendraAdminSiteContent,
}));

mock.module("@/lib/kendra-config", () => ({
	getKendraWorkspaceId: () => "ws-1",
}));

const route = await import("./route");

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/admin/site-content", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
}

beforeEach(() => {
	currentSession = { accessToken: "app-token" };
	currentStudio = {
		assets: [],
		blocks: [],
		collections: [],
		entries: [],
	};
	saveKendraAdminSiteContent.mockClear();
	withSessionCookie.mockClear();
});

describe("Kendra site content admin route", () => {
	test("requires an admin session", async () => {
		currentSession = null;

		const response = await route.GET();

		expect(response.status).toBe(401);
	});

	test("rejects invalid site content saves", async () => {
		const response = await route.PUT(
			jsonRequest({
				content: {
					...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
					site: {
						...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site,
						email: "not-an-email",
					},
				},
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.errors["site.email"]).toBe("Enter a valid email address.");
		expect(saveKendraAdminSiteContent).not.toHaveBeenCalled();
	});

	test("saves valid site content for the linked workspace", async () => {
		const content = {
			...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
			contactIntro: "Updated booking copy.",
		};
		const response = await route.PUT(jsonRequest({ content }));
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.content.contactIntro).toBe("Updated booking copy.");
		expect(saveKendraAdminSiteContent).toHaveBeenCalledWith(
			client,
			"ws-1",
			content,
		);
		expect(withSessionCookie).toHaveBeenCalledTimes(1);
	});
});
