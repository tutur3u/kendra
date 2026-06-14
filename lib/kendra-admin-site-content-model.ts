import {
	availability,
	bio,
	clientLogos,
	contactIntro,
	experienceGroups,
	notableClients,
	performanceModes,
	site,
	studioSpecs,
} from "../app/content";
import type { KendraAdminStudioPayload } from "./kendra-admin-api";
import type { KendraContent, KendraDeliveryPayload } from "./kendra-content";

export const KENDRA_SITE_CONTENT_COLLECTION_SLUG = "site-content";
export const KENDRA_SITE_CONTENT_ENTRY_SLUG = "site-content";

export type KendraEditableSiteContent = Pick<
	KendraContent,
	| "availability"
	| "bio"
	| "clientLogos"
	| "contactIntro"
	| "experienceGroups"
	| "notableClients"
	| "performanceModes"
	| "site"
	| "studioSpecs"
>;

type JsonObject = Record<string, unknown>;
type NormalizeOptions = {
	preferDefaultsForEmpty?: boolean;
};

export type KendraAdminSiteContentRead = {
	collectionId: string | null;
	content: KendraEditableSiteContent;
	entryId: string | null;
};

export const DEFAULT_KENDRA_EDITABLE_SITE_CONTENT: KendraEditableSiteContent = {
	availability,
	bio,
	clientLogos,
	contactIntro,
	experienceGroups,
	notableClients,
	performanceModes,
	site,
	studioSpecs,
};

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): JsonObject {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as JsonObject)
		: {};
}

function readString(
	record: JsonObject,
	key: string,
	fallback: string,
	options: NormalizeOptions,
) {
	const value = record[key];

	if (typeof value !== "string") {
		return fallback;
	}

	const trimmed = value.trim();
	return trimmed || !options.preferDefaultsForEmpty ? trimmed : fallback;
}

function readOptionalString(record: JsonObject, key: string) {
	const value = record[key];
	return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(
	value: unknown,
	fallback: string[],
	options: NormalizeOptions,
) {
	if (!Array.isArray(value)) {
		return clone(fallback);
	}

	const items = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => !options.preferDefaultsForEmpty || item);

	return items.length > 0 || !options.preferDefaultsForEmpty ? items : clone(fallback);
}

function normalizeSite(value: unknown, options: NormalizeOptions) {
	const record = asRecord(value);
	const fallback = DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site;

	return {
		clientProofImage: readString(record, "clientProofImage", fallback.clientProofImage, options),
		email: readString(record, "email", fallback.email, options),
		gvaaUrl: readString(record, "gvaaUrl", fallback.gvaaUrl, options),
		heroImage: readString(record, "heroImage", fallback.heroImage, options),
		heroImageAlt: readString(record, "heroImageAlt", fallback.heroImageAlt, options),
		location: readString(record, "location", fallback.location, options),
		name: readString(record, "name", fallback.name, options),
		resumeUrl: readString(record, "resumeUrl", fallback.resumeUrl, options),
		tagline: readString(record, "tagline", fallback.tagline, options),
		title: readString(record, "title", fallback.title, options),
	};
}

function normalizeClientLogos(value: unknown, options: NormalizeOptions) {
	if (!Array.isArray(value)) {
		return clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.clientLogos);
	}

	const items = value
		.map((item) => {
			const record = asRecord(item);
			return {
				image: readOptionalString(record, "image"),
				name: readOptionalString(record, "name"),
			};
		})
		.filter(
			(item) =>
				!options.preferDefaultsForEmpty || Boolean(item.image || item.name),
		);

	return items.length > 0 || !options.preferDefaultsForEmpty
		? items
		: clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.clientLogos);
}

function normalizeStudioSpecs(value: unknown, options: NormalizeOptions) {
	if (!Array.isArray(value)) {
		return clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.studioSpecs);
	}

	const items = value
		.map((item) => {
			const record = asRecord(item);
			return {
				label: readOptionalString(record, "label"),
				value: readOptionalString(record, "value"),
			};
		})
		.filter(
			(item) =>
				!options.preferDefaultsForEmpty || Boolean(item.label || item.value),
		);

	return items.length > 0 || !options.preferDefaultsForEmpty
		? items
		: clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.studioSpecs);
}

