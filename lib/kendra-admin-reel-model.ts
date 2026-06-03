import type { KendraAdminStudioPayload } from "./kendra-admin-api";
import { KENDRA_REEL_COLLECTION_SLUG } from "./kendra-external-project-manifest";

export type KendraAdminReelStatus = "draft" | "scheduled" | "published" | "archived";

export type KendraAdminReel = {
	audioAssetId: string | null;
	audioFileName: string | null;
	audioStoragePath: string | null;
	audioUrl: string | null;
	blockId: string | null;
	category: string;
	downloadLabel: string;
	duration: string | null;
	featured: boolean;
	id: string;
	scriptNotes: string;
	slug: string;
	status: KendraAdminReelStatus;
	style: string;
	subtitle: string;
	summary: string;
	title: string;
};

export type KendraReelMutationInput = {
	audioFile?: File | null;
	category: string;
	downloadLabel: string;
	duration: string;
	featured: boolean;
	removeAudio: boolean;
	scriptNotes: string;
	slug: string;
	status: KendraAdminReelStatus;
	style: string;
	subtitle: string;
	summary: string;
	title: string;
};

type KendraCollectionRecord = Record<string, unknown>;
type KendraEntryRecord = Record<string, unknown>;
type KendraAssetRecord = Record<string, unknown>;
type KendraBlockRecord = Record<string, unknown>;

const MAX_AUDIO_FILE_BYTES = 96 * 1024 * 1024;
const VALID_REEL_STATUSES = new Set<KendraAdminReelStatus>([
	"archived",
	"draft",
	"published",
	"scheduled",
]);

function readRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readString(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(record: Record<string, unknown>, key: string) {
	return record[key] === true;
}

function readNumber(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getEntryCollectionSlug(
	entry: KendraEntryRecord,
	collectionById: Map<string, KendraCollectionRecord>,
) {
	const directSlug = readString(entry, "collectionSlug") ?? readString(entry, "collection_slug");
	if (directSlug) return directSlug;

	const collectionId = readString(entry, "collection_id");
	const collection = collectionId ? collectionById.get(collectionId) : null;
	return collection ? readString(collection, "slug") : null;
}

function getAssetEntryId(asset: KendraAssetRecord) {
	return readString(asset, "entry_id") ?? readString(asset, "entryId");
}

function getBlockEntryId(block: KendraBlockRecord) {
	return readString(block, "entry_id") ?? readString(block, "entryId");
}

function getAssetType(asset: KendraAssetRecord) {
	return readString(asset, "asset_type") ?? readString(asset, "assetType");
}

function getBlockType(block: KendraBlockRecord) {
	return readString(block, "block_type") ?? readString(block, "blockType");
}

function getAssetUrl(asset: KendraAssetRecord | undefined) {
	if (!asset) return null;

	return (
		readString(asset, "asset_url") ??
		readString(asset, "assetUrl") ??
		readString(asset, "source_url") ??
		readString(asset, "sourceUrl")
	);
}

function getAssetStoragePath(asset: KendraAssetRecord | undefined) {
	if (!asset) return null;
	return readString(asset, "storage_path") ?? readString(asset, "storagePath");
}

function getBlockMarkdown(block: KendraBlockRecord | undefined) {
	const content = readRecord(block?.content);
	return readString(content, "markdown") ?? "";
}

function getSortOrder(record: Record<string, unknown>) {
	return readNumber(record, "sort_order") ?? readNumber(record, "sortOrder") ?? 0;
}

export function normalizeKendraReelStatus(value: string | null): KendraAdminReelStatus {
	return value && VALID_REEL_STATUSES.has(value as KendraAdminReelStatus)
		? (value as KendraAdminReelStatus)
		: "draft";
}

export function slugifyKendraReel(value: string, fallback = "voice-reel") {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/^kendra-braun-/, "")
		.slice(0, 80);

	return normalized || fallback;
}

export function readKendraAdminReels(studio: KendraAdminStudioPayload) {
	const collectionById = new Map(
		studio.collections.map((collection) => [String(collection.id), collection]),
	);
	const audioAssets = studio.assets
		.filter((asset) => getAssetType(asset) === "audio")
		.sort((left, right) => getSortOrder(left) - getSortOrder(right));
	const markdownBlocks = studio.blocks
		.filter((block) => getBlockType(block) === "markdown")
		.sort((left, right) => getSortOrder(left) - getSortOrder(right));

	return studio.entries
		.filter((entry) => getEntryCollectionSlug(entry, collectionById) === KENDRA_REEL_COLLECTION_SLUG)
		.map<KendraAdminReel>((entry) => {
			const profileData = readRecord(entry.profile_data ?? entry.profileData);
			const entryId = String(entry.id);
			const audioAsset = audioAssets.find((asset) => getAssetEntryId(asset) === entryId);
			const audioMetadata = readRecord(audioAsset?.metadata);
			const markdownBlock = markdownBlocks.find((block) => getBlockEntryId(block) === entryId);

			return {
				audioAssetId: audioAsset ? String(audioAsset.id) : null,
				audioFileName: readString(audioMetadata, "filename"),
				audioStoragePath: getAssetStoragePath(audioAsset),
				audioUrl: getAssetUrl(audioAsset),
				blockId: markdownBlock ? String(markdownBlock.id) : null,
				category: readString(profileData, "category") ?? "Voice reel",
				downloadLabel: readString(profileData, "downloadLabel") ?? "Download MP3",
				duration:
					readString(profileData, "duration") ??
					readString(audioMetadata, "duration") ??
					null,
				featured: readBoolean(profileData, "featured"),
				id: entryId,
				scriptNotes: getBlockMarkdown(markdownBlock),
				slug: readString(entry, "slug") ?? slugifyKendraReel(readString(entry, "title") ?? entryId),
				status: normalizeKendraReelStatus(readString(entry, "status")),
				style: readString(profileData, "style") ?? "",
				subtitle: readString(entry, "subtitle") ?? "Audio reel",
				summary: readString(entry, "summary") ?? "",
				title: readString(entry, "title") ?? "Untitled reel",
			};
		})
		.sort(
			(left, right) =>
				Number(right.featured) - Number(left.featured) ||
				left.title.localeCompare(right.title),
		);
}

export function parseKendraReelFormData(formData: FormData): {
	errors: Record<string, string>;
	input: KendraReelMutationInput | null;
} {
	const title = String(formData.get("title") ?? "").trim();
	const slug = slugifyKendraReel(String(formData.get("slug") ?? title));
	const rawStatus = String(formData.get("status") ?? "draft").trim();
	const status = normalizeKendraReelStatus(rawStatus);
	const audioFile = formData.get("audioFile");
	const file = audioFile instanceof File && audioFile.size > 0 ? audioFile : null;
	const errors: Record<string, string> = {};

	if (!title) {
		errors.title = "Add a reel title.";
	}

	if (!slug) {
		errors.slug = "Add a reel slug.";
	}

	if (rawStatus && !VALID_REEL_STATUSES.has(rawStatus as KendraAdminReelStatus)) {
		errors.status = "Choose a valid status.";
	}

	if (file) {
		const isAudio =
			file.type.startsWith("audio/") ||
			/\.(aac|aif|aiff|flac|m4a|mp3|ogg|wav|webm)$/i.test(file.name);

		if (!isAudio) {
			errors.audioFile = "Upload an audio file.";
		} else if (file.size > MAX_AUDIO_FILE_BYTES) {
			errors.audioFile = "Audio files must stay under 96 MB.";
		}
	}

	if (Object.keys(errors).length > 0) {
		return { errors, input: null };
	}

	return {
		errors: {},
		input: {
			audioFile: file,
			category: String(formData.get("category") ?? "").trim() || "Voice reel",
			downloadLabel: String(formData.get("downloadLabel") ?? "").trim() || "Download MP3",
			duration: String(formData.get("duration") ?? "").trim(),
			featured: formData.get("featured") === "true" || formData.get("featured") === "on",
			removeAudio: formData.get("removeAudio") === "true" || formData.get("removeAudio") === "on",
			scriptNotes: String(formData.get("scriptNotes") ?? "").trim(),
			slug,
			status,
			style: String(formData.get("style") ?? "").trim(),
			subtitle: String(formData.get("subtitle") ?? "").trim() || "Audio reel",
			summary: String(formData.get("summary") ?? "").trim(),
			title,
		},
	};
}
