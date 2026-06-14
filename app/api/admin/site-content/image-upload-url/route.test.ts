import { beforeEach, describe, expect, mock, test } from "bun:test";

const createAssetUploadUrl = mock(async () => ({
  fullPath:
    "ws-1/external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
  path: "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
  signedUrl: "https://storage.example/upload/hero.png",
  token: "signed-upload-token",
}));
const createAsset = mock(async () => ({
  id: "asset-1",
  storage_path:
    "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
}));
const getAssetUrl = mock(
  (workspaceId: string, assetId: string) =>
    `https://tuturuuu.com/api/v1/workspaces/${workspaceId}/external-projects/assets/${assetId}`,
);
const ensureKendraAdminSiteContentEntry = mock(async () => ({
  content: null,
  entryId: "entry-1",
}));
let hasSession = true;

mock.module("@/lib/kendra-admin-api", () => ({
  buildKendraSignedUploadHeaders: (
    uploadUrl: {
      contentType?: string;
      headers?: Record<string, string>;
      token?: string;
    },
    contentType?: string,
  ) => ({
    ...(uploadUrl.headers ?? {}),
    ...(uploadUrl.token ? { Authorization: `Bearer ${uploadUrl.token}` } : {}),
    "Content-Type":
      uploadUrl.contentType || contentType || "application/octet-stream",
  }),
  createKendraExternalProjectsClient: () => ({
    createAsset,
    createAssetUploadUrl,
    getAssetUrl,
  }),
  getKendraAdminSession: async () =>
    hasSession ? { accessToken: "app-token" } : null,
}));

mock.module("@/lib/kendra-admin-site-content", () => ({
  ensureKendraAdminSiteContentEntry,
}));

mock.module("@/lib/kendra-config", () => ({
  getKendraWorkspaceId: () => "ws-1",
}));

const { POST } = await import("./route");

function createRequest(body: Record<string, unknown>) {
  return new Request(
    "http://localhost/api/admin/site-content/image-upload-url",
    {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

describe("Kendra site image upload URL route", () => {
  beforeEach(() => {
    createAsset.mockClear();
    createAssetUploadUrl.mockClear();
    ensureKendraAdminSiteContentEntry.mockClear();
    getAssetUrl.mockClear();
    hasSession = true;
  });

  test("returns a signed direct upload target for managed image fields", async () => {
    const response = await POST(
      createRequest({
        contentType: "image/png",
        fieldKey: "site.heroImage",
        filename: "Hero.png",
        size: 5,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      fullPath:
        "ws-1/external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
      headers: {
        Authorization: "Bearer signed-upload-token",
        "Content-Type": "image/png",
      },
      method: "PUT",
      path: "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
      signedUrl: "https://storage.example/upload/hero.png",
    });
    expect(createAssetUploadUrl).toHaveBeenCalledWith("ws-1", {
      collectionType: "site-content",
      contentType: "image/png",
      entrySlug: "site-content",
      filename: "site-heroimage-hero.png",
      size: 5,
      upsert: true,
    });
  });

  test("finalizes uploaded images as stable public asset URLs", async () => {
    const response = await POST(
      createRequest({
        contentType: "image/png",
        fieldKey: "site.heroImage",
        filename: "Hero.png",
        path: "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
        phase: "finalize",
        size: 5,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      assetId: "asset-1",
      assetUrl:
        "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1",
      path: "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
      previewUrl:
        "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1?width=1200",
    });
    expect(ensureKendraAdminSiteContentEntry).toHaveBeenCalled();
    expect(createAsset).toHaveBeenCalledWith("ws-1", {
      alt_text: "site.heroImage image",
      asset_type: "image",
      block_id: null,
      entry_id: "entry-1",
      metadata: {
        contentType: "image/png",
        fieldKey: "site.heroImage",
        filename: "Hero.png",
        size: 5,
      },
      sort_order: 0,
      source_url: null,
      storage_path:
        "external-projects/kendra/site-content/site-content/site-heroimage-hero.png",
    });
  });

  test("rejects invalid fields and oversized files", async () => {
    const response = await POST(
      createRequest({
        contentType: "text/plain",
        fieldKey: "site.resumeUrl",
        filename: "notes.txt",
        size: 13 * 1024 * 1024,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.errors).toEqual({
      fieldKey: "Choose an editable image field.",
      filename: "Choose an image file.",
      size: "Choose an image under 12 MB.",
    });
    expect(createAssetUploadUrl).not.toHaveBeenCalled();
  });

  test("requires an admin session", async () => {
    hasSession = false;
    const response = await POST(
      createRequest({
        contentType: "image/png",
        fieldKey: "site.heroImage",
        filename: "Hero.png",
        size: 5,
      }),
    );

    expect(response.status).toBe(401);
    expect(createAssetUploadUrl).not.toHaveBeenCalled();
  });
});