function normalizeCreditVisual(value: unknown) {
	const record = asRecord(value);
	const visual: Record<string, string> = {};

	for (const key of ["image", "imagePosition", "imageSize", "label", "tone"]) {
		const next = readOptionalString(record, key);
		if (next) visual[key] = next;
	}

	return visual;
}

function normalizeExperienceGroups(value: unknown, options: NormalizeOptions) {
	if (!Array.isArray(value)) {
		return clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.experienceGroups);
	}

	const groups = value
		.map((group) => {
			const groupRecord = asRecord(group);
			const rawItems = groupRecord.items;
			const items = Array.isArray(rawItems)
				? rawItems
						.map((item) => {
							const itemRecord = asRecord(item);
							return {
								project: readOptionalString(itemRecord, "project"),
								role: readOptionalString(itemRecord, "role"),
								visual: normalizeCreditVisual(itemRecord.visual),
							};
						})
						.filter(
							(item) =>
								!options.preferDefaultsForEmpty ||
								Boolean(item.project || item.role || Object.keys(item.visual).length),
						)
				: [];

			return {
				items,
				title: readOptionalString(groupRecord, "title"),
			};
		})
		.filter(
			(group) =>
				!options.preferDefaultsForEmpty ||
				Boolean(group.title || group.items.length),
		);

	return groups.length > 0 || !options.preferDefaultsForEmpty
		? groups
		: clone(DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.experienceGroups);
}

export function normalizeKendraEditableSiteContent(
	value: unknown,
	options: NormalizeOptions = { preferDefaultsForEmpty: true },
): KendraEditableSiteContent {
	const record = asRecord(value);

	return {
		availability: normalizeStringArray(
			record.availability,
			DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.availability,
			options,
		),
		bio: normalizeStringArray(
			record.bio,
			DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.bio,
			options,
		),
		clientLogos: normalizeClientLogos(record.clientLogos, options),
		contactIntro: readString(
			record,
			"contactIntro",
			DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.contactIntro,
			options,
		),
		experienceGroups: normalizeExperienceGroups(record.experienceGroups, options),
		notableClients: normalizeStringArray(
			record.notableClients,
			DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.notableClients,
			options,
		),
		performanceModes: normalizeStringArray(
			record.performanceModes,
			DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.performanceModes,
			options,
		),
		site: normalizeSite(record.site, options),
		studioSpecs: normalizeStudioSpecs(record.studioSpecs, options),
	};
}

function addRequiredError(
	errors: Record<string, string>,
	path: string,
	value: string,
	label: string,
) {
	if (!value.trim()) {
		errors[path] = `${label} is required.`;
	}
}

function isValidHttpUrl(value: string) {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function isValidImageReference(value: string) {
	if (value.startsWith("/")) return true;
	return isValidHttpUrl(value);
}

export function validateKendraEditableSiteContent(
	content: KendraEditableSiteContent,
) {
	const errors: Record<string, string> = {};
	const siteLabels: Array<[keyof typeof content.site, string]> = [
		["name", "Name"],
		["title", "Browser title"],
		["tagline", "Tagline"],
		["email", "Email"],
		["resumeUrl", "Resume URL"],
		["gvaaUrl", "GVAA URL"],
		["location", "Location"],
		["heroImage", "Hero image"],
		["heroImageAlt", "Hero image alt text"],
		["clientProofImage", "Client proof image"],
	];

	for (const [key, label] of siteLabels) {
		addRequiredError(errors, `site.${key}`, content.site[key], label);
	}

	if (content.site.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.site.email)) {
		errors["site.email"] = "Enter a valid email address.";
	}

	if (content.site.resumeUrl && !isValidHttpUrl(content.site.resumeUrl)) {
		errors["site.resumeUrl"] = "Enter a full resume URL.";
	}

	if (content.site.gvaaUrl && !isValidHttpUrl(content.site.gvaaUrl)) {
		errors["site.gvaaUrl"] = "Enter a full GVAA URL.";
	}

	for (const key of ["heroImage", "clientProofImage"] as const) {
		if (content.site[key] && !isValidImageReference(content.site[key])) {
			errors[`site.${key}`] = "Use a public path or full image URL.";
		}
	}

	addRequiredError(errors, "contactIntro", content.contactIntro, "Contact intro");

	content.bio.forEach((item, index) =>
		addRequiredError(errors, `bio.${index}`, item, "Bio paragraph"),
	);
	content.performanceModes.forEach((item, index) =>
		addRequiredError(errors, `performanceModes.${index}`, item, "Performance mode"),
	);
	content.notableClients.forEach((item, index) =>
		addRequiredError(errors, `notableClients.${index}`, item, "Client name"),
	);
	content.availability.forEach((item, index) =>
		addRequiredError(errors, `availability.${index}`, item, "Availability line"),
	);

	content.clientLogos.forEach((item, index) => {
		addRequiredError(errors, `clientLogos.${index}.name`, item.name, "Client logo name");
		addRequiredError(errors, `clientLogos.${index}.image`, item.image, "Client logo image");
	});

	content.studioSpecs.forEach((item, index) => {
		addRequiredError(errors, `studioSpecs.${index}.label`, item.label, "Spec label");
		addRequiredError(errors, `studioSpecs.${index}.value`, item.value, "Spec value");
	});

	content.experienceGroups.forEach((group, groupIndex) => {
		addRequiredError(
			errors,
			`experienceGroups.${groupIndex}.title`,
			group.title,
			"Experience section title",
		);

		group.items.forEach((item, itemIndex) => {
			const base = `experienceGroups.${groupIndex}.items.${itemIndex}`;
			addRequiredError(errors, `${base}.project`, item.project, "Project");
			addRequiredError(errors, `${base}.role`, item.role, "Role");
		});
	});

	return errors;
}

