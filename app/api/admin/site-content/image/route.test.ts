import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";

const deleteAsset = mock(async () => ({ id: "asset-1" }));
let hasSession = true;

mock.module("@/lib/kendra-admin-api", () => ({
  createKendraExternalProjectsClient: () => ({
    deleteAsset,
  }),
}));

mock.module("@/lib/kendra-admin-route-session", () => ({
  getKendraAdminRouteSession: async () =>
    hasSession
      ? {
          session: { accessToken: "app-token" },
          withSessionCookie: (response: NextResponse) => response,
        }
      : {
          response: NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          ),
          session: null,
          withSessionCookie: null,
        },
}));

mock.module("@/lib/kendra-config", () => ({
  getKendraApiBaseUrl: () => "https://tuturuuu.com/api/v1",
  getKendraWorkspaceId: () => "ws-1",
}));

const { DELETE } = await import("./route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/site-content/image", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
}

describe("Kendra site image removal route", () => {
  beforeEach(() => {
    deleteAsset.mockClear();
    hasSession = true;
  });

  test("deletes a managed current-workspace asset URL", async () => {
    const response = await DELETE(
      createRequest({
        fieldKey: "site.heroImage",
        value:
          "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1?width=1200",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ assetId: "asset-1", deleted: true });
    expect(deleteAsset).toHaveBeenCalledWith("ws-1", "asset-1");
  });

  test("does not delete local, blank, or unrelated external image values", async () => {
    for (const value of [
      "",
      "/images/featured.png",
      "https://cdn.example.com/photo.png",
    ]) {
      const response = await DELETE(
        createRequest({
          fieldKey: "site.heroImage",
          value,
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ deleted: false });
    }

    expect(deleteAsset).not.toHaveBeenCalled();
  });

  test("rejects invalid field keys and cross-workspace asset URLs", async () => {
    const invalidFieldResponse = await DELETE(
      createRequest({
        fieldKey: "site.resumeUrl",
        value:
          "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1",
      }),
    );
    const crossWorkspaceResponse = await DELETE(
      createRequest({
        fieldKey: "site.heroImage",
        value:
          "https://tuturuuu.com/api/v1/workspaces/ws-2/external-projects/assets/asset-2",
      }),
    );

    expect(invalidFieldResponse.status).toBe(400);
    expect(crossWorkspaceResponse.status).toBe(400);
    expect(await crossWorkspaceResponse.json()).toEqual({
      error: "Image does not belong to this workspace.",
    });
    expect(deleteAsset).not.toHaveBeenCalled();
  });

  test("requires an admin session", async () => {
    hasSession = false;

    const response = await DELETE(
      createRequest({
        fieldKey: "site.heroImage",
        value:
          "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1",
      }),
    );

    expect(response.status).toBe(401);
    expect(deleteAsset).not.toHaveBeenCalled();
  });
});
