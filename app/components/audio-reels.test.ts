import { describe, expect, test } from "bun:test";
import type { KendraDemo } from "@/lib/kendra-content";
import { getVisibleAudioReels } from "./audio-reels";

function createDemo(index: number): KendraDemo {
	return {
		audioSrc: `/audio-${index}.mp3`,
		description: `Demo ${index}`,
		status: "Available",
		title: `Demo ${index}`,
		type: "Audio reel",
	};
}

describe("Audio reel preview selection", () => {
	test("limits the home preview while preserving the full count", () => {
		const result = getVisibleAudioReels(
			Array.from({ length: 7 }, (_, index) => createDemo(index + 1)),
			5,
		);

		expect(result.visibleReels).toHaveLength(5);
		expect(result.hiddenCount).toBe(2);
		expect(result.totalCount).toBe(7);
	});

	test("shows all reels when no limit is provided", () => {
		const result = getVisibleAudioReels(
			Array.from({ length: 3 }, (_, index) => createDemo(index + 1)),
		);

		expect(result.visibleReels).toHaveLength(3);
		expect(result.hiddenCount).toBe(0);
	});
});
