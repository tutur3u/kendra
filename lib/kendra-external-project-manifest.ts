import {
	availability,
	bio,
	contactIntro,
	demos,
	experienceGroups,
	site,
	studioSpecs,
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

const PUBLISHED_STATUS = "published" as const;

const profileFields = [
	{ key: "email", label: "Email", type: "string" },
	{ key: "gvaaUrl", label: "GVAA rate guide URL", type: "string" },
	{ key: "heroImageAlt", label: "Hero image alt text", type: "string" },
	{ key: "location", label: "Location", type: "string" },
	{ key: "resumeUrl", label: "Resume URL", type: "string" },
	{ key: "tagline", label: "Tagline", type: "string" },
	{ key: "title", label: "SEO title", type: "string" },
] satisfies KendraSyncField[];

const voiceReelFields = [
	{ key: "category", label: "Category", type: "string" },
	{ key: "downloadLabel", label: "Download label", type: "string" },
	{ key: "duration", label: "Duration", type: "string" },
	{ key: "featured", label: "Featured reel", type: "boolean" },
	{ key: "style", label: "Voice style", type: "string" },
] satisfies KendraSyncField[];

const creditFields = [
	{ key: "group", label: "Credit group", type: "string" },
	{ key: "role", label: "Role", type: "string" },
	{ key: "visual", label: "Visual metadata", type: "json" },
] satisfies KendraSyncField[];

const studioFields = [
	{ key: "kind", label: "Studio item kind", options: ["spec", "availability"], type: "string" },
	{ key: "label", label: "Label", type: "string" },
	{ key: "value", label: "Value", type: "string" },
] satisfies KendraSyncField[];

const contactFields = [
	{ key: "email", label: "Email", type: "string" },
	{ key: "gvaaUrl", label: "GVAA URL", type: "string" },
	{ key: "resumeUrl", label: "Resume URL", type: "string" },
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

function publicImageAsset({
	altText,
	path,
	stableSourceId,
}: {
	altText: string;
	path: string;
	stableSourceId: string;
}) {
	const isRemote = /^https?:\/\//i.test(path);

	return {
		altText,
		assetType: "image",
		metadata: isRemote ? {} : localPublicAsset(path),
		sortOrder: 0,
		sourceUrl: isRemote ? path : null,
		stableSourceId,
	} satisfies KendraSyncAsset;
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
			collectionSlug: "voice-reels",
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

function creditEntries() {
	return experienceGroups.flatMap((group) =>
		group.items.map((item) => {
			const slug = slugify(`${group.title}-${item.project}`, item.project);

			return {
				blocks: [],
				collectionSlug: "credits",
				profileData: {
					group: group.title,
					role: item.role,
					visual: item.visual,
				},
				slug,
				stableSourceId: `kendra:credit:${slug}`,
				status: PUBLISHED_STATUS,
				subtitle: item.role,
				summary: `${item.project} - ${item.role}`,
				title: item.project,
			} satisfies KendraSyncEntry;
		}),
	);
}

function studioEntries() {
	return [
		...studioSpecs.map((spec) => {
			const slug = slugify(spec.label, "studio-spec");

			return {
				blocks: [],
				collectionSlug: "studio",
				profileData: {
					kind: "spec",
					label: spec.label,
					value: spec.value,
				},
				slug,
				stableSourceId: `kendra:studio:${slug}`,
				status: PUBLISHED_STATUS,
				summary: spec.value,
				title: spec.label,
			} satisfies KendraSyncEntry;
		}),
		...availability.map((item, index) => {
			const slug = slugify(item, `availability-${index + 1}`);

			return {
				blocks: [],
				collectionSlug: "studio",
				profileData: {
					kind: "availability",
				},
				slug,
				stableSourceId: `kendra:studio:${slug}`,
				status: PUBLISHED_STATUS,
				summary: item,
				title: `Availability ${index + 1}`,
			} satisfies KendraSyncEntry;
		}),
	];
}

export const kendraExternalProjectManifest = {
	adapter: "kendra",
	content: {
		entries: [
			{
				assets: [
					publicImageAsset({
						altText: site.heroImageAlt,
						path: site.heroImage,
						stableSourceId: "kendra:profile:profile:hero",
					}),
				],
				blocks: [
					{
						blockType: "markdown",
						content: {
							markdown: bio.join("\n\n"),
						},
						sortOrder: 0,
						stableSourceId: "kendra:profile:profile:bio",
						title: "Bio",
					},
				],
				collectionSlug: "profile",
				profileData: {
					email: site.email,
					gvaaUrl: site.gvaaUrl,
					heroImageAlt: site.heroImageAlt,
					location: site.location,
					resumeUrl: site.resumeUrl,
					tagline: site.tagline,
					title: site.title,
				},
				slug: "profile",
				stableSourceId: "kendra:profile:profile",
				status: PUBLISHED_STATUS,
				subtitle: site.tagline,
				summary: "Primary Kendra Braun voice actor profile.",
				title: site.name,
			},
			...voiceReelEntries(),
			...creditEntries(),
			...studioEntries(),
			{
				blocks: [
					{
						blockType: "markdown",
						content: {
							markdown: contactIntro,
						},
						sortOrder: 0,
						stableSourceId: "kendra:contact:booking:intro",
						title: "Booking intro",
					},
				],
				collectionSlug: "contact",
				profileData: {
					email: site.email,
					gvaaUrl: site.gvaaUrl,
					resumeUrl: site.resumeUrl,
				},
				slug: "booking",
				stableSourceId: "kendra:contact:booking",
				status: PUBLISHED_STATUS,
				summary: contactIntro,
				title: "Booking",
			},
		],
	},
	schema: {
		collections: [
			{
				assetTypes: ["image"],
				blockTypes: ["markdown"],
				collection_type: "profile",
				description: "Profile, bio, brand copy, and hero imagery.",
				profileFields,
				slug: "profile",
				title: "Profile",
			},
			{
				assetTypes: ["audio"],
				blockTypes: ["markdown"],
				collection_type: "voice-reels",
				description: "Voice-over demo reels optimized for public listening and casting review.",
				profileFields: voiceReelFields,
				slug: "voice-reels",
				title: "Voice Reels",
			},
			{
				assetTypes: [],
				collection_type: "credits",
				description: "Commercial, character, and training credits.",
				profileFields: creditFields,
				slug: "credits",
				title: "Credits",
			},
			{
				assetTypes: [],
				collection_type: "studio",
				description: "Home studio specs and live-direction availability.",
				profileFields: studioFields,
				slug: "studio",
				title: "Studio",
			},
			{
				assetTypes: [],
				blockTypes: ["markdown"],
				collection_type: "contact",
				description: "Booking copy, email, and rate guide links.",
				profileFields: contactFields,
				slug: "contact",
				title: "Contact",
			},
		],
		profileFields: [
			{ key: "brand", label: "Brand", type: "string" },
			{ key: "deliveryPreset", label: "Delivery preset", type: "string" },
		],
	},
	version: 1,
} satisfies KendraExternalProjectManifest;
