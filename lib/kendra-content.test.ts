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
});