export function parseKendraEditableSiteContentPayload(value: unknown): {
	content: KendraEditableSiteContent | null;
	errors: Record<string, string>;
} {
	const record = asRecord(value);
	const rawContent = "content" in record ? record.content : value;
	const content = normalizeKendraEditableSiteContent(rawContent, {
		preferDefaultsForEmpty: false,
	});
	const errors = validateKendraEditableSiteContent(content);

	return {
		content: Object.keys(errors).length > 0 ? null : content,
		errors,
	};
}

function getCollectionSlug(
	entry: JsonObject,
	collectionById: Map<string, JsonObject>,
) {
	const directSlug =
		readOptionalString(entry, "collectionSlug") ||
		readOptionalString(entry, "collection_slug");
	if (directSlug) return directSlug;

	const collectionId = readOptionalString(entry, "collection_id");
	const collection = collectionId ? collectionById.get(collectionId) : null;
	return collection ? readOptionalString(collection, "slug") : "";
}

function getEntryProfileData(entry: JsonObject) {
	return asRecord(entry.profile_data ?? entry.profileData);
}

export function readKendraAdminSiteContent(
	studio: KendraAdminStudioPayload,
): KendraAdminSiteContentRead {
	const collectionById = new Map(
		studio.collections.map((collection) => [String(collection.id), collection]),
	);
	const collection =
		studio.collections.find((item) => {
			const record = item as JsonObject;
			return (
				readOptionalString(record, "slug") === KENDRA_SITE_CONTENT_COLLECTION_SLUG ||
				readOptionalString(record, "collection_type") ===
					KENDRA_SITE_CONTENT_COLLECTION_SLUG
			);
		}) ?? null;
	const entry =
		studio.entries.find((item) => {
			const record = item as JsonObject;
			return (
				getCollectionSlug(record, collectionById) ===
					KENDRA_SITE_CONTENT_COLLECTION_SLUG &&
				readOptionalString(record, "slug") === KENDRA_SITE_CONTENT_ENTRY_SLUG
			);
		}) ?? null;
	const profileData = entry ? getEntryProfileData(entry as JsonObject) : {};

	return {
		collectionId: collection ? String(collection.id) : null,
		content: normalizeKendraEditableSiteContent(profileData.content),
		entryId: entry ? String(entry.id) : null,
	};
}

export function readKendraDeliverySiteContent(
	delivery: KendraDeliveryPayload,
): KendraEditableSiteContent | null {
	const collection = delivery.collections.find(
		(item) => item.slug === KENDRA_SITE_CONTENT_COLLECTION_SLUG,
	);
	const entry = collection?.entries.find(
		(item) =>
			item.slug === KENDRA_SITE_CONTENT_ENTRY_SLUG && item.status === "published",
	);

	if (!entry) return null;

	const content = normalizeKendraEditableSiteContent(entry.profile_data.content);
	const errors = validateKendraEditableSiteContent(content);
	return Object.keys(errors).length > 0 ? null : content;
}
