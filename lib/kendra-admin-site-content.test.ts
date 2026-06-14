import { beforeEach, describe, expect, mock, test } from "bun:test";
import { DEFAULT_KENDRA_EDITABLE_SITE_CONTENT } from "./kendra-admin-site-content-model";

const revalidatePath = mock(() => undefined);

mock.module("next/cache", () => ({
	revalidatePath,
}));

const { saveKendraAdminSiteContent } = await import("./kendra-admin-site-content");

function createStudio() {
	return {
		assets: [],
		blocks: [],
		collections: [
			{
				collection_type: "site-content",
				id: "collection-site",
				slug: "site-content",
			},
		],
		entries: [
			{
				collection_id: "collection-site",
				id: "entry-site",
				profile_data: {
					content: DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
				},
				slug: "site-content",
			},
		],
	};
}

beforeEach(() => {
	revalidatePath.mockClear();
});

describe("Kendra admin site content save", () => {
	test("updates existing content without refetching the full studio after save", async () => {
		const getStudio = mock(async () => createStudio());
		const updateEntry = mock(async () => undefined);
		const client = {
			createCollection: mock(async () => undefined),
			createEntry: mock(async () => undefined),
			getStudio,
			setupExternalProjectStudio: mock(async () => undefined),
			updateEntry,
		};
		const content = {
			...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
			contactIntro: "Updated booking copy.",
		};

		await expect(
			saveKendraAdminSiteContent(client, "ws-1", content),
		).resolves.toEqual(content);

		expect(getStudio).toHaveBeenCalledTimes(1);
		expect(updateEntry).toHaveBeenCalledTimes(1);
		expect(revalidatePath).toHaveBeenCalled();
	});
});
