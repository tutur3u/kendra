import { describe, expect, mock, test } from "bun:test";
import type { KendraReelMutationInput } from "./kendra-admin-reel-model";
import type { KendraAdminStudioPayload } from "./kendra-admin-api";

mock.module("next/cache", () => ({
	revalidatePath: () => undefined,
}));

const { createKendraReel, updateKendraReel } = await import("./kendra-admin-reels");

const workspaceId = "workspace-1";
const entryId = "entry-1";

function createInput(
	overrides: Partial<KendraReelMutationInput> = {},
): KendraReelMutationInput {
	return {
		audioUpload: null,
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
	id = entryId,
	status,
}: {
	audioAsset?: boolean;
	id?: string;
	status: "draft" | "published";
}): KendraAdminStudioPayload {
	return {
		assets: audioAsset
			? [
					{
						asset_type: "audio",
						entry_id: id,
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
				id,
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
	};
}

describe("Kendra admin reel mutations", () => {
	test("creates reels without re-running setup when the collection already exists", async () => {
		const createdEntryId = "entry-created";
		const initialStudio = createStudio({ status: "draft" });
		const createdStudio = createStudio({ id: createdEntryId, status: "draft" });
		initialStudio.entries = [];
		let getStudioCalls = 0;
		const client = createClient(initialStudio);
		client.createEntry = mock(async () => ({ id: createdEntryId }));
		client.getStudio = mock(async () => {
			getStudioCalls += 1;
			return getStudioCalls === 1 ? initialStudio : createdStudio;
		});

		const result = await createKendraReel(
			client,
			workspaceId,
			createInput({ status: "draft" }),
		);

		expect(client.setupExternalProjectStudio).not.toHaveBeenCalled();
		expect(client.createEntry).toHaveBeenCalledWith(
			workspaceId,
			expect.objectContaining({
				collection_id: "collection-1",
				slug: "interactive",
			}),
		);
		expect(result.reel?.id).toBe(createdEntryId);
	});

	test("cleans up a created reel when audio asset save fails", async () => {
		const createdEntryId = "entry-created";
		const initialStudio = createStudio({ status: "draft" });
		const createdStudio = createStudio({ id: createdEntryId, status: "draft" });
		const assetError = new Error("Failed to save audio asset");
		initialStudio.entries = [];
		let getStudioCalls = 0;
		const client = createClient(initialStudio);
		client.createAsset = mock(async () => {
			throw assetError;
		});
		client.createEntry = mock(async () => ({ id: createdEntryId }));
		client.getStudio = mock(async () => {
			getStudioCalls += 1;
			return getStudioCalls === 1 ? initialStudio : createdStudio;
		});

		await expect(
			createKendraReel(
				client,
				workspaceId,
				createInput({
					audioUpload: {
						contentType: "audio/mpeg",
						filename: "new.mp3",
						size: 5,
						storagePath: "external-projects/kendra/voice-reels/interactive/new.mp3",
					},
					status: "draft",
				}),
			),
		).rejects.toThrow(assetError.message);

		expect(client.deleteEntry).toHaveBeenCalledWith(workspaceId, createdEntryId);
	});

	test("does not republish an already published reel", async () => {
		const client = createClient(createStudio({ status: "published" }));

		await updateKendraReel(client, workspaceId, entryId, createInput());

		expect(client.updateEntry).toHaveBeenCalledTimes(1);
		expect(client.updateEntry).toHaveBeenCalledWith(
			workspaceId,
			entryId,
			expect.objectContaining({ status: "published" }),
		);
		expect(client.publishEntry).not.toHaveBeenCalled();
	});

	test("saves published status without calling the downstream publish endpoint", async () => {
		const client = createClient(createStudio({ status: "draft" }));
		client.publishEntry = mock(async () => {
			throw new Error("Failed to publish workspace external project entry");
		});

		await updateKendraReel(client, workspaceId, entryId, createInput());

		expect(client.updateEntry).toHaveBeenCalledWith(
			workspaceId,
			entryId,
			expect.objectContaining({ status: "published" }),
		);
		expect(client.publishEntry).not.toHaveBeenCalled();
	});

	test("saves uploaded audio metadata without proxying the file", async () => {
		const client = createClient(createStudio({ audioAsset: true, status: "published" }));

		await updateKendraReel(
			client,
			workspaceId,
			entryId,
			createInput({
				audioUpload: {
					contentType: "audio/mpeg",
					filename: "new.mp3",
					size: 5,
					storagePath: "external-projects/kendra/voice-reels/interactive/new.mp3",
				},
				duration: "0:03",
			}),
		);

		expect(client.updateAsset).toHaveBeenCalledWith(
			workspaceId,
			"asset-1",
			expect.objectContaining({
				metadata: expect.objectContaining({
					contentType: "audio/mpeg",
					filename: "new.mp3",
					size: 5,
				}),
				storage_path: "external-projects/kendra/voice-reels/interactive/new.mp3",
			}),
		);
	});

	test("reports progress while updating reel metadata", async () => {
		const client = createClient(createStudio({ status: "draft" }));
		const steps: string[] = [];

		await updateKendraReel(client, workspaceId, entryId, createInput(), {
			onProgress: (progress) => {
				steps.push(progress.step);
			},
		});

		expect(steps).toEqual([
			"prepare-library",
			"save-entry",
			"save-audio",
			"save-notes",
			"publish",
			"refresh",
		]);
	});
});
