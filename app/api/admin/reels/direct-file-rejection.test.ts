import { describe, expect, mock, test } from "bun:test";

const createKendraReel = mock(async () => ({ reel: null, reels: [] }));
const updateKendraReel = mock(async () => ({ reel: null, reels: [] }));

mock.module("@/lib/kendra-admin-api", () => ({
	createKendraExternalProjectsClient: () => ({}),
	getKendraAdminSession: async () => ({ accessToken: "app-token" }),
}));

mock.module("@/lib/kendra-admin-reels", () => ({
	createKendraReel,
	deleteKendraReel: mock(async () => ({ reel: null, reels: [] })),
	refreshKendraReels: mock(async () => []),
	updateKendraReel,
}));

mock.module("@/lib/kendra-config", () => ({
	getKendraWorkspaceId: () => "ws-1",
}));

const createRoute = await import("./route");
const entryRoute = await import("./[entryId]/route");

function createDirectFileRequest(method: "PATCH" | "POST") {
	const formData = new FormData();
	formData.set("title", "Kendra Braun - Interactive");
	formData.set("audioFile", new File(["audio"], "reel.mp3", { type: "audio/mpeg" }));

	return new Request("http://localhost/api/admin/reels", {
		body: formData,
		method,
	});
}

describe("Kendra reel save routes", () => {
	test("rejects direct audio files on create", async () => {
		const response = await createRoute.POST(createDirectFileRequest("POST"));
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.errors.audioFile).toBe(
			"Audio files must be uploaded with the direct signed upload flow.",
		);
		expect(createKendraReel).not.toHaveBeenCalled();
	});

	test("rejects direct audio files on update", async () => {
		const response = await entryRoute.PATCH(createDirectFileRequest("PATCH"), {
			params: Promise.resolve({ entryId: "entry-1" }),
		});
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.errors.audioFile).toBe(
			"Audio files must be uploaded with the direct signed upload flow.",
		);
		expect(updateKendraReel).not.toHaveBeenCalled();
	});
});
