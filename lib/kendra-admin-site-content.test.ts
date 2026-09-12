import { beforeEach, describe, expect, mock, test } from "bun:test";
import { DEFAULT_KENDRA_EDITABLE_SITE_CONTENT } from "./kendra-admin-site-content-model";

const revalidatePath = mock(() => undefined);

mock.module("next/cache", () => ({
	cacheLife: () => undefined,
	cacheTag: () => undefined,
	revalidatePath,
	revalidateTag: () => undefined,
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
			createAsset: mock(async () => ({ id: "resume-asset" })),
			getAssetUrl: () => "https://example.com/assets/resume-asset",
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

for (const hasEntry of [true, false]) {
  test(`persists a permanent resume link with existing entry: ${hasEntry}`, async () => {
    const studio = createStudio();
    if (!hasEntry) studio.entries = [];
    const updateEntry = mock(async (..._args: unknown[]) => undefined);
    const client = {
      createAsset: mock(async () => ({ asset: { id: "resume-asset" } })),
      getAssetUrl: () => "https://example.com/assets/resume-asset",
      createCollection: mock(async () => undefined),
      createEntry: mock(async () => ({ id: "entry-site" })),
      getStudio: mock(async () => studio),
      setupExternalProjectStudio: mock(async () => undefined),
      updateEntry,
    };
    const content = {
      ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
      site: { ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site, resumeUrl: "https://project.supabase.co/storage/v1/object/sign/workspaces/ws-1/external-projects/kendra/resume.pdf?token=expired" },
    };
    const saved = await saveKendraAdminSiteContent(client, "ws-1", content);
    expect(saved.site.resumeUrl).toBe("https://example.com/assets/resume-asset");
    expect(updateEntry.mock.calls[0]?.[2]).toMatchObject({ profile_data: { content: saved } });
    expect(content.site.resumeUrl).toContain("token=expired");
  });
}
