import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import type { KendraAdminStudioPayload } from "./kendra-admin-api";
import {
	KENDRA_REEL_COLLECTION_SLUG,
	kendraExternalProjectManifest,
} from "./kendra-external-project-manifest";

type VoiceReelCollectionClient = Pick<
	ExternalProjectsClient,
	"createCollection" | "getStudio" | "setupExternalProjectStudio"
>;

type SdkManifest = NonNullable<
	Parameters<ExternalProjectsClient["setupExternalProjectStudio"]>[1]["manifest"]
>;

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

export async function ensureVoiceReelCollection(
	client: VoiceReelCollectionClient,
	workspaceId: string,
) {
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
