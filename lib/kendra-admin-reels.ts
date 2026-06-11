import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import {
	createKendraExternalProjectsClient,
	revalidateKendraContent,
	type KendraAdminStudioPayload,
} from "./kendra-admin-api";
import { getKendraWorkspaceId } from "./kendra-config";
import {
	type KendraAdminReel,
	type KendraAdminReelStatus,
	type KendraReelMutationInput,
	readKendraAdminReels,
} from "./kendra-admin-reel-model";
import {
	KENDRA_REEL_COLLECTION_SLUG,
	kendraExternalProjectManifest,
} from "./kendra-external-project-manifest";

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
	| "uploadAssetFile"
>;

type MutationResult = {
	reel: KendraAdminReel | null;
	reels: KendraAdminReel[];
};

type SdkManifest = NonNullable<
	Parameters<ExternalProjectsClient["setupExternalProjectStudio"]>[1]["manifest"]
>;

function readRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readString(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getVoiceReelCollection(studio: KendraAdminStudioPayload) {
	return (
		studio.collections.find((collection) => {
			const record = collection as Record<string, unknown>;
			return (
				readString(record, "slug") === KENDRA_REEL_COLLECTION_SLUG ||
				readString(record, "collection_type") === KENDRA_REEL_COLLECTION_SLUG
			);
		}) ?? null
	);
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
	upload,
}: {
	entryId: string;
	input: KendraReelMutationInput;
	upload?: { path: string } | null;
}) {
	const metadata: Record<string, string | number | boolean | null> = {
		duration: input.duration || null,
	};

	if (input.audioFile) {
		metadata.contentType = input.audioFile.type || null;
		metadata.filename = input.audioFile.name;
		metadata.size = input.audioFile.size;
	}

	return {
		alt_text: `${input.title} audio reel`,
		asset_type: "audio",
		block_id: null,
		entry_id: entryId,
		metadata,
		sort_order: 0,
		source_url: null,
		storage_path: upload?.path ?? null,
	};
}

async function ensureVoiceReelCollection(client: KendraCrudClient, workspaceId: string) {
	let studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
	let collection = getVoiceReelCollection(studio);

	if (collection) {
		return { collection, studio };
	}

	await client.setupExternalProjectStudio(workspaceId, {
		manifest: kendraExternalProjectManifest as unknown as SdkManifest,
	});

	studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
	collection = getVoiceReelCollection(studio);

	if (!collection) {
		const schema = kendraExternalProjectManifest.schema.collections[0]!;
		await client.createCollection(workspaceId, {
			collection_type: schema.collection_type,
			config: {},
			description: schema.description ?? null,
			slug: schema.slug,
			title: schema.title,
		});
		studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
		collection = getVoiceReelCollection(studio);
	}

	if (!collection) {
		throw new Error("Voice reel collection is not available.");
	}

	return { collection, studio };
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

async function uploadAudioFile(
	client: KendraCrudClient,
	workspaceId: string,
	input: KendraReelMutationInput,
) {
	if (!input.audioFile) return null;

	return client.uploadAssetFile(workspaceId, input.audioFile, {
		collectionType: KENDRA_REEL_COLLECTION_SLUG,
		entrySlug: input.slug,
		upsert: true,
	});
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
	if (input.removeAudio && reel?.audioAssetId) {
		await client.deleteAsset(workspaceId, reel.audioAssetId);
		return;
	}

	if (!input.audioFile) {
		return;
	}

	const upload = await uploadAudioFile(client, workspaceId, input);
	const payload = buildAssetPayload({ entryId, input, upload });

	if (reel?.audioAssetId) {
		await client.updateAsset(workspaceId, reel.audioAssetId, {
			...payload,
			storage_path: upload?.path ?? reel.audioStoragePath,
		});
		return;
	}

	if (upload) {
		await client.createAsset(workspaceId, payload);
	}
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
): Promise<MutationResult> {
	const { collection } = await ensureVoiceReelCollection(client, workspaceId);
	const created = await client.createEntry(
		workspaceId,
		buildEntryPayload(String(collection.id), input),
	);
	const createdEntryId = readCreatedEntryId(created);
	let entryId = createdEntryId;
	let studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;

	if (!entryId) {
		entryId = findReelBySlug(studio, input.slug)?.id ?? null;
	}

	if (!entryId) {
		throw new Error("The reel was created, but the new entry id was not returned.");
	}

	const reel = findReelById(studio, entryId);
	try {
		await saveAudioAsset({ client, entryId, input, reel, workspaceId });
		await saveScriptNotes({ client, entryId, input, reel, workspaceId });
		await publishForStatus(client, workspaceId, entryId, input.status);
	} catch (error) {
		if (createdEntryId) {
			await deleteCreatedEntry(client, workspaceId, createdEntryId);
		}
		throw error;
	}

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
): Promise<MutationResult> {
	const { collection, studio } = await ensureVoiceReelCollection(client, workspaceId);
	const current = findReelById(studio, entryId);

	if (!current) {
		throw new Error("Reel not found.");
	}

	await client.updateEntry(workspaceId, entryId, buildEntryPayload(String(collection.id), input));
	await saveAudioAsset({ client, entryId, input, reel: current, workspaceId });
	await saveScriptNotes({ client, entryId, input, reel: current, workspaceId });
	await publishForStatus(client, workspaceId, entryId, input.status, current.status);

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
