import {
  buildKendraSignedUploadHeaders,
  createKendraExternalProjectsClient,
  getKendraAdminSession,
  type KendraSignedAssetUploadUrl,
} from "@/lib/kendra-admin-api";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { ensureKendraAdminSiteContentEntry } from "@/lib/kendra-admin-site-content";
import {
  isKendraSiteImageFieldKey,
  isKendraSiteImageFileDescriptor,
  MAX_SITE_IMAGE_FILE_BYTES,
  prepareKendraSiteImageFilename,
  readKendraSiteImageSize,
} from "@/lib/kendra-admin-site-image";
import {
  KENDRA_SITE_CONTENT_COLLECTION_SLUG,
  KENDRA_SITE_CONTENT_ENTRY_SLUG,
} from "@/lib/kendra-admin-site-content-model";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import { NextResponse } from "next/server";
import type { ExternalProjectsClient } from "tuturuuu/external-projects";

export const dynamic = "force-dynamic";

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function readAssetId(value: unknown) {
  const record = readRecord(value);
  return readString(record, "id") || readString(readRecord(record.asset), "id");
}

function validateImageMetadata(body: Record<string, unknown>) {
  const filename = readString(body, "filename");
  const contentType = readString(body, "contentType");
  const fieldKey = readString(body, "fieldKey");
  const size = readKendraSiteImageSize(body.size);
  const errors: Record<string, string> = {};

  if (!fieldKey || !isKendraSiteImageFieldKey(fieldKey)) {
    errors.fieldKey = "Choose an editable image field.";
  }

  if (!filename) {
    errors.filename = "Choose an image file.";
  } else if (!isKendraSiteImageFileDescriptor({ contentType, filename })) {
    errors.filename = "Choose an image file.";
  }

  if (!size) {
    errors.size = "Image file size is required.";
  } else if (size > MAX_SITE_IMAGE_FILE_BYTES) {
    errors.size = "Choose an image under 12 MB.";
  }

  return { contentType, errors, fieldKey, filename, size };
}

function isExternalProjectStoragePath(value: string) {
  return /^external-projects\/[^/]+\/.+/.test(value);
}

async function readJsonBody(request: Request) {
  try {
    const value = await request.json();
    return readRecord(value);
  } catch {
    return null;
  }
}

async function prepareUploadUrl({
  body,
  sessionAccessToken,
}: {
  body: Record<string, unknown>;
  sessionAccessToken: string;
}) {
  const { contentType, errors, fieldKey, filename, size } =
    validateImageMetadata(body);

  if (Object.keys(errors).length > 0 || !size) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const client = createKendraExternalProjectsClient(sessionAccessToken);
  const uploadUrl = (await client.createAssetUploadUrl(getKendraWorkspaceId(), {
    collectionType: KENDRA_SITE_CONTENT_COLLECTION_SLUG,
    contentType: contentType || "application/octet-stream",
    entrySlug: KENDRA_SITE_CONTENT_ENTRY_SLUG,
    filename: prepareKendraSiteImageFilename(fieldKey, filename),
    size,
    upsert: true,
  } as Parameters<ExternalProjectsClient["createAssetUploadUrl"]>[1] & {
    contentType: string;
    size: number;
  })) as KendraSignedAssetUploadUrl;

  return NextResponse.json({
    fullPath: uploadUrl.fullPath,
    headers: buildKendraSignedUploadHeaders(uploadUrl, contentType),
    method: "PUT",
    path: uploadUrl.path,
    signedUrl: uploadUrl.signedUrl,
  });
}

async function finalizeUpload({
  body,
  sessionAccessToken,
}: {
  body: Record<string, unknown>;
  sessionAccessToken: string;
}) {
  const { contentType, errors, fieldKey, filename, size } =
    validateImageMetadata(body);
  const path = readString(body, "path");

  if (!path || !isExternalProjectStoragePath(path)) {
    errors.path = "Uploaded image path is invalid.";
  }

  if (Object.keys(errors).length > 0 || !size) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const workspaceId = getKendraWorkspaceId();
  const client = createKendraExternalProjectsClient(sessionAccessToken);
  const { entryId } = await ensureKendraAdminSiteContentEntry(
    client,
    workspaceId,
  );

  if (!entryId) {
    return NextResponse.json(
      { error: "Site content entry is not available." },
      { status: 500 },
    );
  }

  const createdAsset = await client.createAsset(workspaceId, {
    alt_text: `${fieldKey} image`,
    asset_type: "image",
    block_id: null,
    entry_id: entryId,
    metadata: {
      contentType: contentType || null,
      fieldKey,
      filename,
      size,
    },
    sort_order: 0,
    source_url: null,
    storage_path: path,
  });
  const assetId = readAssetId(createdAsset);

  if (!assetId) {
    throw new Error(
      "The image uploaded, but its asset record could not be read.",
    );
  }

  const assetUrl = client.getAssetUrl(workspaceId, assetId);

  return NextResponse.json({
    assetId,
    assetUrl,
    path,
    previewUrl: `${assetUrl}?width=1200`,
  });
}

export async function POST(request: Request) {
  const session = await getKendraAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);

  if (!body) {
    return NextResponse.json(
      { error: "Send upload metadata as JSON." },
      { status: 400 },
    );
  }

  try {
    return readString(body, "phase") === "finalize"
      ? await finalizeUpload({
          body,
          sessionAccessToken: session.accessToken,
        })
      : await prepareUploadUrl({
          body,
          sessionAccessToken: session.accessToken,
        });
  } catch (error) {
    return createKendraAdminErrorResponse(error, "Image upload failed", {
      label: "Uploading image",
      step: "site-image-upload",
    });
  }
}
