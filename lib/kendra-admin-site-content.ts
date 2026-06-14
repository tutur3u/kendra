import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import {
  createKendraExternalProjectsClient,
  revalidateKendraContent,
  type KendraAdminStudioPayload,
} from "./kendra-admin-api";
import {
  KENDRA_SITE_CONTENT_COLLECTION_SLUG,
  KENDRA_SITE_CONTENT_ENTRY_SLUG,
  type KendraEditableSiteContent,
  readKendraAdminSiteContent,
} from "./kendra-admin-site-content-model";
import { getKendraWorkspaceId } from "./kendra-config";
import { kendraExternalProjectManifest } from "./kendra-external-project-manifest";

type KendraSiteContentClient = Pick<
  ExternalProjectsClient,
  | "createCollection"
  | "createEntry"
  | "getStudio"
  | "setupExternalProjectStudio"
  | "updateEntry"
>;

type SdkManifest = NonNullable<
  Parameters<
    ExternalProjectsClient["setupExternalProjectStudio"]
  >[1]["manifest"]
>;

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readCreatedEntryId(response: unknown) {
  const record = readRecord(response);
  return readString(record, "id") ?? readString(readRecord(record.entry), "id");
}

function getSiteContentCollection(studio: KendraAdminStudioPayload) {
  return (
    studio.collections.find((collection) => {
      const record = collection as Record<string, unknown>;
      return (
        readString(record, "slug") === KENDRA_SITE_CONTENT_COLLECTION_SLUG ||
        readString(record, "collection_type") ===
          KENDRA_SITE_CONTENT_COLLECTION_SLUG
      );
    }) ?? null
  );
}

async function ensureSiteContentCollection(
  client: KendraSiteContentClient,
  workspaceId: string,
) {
  let studio = (await client.getStudio(
    workspaceId,
  )) as KendraAdminStudioPayload;
  let collection = getSiteContentCollection(studio);

  if (collection) {
    return { collection, studio };
  }

  await client.setupExternalProjectStudio(workspaceId, {
    manifest: kendraExternalProjectManifest as unknown as SdkManifest,
  });

  studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
  collection = getSiteContentCollection(studio);

  if (!collection) {
    const schema = kendraExternalProjectManifest.schema.collections.find(
      (item) => item.slug === KENDRA_SITE_CONTENT_COLLECTION_SLUG,
    );

    if (!schema) {
      throw new Error("Site content collection schema is not available.");
    }

    await client.createCollection(workspaceId, {
      collection_type: schema.collection_type,
      config: {},
      description: schema.description ?? null,
      slug: schema.slug,
      title: schema.title,
    });
    studio = (await client.getStudio(workspaceId)) as KendraAdminStudioPayload;
    collection = getSiteContentCollection(studio);
  }

  if (!collection) {
    throw new Error("Site content collection is not available.");
  }

  return { collection, studio };
}

function buildSiteContentEntryPayload(
  collectionId: string,
  content: KendraEditableSiteContent,
) {
  return {
    collection_id: collectionId,
    metadata: {},
    profile_data: {
      content,
    },
    slug: KENDRA_SITE_CONTENT_ENTRY_SLUG,
    status: "published" as const,
    subtitle: "Admin-managed page copy",
    summary: "Editable public website content for Kendra Braun.",
    title: "Website Content",
  };
}

export async function saveKendraAdminSiteContent(
  client: KendraSiteContentClient,
  workspaceId: string,
  content: KendraEditableSiteContent,
) {
  const { collection, studio } = await ensureSiteContentCollection(
    client,
    workspaceId,
  );
  const current = readKendraAdminSiteContent(studio);
  const payload = buildSiteContentEntryPayload(String(collection.id), content);

  if (current.entryId) {
    await client.updateEntry(workspaceId, current.entryId, payload);
  } else {
    await client.createEntry(workspaceId, payload);
  }

  revalidateKendraContent();
  return content;
}

export async function ensureKendraAdminSiteContentEntry(
  client: KendraSiteContentClient,
  workspaceId: string,
) {
  const { collection, studio } = await ensureSiteContentCollection(
    client,
    workspaceId,
  );
  const current = readKendraAdminSiteContent(studio);

  if (current.entryId) {
    return current;
  }

  const content = current.content;
  const created = await client.createEntry(
    workspaceId,
    buildSiteContentEntryPayload(String(collection.id), content),
  );
  const createdEntryId = readCreatedEntryId(created);

  if (createdEntryId) {
    revalidateKendraContent();
    return {
      ...current,
      content,
      entryId: createdEntryId,
    };
  }

  const refreshedStudio = (await client.getStudio(
    workspaceId,
  )) as KendraAdminStudioPayload;
  const refreshed = readKendraAdminSiteContent(refreshedStudio);

  if (!refreshed.entryId) {
    throw new Error("Site content entry is not available.");
  }

  revalidateKendraContent();
  return refreshed;
}

export async function refreshKendraAdminSiteContent(accessToken: string) {
  const workspaceId = getKendraWorkspaceId();
  const client = createKendraExternalProjectsClient(accessToken);
  const studio = (await client.getStudio(
    workspaceId,
  )) as KendraAdminStudioPayload;
  return readKendraAdminSiteContent(studio).content;
}
