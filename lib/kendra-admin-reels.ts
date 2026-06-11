import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import {
	createKendraExternalProjectsClient,
	revalidateKendraContent,
	type KendraAdminStudioPayload,
} from "./kendra-admin-api";
import { ensureVoiceReelCollection } from "./kendra-admin-reel-collection";
import { getKendraWorkspaceId } from "./kendra-config";
import {
	type KendraAdminReel,
	type KendraAdminReelStatus,
	type KendraReelMutationInput,
	readKendraAdminReels,
} from "./kendra-admin-reel-model";

type KendraCrudClient = Pick<
	ExternalProjectsClient,
	| "createAsset"
	| "createBlock"
	| "createCollection"
	| "createEntry"
	| "deleteAsset"
	| "deleteEntry"
	| "getStudio"
	| "publishEntry"
	| "setupExternalProjectStudio"
	| "updateAsset"
	| "updateBlock"
	| "updateEntry"
>;

type MutationResult = {
	reel: KendraAdminReel | null;
	reels: KendraAdminReel[];
};

export type KendraReelMutationProgress = {
	label: string;
	percent: number;
	step: string;
};

type KendraReelMutationOptions = {
	onProgress?: (progress: KendraReelMutationProgress) => Promise<void> | void;
};

function readRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readString(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildEntryPayload(collectionId: string, input: KendraReelMutationInput) {
	return {
		collection_id: collectionId,
		metadata: {},
		profile_data: {
			category: input.category,
			downloadLabel: input.downloadLabel,
			duration: input.duration || null,
			featured: input.featured,
			style: input.style || null,
		},
		slug: input.slug,
		status: input.status,
		subtitle: input.subtitle || null,
		summary: input.summary || null,
		title: input.title,
	};
}

function buildBlockPayload(entryId: string, input: KendraReelMutationInput) {
	return {
		block_type: "markdown",
		content: {
			markdown: input.scriptNotes,
		},
		entry_id: entryId,
		sort_order: 0,
		title: "Script notes",
	};
}

function buildAssetPayload({
	entryId,
	input,
}: {
	entryId: string;
	input: KendraReelMutationInput;
}) {
	const metadata: Record<string, string | number | boolean | null> = {
		duration: input.duration || null,
	};

	if (input.audioUpload) {
		metadata.contentType = input.audioUpload.contentType;
		metadata.filename = input.audioUpload.filename;
		metadata.size = input.audioUpload.size;
	}

	return {
		alt_text: `${input.title} audio reel`,
		asset_type: "audio",
		block_id: null,
		entry_id: entryId,
		metadata,
		sort_order: 0,
		source_url: null,
		storage_path: input.audioUpload?.storagePath ?? null,
	};
}

async function emitProgress(
	options: KendraReelMutationOptions | undefined,
	progress: KendraReelMutationProgress,
) {
	await options?.onProgress?.(progress);
}

async function deleteCreatedEntry(
	client: KendraCrudClient,
	workspaceId: string,
	entryId: string,
) {
	await client.deleteEntry(workspaceId, entryId).catch(() => undefined);
}

function findReelById(studio: KendraAdminStudioPayload, entryId: string) {
	return readKendraAdminReels(studio).find((reel) => reel.id === entryId) ?? null;
}

function findReelBySlug(studio: KendraAdminStudioPayload, slug: string) {
	return readKendraAdminReels(studio).find((reel) => reel.slug === slug) ?? null;
}

function readCreatedEntryId(response: unknown) {
	const record = readRecord(response);
	return readString(record, "id") ?? readString(readRecord(record.entry), "id");
}

async function saveAudioAsset({
	client,
	entryId,
	input,
	reel,
	workspaceId,
}: {
	client: KendraCrudClient;
	entryId: string;
	input: KendraReelMutationInput;
	reel: KendraAdminReel | null;
	workspaceId: string;
}) {
	if (input.removeAudio && !input.audioUpload && reel?.audioAssetId) {
		await client.deleteAsset(workspaceId, reel.audioAssetId);
		return;
	}

	if (!input.audioUpload) {
		return;
	}

	const payload = buildAssetPayload({ entryId, input });

	if (reel?.audioAssetId) {
		await client.updateAsset(workspaceId, reel.audioAssetId, payload);
		return;
	}

	await client.createAsset(workspaceId, payload);
}

async function saveScriptNotes({
	client,
	entryId,
	input,
	reel,
	workspaceId,
}: {
	client: KendraCrudClient;
	entryId: string;
	input: KendraReelMutationInput;
	reel: KendraAdminReel | null;
	workspaceId: string;
}) {
	const payload = buildBlockPayload(entryId, input);

	if (reel?.blockId) {
		await client.updateBlock(workspaceId, reel.blockId, payload);
		return;
	}

	if (input.scriptNotes) {
		await client.createBlock(workspaceId, payload);
	}
}

async function publishForStatus(
	client: KendraCrudClient,
	workspaceId: string,
	entryId: string,
	status: KendraAdminReelStatus,
	previousStatus?: KendraAdminReelStatus,
) {
	if (status === "published" && previousStatus !== "published") {
		await client.publishEntry(workspaceId, entryId, "publish");
		return;
	}

	if (status !== "published" && previousStatus === "published") {
		await client.publishEntry(workspaceId, entryId, "unpublish");
	}
}

async function finalizeMutation(
	client: KendraCrudClient,
	workspaceId: string,
	entryId: string | null,
): Promise<MutationResult> {
	const studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
	const reels = readKendraAdminReels(studio);
	revalidateKendraContent();

	return {
		reel: entryId ? reels.find((item) => item.id === entryId) ?? null : null,
		reels,
	};
}

export async function createKendraReel(
	client: KendraCrudClient,
	workspaceId: string,
	input: KendraReelMutationInput,
	options?: KendraReelMutationOptions,
): Promise<MutationResult> {
	await emitProgress(options, {
		label: "Preparing reel library",
		percent: 20,
		step: "prepare-library",
	});
	const { collection } = await ensureVoiceReelCollection(client, workspaceId);
	await emitProgress(options, {
		label: "Saving reel details",
		percent: 35,
		step: "save-entry",
	});
	const created = await client.createEntry(
		workspaceId,
		buildEntryPayload(String(collection.id), input),
	);
	const createdEntryId = readCreatedEntryId(created);
	let entryId = createdEntryId;
	await emitProgress(options, {
		label: "Reading saved reel",
		percent: 50,
		step: "read-entry",
	});
	let studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;

	if (!entryId) {
		entryId = findReelBySlug(studio, input.slug)?.id ?? null;
	}

	if (!entryId) {
		throw new Error("The reel was created, but the new entry id was not returned.");
	}

	const reel = findReelById(studio, entryId);
	try {
		await emitProgress(options, {
			label: input.audioUpload
				? "Saving audio link"
				: input.removeAudio
					? "Removing audio link"
					: "Checking audio link",
			percent: 65,
			step: "save-audio",
		});
		await saveAudioAsset({ client, entryId, input, reel, workspaceId });
		await emitProgress(options, {
			label: "Saving notes",
			percent: 75,
			step: "save-notes",
		});
		await saveScriptNotes({ client, entryId, input, reel, workspaceId });
		await emitProgress(options, {
			label: input.status === "published" ? "Publishing reel" : "Saving visibility",
			percent: 85,
			step: "publish",
		});
		await publishForStatus(client, workspaceId, entryId, input.status);
	} catch (error) {
		if (createdEntryId) {
			await deleteCreatedEntry(client, workspaceId, createdEntryId);
		}
		throw error;
	}

	await emitProgress(options, {
		label: "Refreshing website data",
		percent: 95,
		step: "refresh",
	});
	studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
	return {
		reel: findReelById(studio, entryId),
		reels: readKendraAdminReels(studio),
	};
}

export async function updateKendraReel(
	client: KendraCrudClient,
	workspaceId: string,
	entryId: string,
	input: KendraReelMutationInput,
	options?: KendraReelMutationOptions,
): Promise<MutationResult> {
	await emitProgress(options, {
		label: "Preparing reel library",
		percent: 20,
		step: "prepare-library",
	});
	const { collection, studio } = await ensureVoiceReelCollection(client, workspaceId);
	const current = findReelById(studio, entryId);

	if (!current) {
		throw new Error("Reel not found.");
	}

	await emitProgress(options, {
		label: "Saving reel details",
		percent: 40,
		step: "save-entry",
	});
	await client.updateEntry(workspaceId, entryId, buildEntryPayload(String(collection.id), input));
	await emitProgress(options, {
		label: input.audioUpload
			? "Saving audio link"
			: input.removeAudio
				? "Removing audio link"
				: "Checking audio link",
		percent: 60,
		step: "save-audio",
	});
	await saveAudioAsset({ client, entryId, input, reel: current, workspaceId });
	await emitProgress(options, {
		label: "Saving notes",
		percent: 72,
		step: "save-notes",
	});
	await saveScriptNotes({ client, entryId, input, reel: current, workspaceId });
	await emitProgress(options, {
		label:
			input.status === "published" && current.status !== "published"
				? "Publishing reel"
				: current.status === "published" && input.status !== "published"
					? "Unpublishing reel"
					: "Saving visibility",
		percent: 84,
		step: "publish",
	});
	await publishForStatus(client, workspaceId, entryId, input.status, current.status);

	await emitProgress(options, {
		label: "Refreshing website data",
		percent: 95,
		step: "refresh",
	});
	return finalizeMutation(client, workspaceId, entryId);
}

export async function deleteKendraReel(
	client: KendraCrudClient,
	workspaceId: string,
	entryId: string,
): Promise<MutationResult> {
	const studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
	const current = findReelById(studio, entryId);

	if (!current) {
		throw new Error("Reel not found.");
	}

	if (current.audioAssetId) {
		await client.deleteAsset(workspaceId, current.audioAssetId);
	}

	await client.deleteEntry(workspaceId, entryId);
	return finalizeMutation(client, workspaceId, null);
}

export async function refreshKendraReels(accessToken: string) {
	const workspaceId = getKendraWorkspaceId();
	const client = createKendraExternalProjectsClient(accessToken);
	const studio = await client.getStudio(workspaceId);
	revalidateKendraContent();
	return readKendraAdminReels(studio as KendraAdminStudioPayload);
}
