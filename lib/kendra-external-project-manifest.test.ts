import { describe, expect, test } from "bun:test";
import { kendraExternalProjectManifest } from "./kendra-external-project-manifest";

describe("Kendra external project manifest", () => {
	test("declares Kendra as an audio-capable external project", () => {
		expect(kendraExternalProjectManifest.adapter).toBe("kendra");
		expect(kendraExternalProjectManifest.schema.collections.map((collection) => collection.slug)).toEqual([
			"site-content",
			"voice-reels",
		]);

		const voiceReels = kendraExternalProjectManifest.schema.collections.find(
			(collection) => collection.slug === "voice-reels",
		);
		expect(voiceReels?.assetTypes).toContain("audio");
		expect(
			kendraExternalProjectManifest.content.entries.some(
				(entry) => entry.collectionSlug === "site-content" && entry.slug === "site-content",
			),
		).toBe(true);
	});

	test("seeds the local interactive reel as an audio public asset", () => {
		const reel = kendraExternalProjectManifest.content.entries.find(
			(entry) =>
				entry.collectionSlug === "voice-reels" &&
				entry.slug === "interactive",
		);

		if (!reel || !("assets" in reel)) {
			throw new Error("Interactive reel entry is missing audio assets.");
		}

		expect(reel?.assets?.[0]).toMatchObject({
			assetType: "audio",
			metadata: {
				publicPath: "/audios/kendra-braun-interactive.mp3",
			},
			stableSourceId: "kendra:voice-reel:interactive:audio",
		});
	});
});
