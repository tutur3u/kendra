import { describe, expect, test } from "bun:test";
import { kendraExternalProjectManifest } from "./kendra-external-project-manifest";

describe("Kendra external project manifest", () => {
	test("declares Kendra as an audio-capable external project", () => {
		expect(kendraExternalProjectManifest.adapter).toBe("kendra");
		expect(kendraExternalProjectManifest.schema.collections.map((collection) => collection.slug)).toEqual([
			"profile",
			"voice-reels",
			"credits",
			"studio",
			"contact",
		]);

		const voiceReels = kendraExternalProjectManifest.schema.collections.find(
			(collection) => collection.slug === "voice-reels",
		);
		expect(voiceReels?.assetTypes).toContain("audio");
		expect(
			kendraExternalProjectManifest.schema.collections
				.filter((collection) => ["credits", "studio", "contact"].includes(collection.slug))
				.map((collection) => [collection.slug, collection.assetTypes]),
		).toEqual([
			["credits", []],
			["studio", []],
			["contact", []],
		]);
	});

	test("seeds the local interactive reel as an audio public asset", () => {
		const reel = kendraExternalProjectManifest.content.entries.find(
			(entry) => entry.collectionSlug === "voice-reels" && entry.slug === "interactive",
		);

		expect(reel?.assets?.[0]).toMatchObject({
			assetType: "audio",
			metadata: {
				publicPath: "/audios/kendra-braun-interactive.mp3",
			},
			stableSourceId: "kendra:voice-reel:interactive:audio",
		});
	});
});
