import {
	createKendraExternalProjectsClient,
	getKendraAdminSession,
	revalidateKendraContent,
} from "@/lib/kendra-admin-api";
import { getKendraAppBaseUrl, getKendraWorkspaceId } from "@/lib/kendra-config";
import { kendraExternalProjectManifest } from "@/lib/kendra-external-project-manifest";
import { uploadKendraPublicManifestAssets } from "@/lib/kendra-public-asset-sync";
import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SdkManifest = Parameters<ExternalProjectsClient["applySyncManifest"]>[1];

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Tuturuuu sync apply failed";
}

export async function POST(request: Request) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json().catch(() => null)) as { force?: unknown } | null;
		const workspaceId = getKendraWorkspaceId();
		const client = createKendraExternalProjectsClient(session.accessToken);
		const manifest = kendraExternalProjectManifest as unknown as SdkManifest;
		const appBaseUrl = getKendraAppBaseUrl(new URL(request.url).origin);

		await client.setupExternalProjectStudio(workspaceId, {
			manifest,
		});

		const publicAssetSync = await uploadKendraPublicManifestAssets(
			client,
			workspaceId,
			manifest,
			{ appBaseUrl },
		);

		if (publicAssetSync.skipped.length > 0) {
			return NextResponse.json(
				{
					error: "Missing public assets. Upload aborted before applying the manifest.",
					publicAssetSync: {
						skipped: publicAssetSync.skipped,
						uploaded: publicAssetSync.uploaded,
					},
				},
				{ status: 400 },
			);
		}

		const result = await client.applySyncManifest(workspaceId, publicAssetSync.manifest, {
			force: body?.force === true,
		});

		revalidateKendraContent();
		return NextResponse.json({
			...result,
			publicAssetSync: {
				skipped: publicAssetSync.skipped,
				uploaded: publicAssetSync.uploaded,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}
