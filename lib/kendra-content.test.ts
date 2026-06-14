import { describe, expect, test } from "bun:test";
import { DEFAULT_KENDRA_CONTENT, buildKendraContent } from "./kendra-content";

describe("Kendra CMS content mapping", () => {
	test("returns static fallback content when delivery is missing", () => {
		expect(buildKendraContent(null, { apiBaseUrl: "https://platform.example/api/v1" })).toEqual(
			DEFAULT_KENDRA_CONTENT,
		);
	});

	test("maps published CMS audio reel assets into voice-over demos", () => {
		const content = buildKendraContent(
			{
				adapter: "kendra",
				canonicalProjectId: "kendra-main",
				collections: [
					{
						collection_type: "voice-reels",
						config: null,
						description: null,
						id: "collection-reels",
						slug: "voice-reels",
						title: "Voice Reels",
						entries: [
							{
								assets: [
									{
										alt_text: "Interactive character reel",
										assetUrl: "/api/v1/workspaces/ws-kendra/external-projects/assets/audio-1",
										asset_type: "audio",
										block_id: null,
										entry_id: "entry-reel",
										id: "audio-1",
										metadata: { publicPath: "/audios/kendra-braun-interactive.mp3" },
										sort_order: 0,
										source_url: null,
										storage_path:
											"external-projects/kendra/voice-reels/interactive/kendra-braun-interactive.mp3",
									},
								],
								blocks: [
									{
										block_type: "markdown",
										content: {
											markdown:
												"Character-forward read with conversational narration and game dialogue.",
										},
										entry_id: "entry-reel",
										id: "block-script",
										sort_order: 0,
										title: "Script notes",
									},
								],
								id: "entry-reel",
								metadata: {},
								profile_data: {
									category: "Interactive",
									downloadLabel: "Download MP3",
									duration: "1:20",
									featured: true,
									style: "Character / Game",
								},
								published_at: "2026-05-17T09:00:00.000Z",
								slug: "interactive",
								status: "published",
								subtitle: "Audio reel",
								summary: "Interactive and character VO sample.",
								title: "Interactive Reel",
							},
						],
					},
				],
				generatedAt: "2026-05-17T09:00:00.000Z",
				loadingData: null,
				profileData: {},
				workspaceId: "ws-kendra",
			},
			{ apiBaseUrl: "https://platform.example/api/v1" },
		);

		expect(content.demos).toHaveLength(1);
		expect(content.demos[0]).toMatchObject({
			audioSrc: "https://platform.example/api/v1/workspaces/ws-kendra/external-projects/assets/audio-1",
			category: "Interactive",
			description: "Interactive and character VO sample.",
			downloadLabel: "Download MP3",
			duration: "1:20",
			featured: true,
			scriptNotes: "Character-forward read with conversational narration and game dialogue.",
			style: "Character / Game",
			title: "Interactive Reel",
			type: "Audio reel",
		});
	});

	test("uses audio asset metadata duration when the reel field is empty", () => {
		const content = buildKendraContent(
			{
				adapter: "kendra",
				canonicalProjectId: "kendra-main",
				collections: [
					{
						collection_type: "voice-reels",
						config: null,
						description: null,
						id: "collection-reels",
						slug: "voice-reels",
						title: "Voice Reels",
						entries: [
							{
								assets: [
									{
										alt_text: "Narration reel",
										assetUrl: "/api/v1/workspaces/ws-kendra/external-projects/assets/audio-2",
										asset_type: "audio",
										block_id: null,
										entry_id: "entry-reel-2",
										id: "audio-2",
										metadata: { duration: "0:42" },
										sort_order: 0,
										source_url: null,
										storage_path:
											"external-projects/kendra/voice-reels/narration/narration.mp3",
									},
								],
								blocks: [],
								id: "entry-reel-2",
								metadata: {},
								profile_data: {},
								published_at: "2026-05-17T09:00:00.000Z",
								slug: "narration",
								status: "published",
								subtitle: "Audio reel",
								summary: "Narration sample.",
								title: "Narration Reel",
							},
						],
					},
				],
				generatedAt: "2026-05-17T09:00:00.000Z",
				loadingData: null,
				profileData: {},
				workspaceId: "ws-kendra",
			},
			{ apiBaseUrl: "https://platform.example/api/v1" },
		);

		expect(content.demos[0]?.duration).toBe("0:42");
	});

	test("keeps non-audio site sections static when legacy CMS collections exist", () => {
		const content = buildKendraContent(
			{
				adapter: "kendra",
				canonicalProjectId: "kendra-main",
				collections: [
					{
						collection_type: "profile",
						config: null,
						description: null,
						id: "collection-profile",
						slug: "profile",
						title: "Profile",
						entries: [
							{
								assets: [],
								blocks: [],
								id: "entry-profile",
								metadata: {},
								profile_data: {
									tagline: "Should not replace static tagline",
								},
								published_at: "2026-05-17T09:00:00.000Z",
								slug: "profile",
								status: "published",
								subtitle: null,
								summary: null,
								title: "CMS Profile",
							},
						],
					},
				],
				generatedAt: "2026-05-17T09:00:00.000Z",
				loadingData: null,
				profileData: {},
				workspaceId: "ws-kendra",
			},
			{ apiBaseUrl: "https://platform.example/api/v1" },
		);

		expect(content.site).toEqual(DEFAULT_KENDRA_CONTENT.site);
		expect(content.experienceGroups).toEqual(
			DEFAULT_KENDRA_CONTENT.experienceGroups,
		);
	});

	test("maps published site content into static public sections", () => {
		const managedContent = {
			...DEFAULT_KENDRA_CONTENT,
			availability: ["Remote sessions on weekdays."],
			bio: ["Updated bio paragraph."],
			contactIntro: "Updated booking copy.",
			experienceGroups: [
				{
					items: [
						{
							project: "Updated Project",
							role: "Lead Voice",
							visual: { label: "Updated Project", tone: "studio" },
						},
					],
					title: "Updated Experience",
				},
			],
			site: {
				...DEFAULT_KENDRA_CONTENT.site,
				resumeUrl: "https://example.com/resume",
				tagline: "Updated tagline",
			},
			studioSpecs: [{ label: "Microphone", value: "Updated mic" }],
		};
		const content = buildKendraContent(
			{
				adapter: "kendra",
				canonicalProjectId: "kendra-main",
				collections: [
					{
						collection_type: "site-content",
						config: null,
						description: null,
						id: "collection-site-content",
						slug: "site-content",
						title: "Site Content",
						entries: [
							{
								assets: [],
								blocks: [],
								id: "entry-site-content",
								metadata: {},
								profile_data: {
									content: managedContent,
								},
								published_at: "2026-05-17T09:00:00.000Z",
								slug: "site-content",
								status: "published",
								subtitle: "Admin-managed page copy",
								summary: "Editable public website content for Kendra Braun.",
								title: "Website Content",
							},
						],
					},
				],
				generatedAt: "2026-05-17T09:00:00.000Z",
				loadingData: null,
				profileData: {},
				workspaceId: "ws-kendra",
			},
			{ apiBaseUrl: "https://platform.example/api/v1" },
		);

		expect(content.site.resumeUrl).toBe("https://example.com/resume");
		expect(content.site.tagline).toBe("Updated tagline");
		expect(content.experienceGroups).toEqual(managedContent.experienceGroups);
		expect(content.studioSpecs).toEqual([{ label: "Microphone", value: "Updated mic" }]);
		expect(content.availability).toEqual(["Remote sessions on weekdays."]);
		expect(content.contactIntro).toBe("Updated booking copy.");
		expect(content.demos).toEqual(DEFAULT_KENDRA_CONTENT.demos);
	});
});
