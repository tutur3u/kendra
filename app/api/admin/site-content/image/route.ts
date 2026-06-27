import {
  createKendraExternalProjectsClient,
} from "@/lib/kendra-admin-api";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import {
  isKendraSiteImageFieldKey,
  parseKendraSiteImageAssetReference,
} from "@/lib/kendra-admin-site-image";
import { getKendraApiBaseUrl, getKendraWorkspaceId } from "@/lib/kendra-config";
import { NextResponse } from "next/server";

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

async function readJsonBody(request: Request) {
  try {
    return readRecord(await request.json());
  } catch {
    return null;
  }
}

export async function DELETE(request: Request) {
  const auth = await getKendraAdminRouteSession();

  if (!auth.session) {
    return auth.response;
  }

  const body = await readJsonBody(request);

  if (!body) {
    return NextResponse.json(
      { error: "Send image removal metadata as JSON." },
      { status: 400 },
    );
  }

  const fieldKey = readString(body, "fieldKey");
  const value = readString(body, "value");

  if (!fieldKey || !isKendraSiteImageFieldKey(fieldKey)) {
    return auth.withSessionCookie(
      NextResponse.json(
        { errors: { fieldKey: "Choose an editable image field." } },
        { status: 400 },
      ),
    );
  }

  try {
    const workspaceId = getKendraWorkspaceId();
    const reference = parseKendraSiteImageAssetReference(value, {
      apiBaseUrl: getKendraApiBaseUrl(),
      workspaceId,
    });

    if (reference.kind === "none") {
      return auth.withSessionCookie(NextResponse.json({ deleted: false }));
    }

    if (reference.kind === "cross-workspace") {
      return auth.withSessionCookie(
        NextResponse.json(
          { error: "Image does not belong to this workspace." },
          { status: 400 },
        ),
      );
    }

    const client = createKendraExternalProjectsClient(auth.session.accessToken);
    await client.deleteAsset(workspaceId, reference.assetId);

    return auth.withSessionCookie(
      NextResponse.json({ assetId: reference.assetId, deleted: true }),
    );
  } catch (error) {
    return auth.withSessionCookie(
      createKendraAdminErrorResponse(error, "Image removal failed", {
        label: "Removing image",
        step: "site-image-remove",
      }),
    );
  }
}
