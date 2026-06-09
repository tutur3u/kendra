import { describe, expect, mock, test } from "bun:test";
import type { KendraReelMutationInput } from "./kendra-admin-reel-model";
import type { KendraAdminStudioPayload } from "./kendra-admin-api";

mock.module("next/cache", () => ({
	revalidatePath: () => undefined,
}));

const { updateKendraReel } = await import("./kendra-admin-reels");

const workspaceId = "workspace-1";
const entryId = "entry-1";

function createInput(
	overrides: Partial<KendraReelMutationInput> = {},
): KendraReelMutationInput {
	return {
		audioFile: null,
		category: "Interactive",
		downloadLabel: "Download MP3",
		duration: "1:20",
		featured: true,
		removeAudio: false,
		scriptNotes: "",
		slug: "interactive",
		status: "published",
		style: "Character",
		subtitle: "Audio reel",
		summary: "Interactive sample",
		title: "Kendra Braun - Interactive",
		...overrides,
	};
}

function createStudio({
	audioAsset = false,
	status,
}: {
	audioAsset?: boolean;
	status: "draft" | "published";
}): KendraAdminStudioPayload {
	return {
		assets: audioAsset
			? [
					{
						asset_type: "audio",
						entry_id: entryId,
						id: "asset-1",
						metadata: {
							filename: "old.mp3",
						},
						storage_path: "external-projects/kendra/voice-reels/interactive/old.mp3",
					},
				]
			: [],
		blocks: [],
		collections: [
			{
				collection_type: "voice-reels",
				id: "collection-1",
				slug: "voice-reels",
			},
		],
		entries: [
			{
				collection_id: "collection-1",
				id: entryId,
				profile_data: {
					category: "Interactive",
					downloadLabel: "Download MP3",
					featured: true,
				},
				slug: "interactive",
				status,
				subtitle: "Audio reel",
				summary: "Interactive sample",
				title: "Kendra Braun - Interactive",
			},
		],
	};
}

function createClient(studio: KendraAdminStudioPayload) {
	return {
		createAsset: mock(async () => undefined),
		createBlock: mock(async () => undefined),
		createCollection: mock(async () => undefined),
		createEntry: mock(async () => undefined),
		deleteAsset: mock(async () => undefined),
		deleteEntry: mock(async () => undefined),
		getStudio: mock(async () => studio),
		publishEntry: mock(async () => undefined),
		setupExternalProjectStudio: mock(async () => undefined),
		updateAsset: mock(async () => undefined),
		updateBlock: mock(async () => undefined),
		updateEntry: mock(async () => undefined),
		uploadAssetFile: mock(async () => ({
			fullPath: null,
			path: "external-projects/kendra/voice-reels/interactive/new.mp3",
		})),
	};
}

describe("Kendra admin reel mutations", () => {
	test("does not republish an already published reel", async () => {
		const client = createClient(createStudio({ status: "published" }));

		await updateKendraReel(client, workspaceId, entryId, createInput());

		expect(client.updateEntry).toHaveBeenCalledTimes(1);
		expect(client.publishEntry).not.toHaveBeenCalled();
	});

	test("publishes when a draft reel becomes published", async () => {
		const client = createClient(createStudio({ status: "draft" }));

		await updateKendraReel(client, workspaceId, entryId, createInput());

		expect(client.publishEntry).toHaveBeenCalledWith(workspaceId, entryId, "publish");
	});

	test("uploads audio through the signed-url helper before saving the asset", async () => {
		const client = createClient(createStudio({ audioAsset: true, status: "published" }));
		const audioFile = new File(["audio"], "new.mp3", { type: "audio/mpeg" });

		await updateKendraReel(
			client,
			workspaceId,
			entryId,
			createInput({ audioFile, duration: "0:03" }),
		);

		expect(client.uploadAssetFile).toHaveBeenCalledWith(workspaceId, audioFile, {
			collectionType: "voice-reels",
			entrySlug: "interactive",
			upsert: true,
		});
		expect(client.updateAsset).toHaveBeenCalledWith(
			workspaceId,
			"asset-1",
			expect.objectContaining({
				metadata: expect.objectContaining({
					contentType: "audio/mpeg",
					filename: "new.mp3",
					size: audioFile.size,
				}),
				storage_path: "external-projects/kendra/voice-reels/interactive/new.mp3",
			}),
		);
	});
});
