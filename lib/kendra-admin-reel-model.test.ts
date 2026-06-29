import { describe, expect, test } from "bun:test";
import {
	parseKendraReelFormData,
	prepareKendraAudioFilename,
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
		formData.set(
			"audioStoragePath",
			"external-projects/kendra/voice-reels/commercial/commercial.mp3",
		);
		formData.set("audioFileName", "commercial.mp3");
		formData.set("audioContentType", "audio/mpeg");
		formData.set("audioSize", "5");

		const result = parseKendraReelFormData(formData);

		expect(result.errors).toEqual({});
		expect(result.input).toMatchObject({
			audioUpload: {
				contentType: "audio/mpeg",
				filename: "commercial.mp3",
				size: 5,
				storagePath: "external-projects/kendra/voice-reels/commercial/commercial.mp3",
			},
			featured: true,
			slug: "commercial-and-character",
			status: "published",
			title: "Kendra Braun - Commercial & Character",
		});
	});

	test("prepares safe storage filenames for uploaded audio", () => {
		expect(prepareKendraAudioFilename("Kendra Braun Interactive Sample Reel 26.mp3")).toBe(
			"kendra-braun-interactive-sample-reel-26.mp3",
		);
		expect(prepareKendraAudioFilename("   !!!.mp3")).toBe("reel.mp3");
	});

	test("accepts sanitized and legacy uploaded audio storage paths", () => {
		for (const audioStoragePath of [
			"external-projects/kendra/voice-reels/interactive/kendra-braun-interactive-sample-reel-26.mp3",
			"external-projects/kendra/voice-reels/interactive/Kendra Braun Interactive Sample Reel 26.mp3",
		]) {
			const formData = new FormData();
			formData.set("title", "Kendra Braun - Interactive");
			formData.set("audioStoragePath", audioStoragePath);
			formData.set("audioFileName", "Kendra Braun Interactive Sample Reel 26.mp3");
			formData.set("audioContentType", "audio/mpeg");
			formData.set("audioSize", "1782579");

			const result = parseKendraReelFormData(formData);

			expect(result.errors).toEqual({});
			expect(result.input?.audioUpload).toMatchObject({
				filename: "Kendra Braun Interactive Sample Reel 26.mp3",
				storagePath: audioStoragePath,
			});
		}
	});

	test("rejects invalid reel forms", () => {
		const formData = new FormData();
		formData.set("audioFile", new File(["not audio"], "notes.txt", { type: "text/plain" }));

		const result = parseKendraReelFormData(formData);

		expect(result.input).toBeNull();
		expect(result.errors).toMatchObject({
			audioFile: "Audio files must be uploaded with the direct signed upload flow.",
			title: "Add a reel title.",
		});
	});

	test("rejects invalid uploaded audio metadata", () => {
		const formData = new FormData();
		formData.set("title", "Kendra Braun - Commercial");
		formData.set("audioStoragePath", "public/commercial.mp3");
		formData.set("audioFileName", "commercial.txt");
		formData.set("audioContentType", "text/plain");
		formData.set("audioSize", "5");

		const result = parseKendraReelFormData(formData);

		expect(result.input).toBeNull();
		expect(result.errors.audioFile).toBe("Upload an audio file.");
	});

	test("rejects unsafe uploaded audio storage paths", () => {
		const invalidPaths = [
			"https://storage.example/reel.mp3",
			"external-projects/yoola/voice-reels/interactive/reel.mp3",
			"external-projects/kendra/voice-reels/interactive/../reel.mp3",
			"external-projects/kendra/voice-reels/interactive\\reel.mp3",
			"external-projects/kendra/voice-reels/interactive/readme.txt",
		];

		for (const audioStoragePath of invalidPaths) {
			const formData = new FormData();
			formData.set("title", "Kendra Braun - Commercial");
			formData.set("audioStoragePath", audioStoragePath);
			formData.set("audioFileName", "commercial.mp3");
			formData.set("audioContentType", "audio/mpeg");
			formData.set("audioSize", "5");

			const result = parseKendraReelFormData(formData);

			expect(result.input).toBeNull();
			expect(result.errors.audioFile).toBe(
				"Audio upload did not return a valid storage path.",
			);
		}
	});

	test("keeps generated slugs stable", () => {
		expect(slugifyKendraReel("Kendra Braun: Video Games & ADR")).toBe(
			"video-games-and-adr",
		);
	});
});
