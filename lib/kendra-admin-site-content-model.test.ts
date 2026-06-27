import { describe, expect, test } from "bun:test";
import type { KendraAdminStudioPayload } from "./kendra-admin-api";
import {
  DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
  parseKendraEditableSiteContentPayload,
  readKendraAdminSiteContent,
  readKendraDeliverySiteContent,
} from "./kendra-admin-site-content-model";

describe("Kendra admin site content model", () => {
  test("returns editable static defaults when admin studio has no site content", () => {
    const studio: KendraAdminStudioPayload = {
      assets: [],
      blocks: [],
      collections: [],
      entries: [],
    };

    expect(readKendraAdminSiteContent(studio)).toEqual({
      collectionId: null,
      content: DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
      entryId: null,
    });
  });

  test("normalizes managed admin site content from a flat studio payload", () => {
    const studio: KendraAdminStudioPayload = {
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
            content: {
              ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
              contactIntro: "Updated contact copy.",
              site: {
                ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site,
                resumeUrl: "https://example.com/resume",
              },
            },
          },
          slug: "site-content",
        },
      ],
    };

    const result = readKendraAdminSiteContent(studio);

    expect(result.collectionId).toBe("collection-site");
    expect(result.entryId).toBe("entry-site");
    expect(result.content.contactIntro).toBe("Updated contact copy.");
    expect(result.content.site.resumeUrl).toBe("https://example.com/resume");
  });

	test("rejects invalid admin save payloads with field errors", () => {
		const { content, errors } = parseKendraEditableSiteContentPayload({
      content: {
        ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
        clientLogos: [
          {
            image: "not-an-image-path",
            name: "Client",
          },
        ],
        contactIntro: "",
        experienceGroups: [
          {
            items: [
              {
                project: "Project",
                role: "Role",
                visual: {
                  image: "not-an-image-path",
                },
              },
            ],
            title: "Credits",
          },
        ],
        site: {
          ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site,
          email: "not-an-email",
          resumeUrl: "/resume",
        },
      },
    });

    expect(content).toBeNull();
    expect(errors["contactIntro"]).toBe("Contact intro is required.");
    expect(errors["clientLogos.0.image"]).toBe(
      "Use a public path or full image URL.",
    );
    expect(errors["experienceGroups.0.items.0.visual.image"]).toBe(
      "Use a public path or full image URL.",
    );
    expect(errors["site.email"]).toBe("Enter a valid email address.");
		expect(errors["site.resumeUrl"]).toBe("Enter a full resume URL.");
	});

	test("allows empty managed image fields while validating non-empty values", () => {
		const { content, errors } = parseKendraEditableSiteContentPayload({
			content: {
				...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
				clientLogos: [
					{
						image: "",
						name: "Client",
					},
				],
				experienceGroups: [
					{
						items: [
							{
								project: "Project",
								role: "Role",
								visual: {
									image: "",
								},
							},
						],
						title: "Credits",
					},
				],
				site: {
					...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site,
					clientProofImage: "",
					heroImage: "",
					heroImageAlt: "",
				},
			},
		});

		expect(errors).toEqual({});
		expect(content?.site.heroImage).toBe("");
		expect(content?.site.clientProofImage).toBe("");
		expect(content?.clientLogos[0]?.image).toBe("");
		expect(content?.experienceGroups[0]?.items[0]?.visual.image).toBeUndefined();
	});

	test("ignores unpublished delivery site content", () => {
    expect(
      readKendraDeliverySiteContent({
        adapter: "kendra",
        canonicalProjectId: "kendra-main",
        collections: [
          {
            collection_type: "site-content",
            config: null,
            description: null,
            entries: [
              {
                assets: [],
                blocks: [],
                id: "entry-site",
                metadata: {},
                profile_data: {
                  content: DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
                },
                published_at: null,
                slug: "site-content",
                status: "draft",
                subtitle: null,
                summary: null,
                title: "Website Content",
              },
            ],
            id: "collection-site",
            slug: "site-content",
            title: "Site Content",
          },
        ],
        generatedAt: "2026-05-17T09:00:00.000Z",
        loadingData: null,
        profileData: {},
        workspaceId: "ws-kendra",
      }),
    ).toBeNull();
  });
});
