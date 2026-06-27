import { describe, expect, test } from "bun:test";
import { DEFAULT_KENDRA_EDITABLE_SITE_CONTENT } from "./kendra-admin-site-content-model";
import {
  getUnusedKendraSiteImageRemovals,
  parseKendraSiteImageAssetReference,
} from "./kendra-admin-site-image";

describe("Kendra admin site image helpers", () => {
  test("parses current-workspace managed asset URLs", () => {
    expect(
      parseKendraSiteImageAssetReference(
        "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/asset-1?width=1200",
        {
          apiBaseUrl: "https://tuturuuu.com/api/v1",
          workspaceId: "ws-1",
        },
      ),
    ).toEqual({
      assetId: "asset-1",
      kind: "asset",
      workspaceId: "ws-1",
    });
    expect(
      parseKendraSiteImageAssetReference(
        "/api/v1/workspaces/ws-1/external-projects/assets/asset-2",
        {
          apiBaseUrl: "https://tuturuuu.com/api/v1",
          workspaceId: "ws-1",
        },
      ),
    ).toEqual({
      assetId: "asset-2",
      kind: "asset",
      workspaceId: "ws-1",
    });
  });

  test("classifies local, unrelated external, and cross-workspace references", () => {
    const options = {
      apiBaseUrl: "https://tuturuuu.com/api/v1",
      workspaceId: "ws-1",
    };

    expect(parseKendraSiteImageAssetReference("", options)).toEqual({
      kind: "none",
    });
    expect(
      parseKendraSiteImageAssetReference("/images/featured.png", options),
    ).toEqual({ kind: "none" });
    expect(
      parseKendraSiteImageAssetReference(
        "https://cdn.example.com/photo.png",
        options,
      ),
    ).toEqual({ kind: "none" });
    expect(
      parseKendraSiteImageAssetReference(
        "https://tuturuuu.com/api/v1/workspaces/ws-2/external-projects/assets/asset-2",
        options,
      ),
    ).toEqual({ kind: "cross-workspace", workspaceId: "ws-2" });
  });

  test("filters cleanup removals to unused image references only", () => {
    const sharedAssetUrl =
      "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/shared";
    const removedAssetUrl =
      "https://tuturuuu.com/api/v1/workspaces/ws-1/external-projects/assets/removed";
    const content = {
      ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT,
      clientLogos: [
        {
          image: sharedAssetUrl,
          name: "Shared Client",
        },
      ],
      site: {
        ...DEFAULT_KENDRA_EDITABLE_SITE_CONTENT.site,
        heroImage: "",
      },
    };

    expect(
      getUnusedKendraSiteImageRemovals(content, [
        { fieldKey: "site.heroImage", value: sharedAssetUrl },
        { fieldKey: "site.clientProofImage", value: removedAssetUrl },
        { fieldKey: "clientLogos.0.image", value: removedAssetUrl },
        { fieldKey: "site.heroImage", value: "" },
      ]),
    ).toEqual([{ fieldKey: "site.clientProofImage", value: removedAssetUrl }]);
  });
});
