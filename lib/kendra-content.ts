import {
	availability,
	bio,
	clientLogos,
	contactIntro,
	demos,
	experienceGroups,
	navigation,
	notableClients,
	performanceModes,
	site,
	studioSpecs,
} from "../app/content";
import { readKendraDeliverySiteContent } from "./kendra-admin-site-content-model";

type JsonObject = Record<string, unknown>;

type DeliveryBlock = {
	block_type: string;
	content: JsonObject | null;
	entry_id?: string | null;
	id: string;
	sort_order: number;
	title: string | null;
};

type DeliveryAsset = {
	alt_text: string | null;
	assetUrl: string | null;
	asset_type: string;
	block_id: string | null;
	entry_id: string | null;
	id: string;
	metadata: JsonObject;
	sort_order: number;
	source_url: string | null;
	storage_path: string | null;
};

type DeliveryEntry = {
	assets: DeliveryAsset[];
	blocks: DeliveryBlock[];
	id: string;
	metadata: JsonObject;
	profile_data: JsonObject;
	published_at: string | null;
	slug: string;
	status: string;
	subtitle: string | null;
	summary: string | null;
	title: string;
};

type DeliveryCollection = {
	collection_type: string;
	config: JsonObject | null;
	description: string | null;
	entries: DeliveryEntry[];
	id: string;
	slug: string;
	title: string;
};

export type KendraDeliveryPayload = {
	adapter: string;
	canonicalProjectId: string;
	collections: DeliveryCollection[];
	generatedAt: string;
	loadingData: unknown;
	profileData: JsonObject;
	workspaceId: string;
};

export type KendraDemo = {
	audioSrc: string;
	category?: string;
	description: string;
	downloadLabel?: string;
	duration?: string;
	featured?: boolean;
	scriptNotes?: string;
	status: string;
	style?: string;
	title: string;
	type: string;
};

export type KendraCreditVisual = Record<string, string | number | boolean | null | undefined>;

export type KendraCreditItem = {
	project: string;
	role: string;
	visual: KendraCreditVisual;
};

export type KendraExperienceGroup = {
	items: KendraCreditItem[];
	title: string;
};

export type KendraContent = {
	availability: typeof availability;
	bio: typeof bio;
	clientLogos: typeof clientLogos;
	contactIntro: string;
	demos: KendraDemo[];
	experienceGroups: KendraExperienceGroup[];
	navigation: typeof navigation;
	notableClients: typeof notableClients;
	performanceModes: typeof performanceModes;
	site: typeof site;
	studioSpecs: typeof studioSpecs;
};

export const DEFAULT_KENDRA_CONTENT: KendraContent = {
	availability,
	bio,
	clientLogos,
	contactIntro,
	demos,
	experienceGroups,
	navigation,
	notableClients,
	performanceModes,
	site,
	studioSpecs,
};

function asRecord(value: unknown): JsonObject {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as JsonObject)
		: {};
}

function asString(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown) {
	return typeof value === "boolean" ? value : false;
}

function absolutizeUrl(baseUrl: string, value: string | null | undefined) {
	if (!value) return null;

	if (/^https?:\/\//i.test(value)) {
		return value;
	}

	const parsedBaseUrl = new URL(baseUrl);

	if (value.startsWith("/")) {
		return new URL(value, parsedBaseUrl.origin).toString();
	}

	return new URL(value, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

function getCollection(delivery: KendraDeliveryPayload, slug: string) {
	return delivery.collections.find((collection) => collection.slug === slug) ?? null;
}

function getEntry(collection: DeliveryCollection | null, slug: string) {
	return collection?.entries.find((entry) => entry.slug === slug) ?? null;
}

function getMarkdown(entry: DeliveryEntry | null | undefined) {
	const block = entry?.blocks
		.filter((item) => item.block_type === "markdown")
		.sort((left, right) => left.sort_order - right.sort_order)[0];
	const markdown = asRecord(block?.content).markdown;
	return asString(markdown);
}

function getLeadAsset(
	entry: DeliveryEntry | null | undefined,
	assetType: string,
) {
	return entry?.assets
		.filter((item) => item.asset_type === assetType)
		.sort((left, right) => left.sort_order - right.sort_order)[0] ?? null;
}

function getAssetUrl(
	entry: DeliveryEntry | null | undefined,
	assetType: string,
	apiBaseUrl: string,
) {
	const asset = getLeadAsset(entry, assetType);
	return absolutizeUrl(apiBaseUrl, asset?.assetUrl ?? asset?.source_url ?? null);
}

function getAssetDuration(entry: DeliveryEntry | null | undefined, assetType: string) {
	const duration = asRecord(getLeadAsset(entry, assetType)?.metadata).duration;
	return asString(duration);
}

function buildDemos(delivery: KendraDeliveryPayload, apiBaseUrl: string) {
	const reelEntries = getCollection(delivery, "voice-reels")?.entries ?? [];
	const mapped = reelEntries
		.filter((entry) => entry.status === "published")
		.map<KendraDemo | null>((entry) => {
			const profileData = asRecord(entry.profile_data);
			const audioSrc =
				getAssetUrl(entry, "audio", apiBaseUrl) ??
				asString(profileData.audioSrc) ??
				null;

			if (!audioSrc) {
				return null;
			}

			return {
				audioSrc,
				category: asString(profileData.category) ?? "Voice reel",
				description: entry.summary ?? getMarkdown(entry) ?? "",
				downloadLabel: asString(profileData.downloadLabel) ?? "Download",
				duration: asString(profileData.duration) ?? getAssetDuration(entry, "audio") ?? undefined,
				featured: asBoolean(profileData.featured),
				scriptNotes: getMarkdown(entry) ?? undefined,
				status: entry.status === "published" ? "Available" : entry.status,
				style: asString(profileData.style) ?? undefined,
				title: entry.title,
				type: entry.subtitle ?? "Audio reel",
			};
		})
		.filter((demo): demo is KendraDemo => Boolean(demo));

	return mapped.length > 0 ? mapped : demos;
}

export function buildKendraContent(
	delivery: KendraDeliveryPayload | null | undefined,
	{
		apiBaseUrl,
	}: {
		apiBaseUrl: string;
	},
): KendraContent {
	if (!delivery || delivery.adapter !== "kendra") {
		return DEFAULT_KENDRA_CONTENT;
	}

	const editableContent =
		readKendraDeliverySiteContent(delivery) ?? DEFAULT_KENDRA_CONTENT;

	return {
		availability: editableContent.availability,
		bio: editableContent.bio,
		clientLogos: editableContent.clientLogos,
		contactIntro: editableContent.contactIntro,
		demos: buildDemos(delivery, apiBaseUrl),
		experienceGroups: editableContent.experienceGroups,
		navigation,
		notableClients: editableContent.notableClients,
		performanceModes: editableContent.performanceModes,
		site: editableContent.site,
		studioSpecs: editableContent.studioSpecs,
	};
}
