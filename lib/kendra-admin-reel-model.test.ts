import { describe, expect, test } from "bun:test";
import {
	parseKendraReelFormData,
	readKendraAdminReels,
	slugifyKendraReel,
} from "./kendra-admin-reel-model";

describe("Kendra admin reel model", () => {
	test("normalizes voice reel entries with audio and script notes", () => {
		const reels = readKendraAdminReels({
			assets: [
				{
					asset_type: "audio",
					assetUrl: "/api/audio/reel-1",
					entry_id: "entry-1",
					id: "asset-1",
					metadata: {
						duration: "1:02",
						filename: "character.mp3",
					},
					sort_order: 0,
					storage_path: "external-projects/kendra/voice-reels/character.mp3",
				},
			],
			blocks: [
				{
					block_type: "markdown",
					content: { markdown: "Scene notes" },
					entry_id: "entry-1",
					id: "block-1",
					sort_order: 0,
				},
			],
			collections: [
				{
					id: "collection-1",
					slug: "voice-reels",
				},
			],
			entries: [
				{
					collection_id: "collection-1",
					id: "entry-1",
					profile_data: {
						category: "Interactive",
						downloadLabel: "Download MP3",
						featured: true,
						style: "Character",
					},
					slug: "interactive",
					status: "published",
					subtitle: "Audio reel",
					summary: "Interactive sample",
					title: "Interactive reel",
				},
			],
		});

		expect(reels).toEqual([
			expect.objectContaining({
				audioAssetId: "asset-1",
				audioFileName: "character.mp3",
				audioStoragePath: "external-projects/kendra/voice-reels/character.mp3",
				audioUrl: "/api/audio/reel-1",
				blockId: "block-1",
				category: "Interactive",
				duration: "1:02",
				featured: true,
				scriptNotes: "Scene notes",
				status: "published",
				title: "Interactive reel",
			}),
		]);
	});

	test("validates create and update form payloads", () => {
		const formData = new FormData();
		formData.set("title", "Kendra Braun - Commercial & Character");
		formData.set("status", "published");
		formData.set("featured", "true");
		formData.set("audioFile", new File(["audio"], "commercial.mp3", { type: "audio/mpeg" }));

		const result = parseKendraReelFormData(formData);

		expect(result.errors).toEqual({});
		expect(result.input).toMatchObject({
			audioFile: expect.any(File),
			featured: true,
			slug: "commercial-and-character",
			status: "published",
			title: "Kendra Braun - Commercial & Character",
		});
	});

	test("rejects invalid reel forms", () => {
		const formData = new FormData();
		formData.set("audioFile", new File(["not audio"], "notes.txt", { type: "text/plain" }));

		const result = parseKendraReelFormData(formData);

		expect(result.input).toBeNull();
		expect(result.errors).toMatchObject({
			audioFile: "Upload an audio file.",
			title: "Add a reel title.",
		});
	});

	test("keeps generated slugs stable", () => {
		expect(slugifyKendraReel("Kendra Braun: Video Games & ADR")).toBe(
			"video-games-and-adr",
		);
	});
});
