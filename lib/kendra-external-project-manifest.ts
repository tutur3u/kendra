import {
	demos,
} from "../app/content";

type KendraSyncField = {
	description?: string | null;
	key: string;
	label: string;
	options?: string[];
	required?: boolean;
	type:
		| "boolean"
		| "date"
		| "datetime"
		| "json"
		| "markdown"
		| "number"
		| "string"
		| "string-array";
};

type KendraSyncCollectionSchema = {
	assetTypes?: string[];
	blockTypes?: string[];
	collection_type: string;
	description?: string | null;
	metadataFields?: KendraSyncField[];
	profileFields?: KendraSyncField[];
	slug: string;
	title: string;
};

type KendraSyncAsset = {
	altText?: string | null;
	assetType: string;
	metadata?: Record<string, unknown>;
	sortOrder?: number;
	sourceUrl?: string | null;
	stableSourceId: string;
	storagePath?: string | null;
};

type KendraSyncBlock = {
	blockType: string;
	content: Record<string, unknown>;
	sortOrder?: number;
	stableSourceId: string;
	title?: string | null;
};

type KendraSyncEntry = {
	assets?: KendraSyncAsset[];
	blocks?: KendraSyncBlock[];
	collectionSlug: string;
	metadata?: Record<string, unknown>;
	profileData?: Record<string, unknown>;
	slug: string;
	stableSourceId: string;
	status?: "draft" | "scheduled" | "published" | "archived";
	subtitle?: string | null;
	summary?: string | null;
	title: string;
};

export type KendraExternalProjectManifest = {
	adapter: "kendra";
	content: {
		entries: KendraSyncEntry[];
	};
	schema: {
		collections: KendraSyncCollectionSchema[];
		metadataFields?: KendraSyncField[];
		profileFields?: KendraSyncField[];
	};
	version: 1;
};

export const KENDRA_REEL_COLLECTION_SLUG = "voice-reels";

const PUBLISHED_STATUS = "published" as const;

const voiceReelFields = [
	{ key: "category", label: "Category", type: "string" },
	{ key: "downloadLabel", label: "Download label", type: "string" },
	{ key: "duration", label: "Duration", type: "string" },
	{ key: "featured", label: "Featured reel", type: "boolean" },
	{ key: "style", label: "Voice style", type: "string" },
] satisfies KendraSyncField[];

function slugify(value: string, fallback: string) {
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

function localPublicAsset(path: string, metadata: Record<string, unknown> = {}) {
	return {
		...metadata,
		publicPath: path,
	};
}

function voiceReelEntries() {
	return demos.map((demo, index) => {
		const slug = slugify(demo.title, `reel-${index + 1}`);

		return {
			assets:
				"audioSrc" in demo && demo.audioSrc
					? [
							{
								altText: `${demo.title} audio`,
								assetType: "audio",
								metadata: localPublicAsset(demo.audioSrc),
								sortOrder: 0,
								sourceUrl: null,
								stableSourceId: `kendra:voice-reel:${slug}:audio`,
							},
						]
					: [],
			blocks: [
				{
					blockType: "markdown",
					content: {
						markdown: demo.description,
					},
					sortOrder: 0,
					stableSourceId: `kendra:voice-reel:${slug}:notes`,
					title: "Script notes",
				},
			],
			collectionSlug: KENDRA_REEL_COLLECTION_SLUG,
			profileData: {
				category: slug === "interactive" ? "Interactive" : demo.type,
				downloadLabel: "Download MP3",
				duration: "duration" in demo ? demo.duration : null,
				featured: index === 0,
				style: "Character / Game",
			},
			slug,
			stableSourceId: `kendra:voice-reel:${slug}`,
			status: PUBLISHED_STATUS,
			subtitle: demo.type,
			summary: demo.description,
			title: demo.title,
		} satisfies KendraSyncEntry;
	});
}

export const kendraExternalProjectManifest = {
	adapter: "kendra",
	content: {
		entries: voiceReelEntries(),
	},
	schema: {
		collections: [
			{
				assetTypes: ["audio"],
				blockTypes: ["markdown"],
				collection_type: KENDRA_REEL_COLLECTION_SLUG,
				description: "Voice-over demo reels optimized for public listening and casting review.",
				profileFields: voiceReelFields,
				slug: KENDRA_REEL_COLLECTION_SLUG,
				title: "Voice Reels",
			},
		],
	},
	version: 1,
} satisfies KendraExternalProjectManifest;
