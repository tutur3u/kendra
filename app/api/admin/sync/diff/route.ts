import { getKendraApiBaseUrl, getKendraWorkspaceId } from "@/lib/kendra-config";
import { kendraExternalProjectManifest } from "@/lib/kendra-external-project-manifest";
import { getKendraAdminSession } from "@/lib/kendra-admin-api";
import { linkExternalProjectPublicFolderAssets } from "tuturuuu/external-projects";
import { ExternalProjectsClient } from "tuturuuu/external-projects";
import { NextResponse } from "next/server";

type SdkManifest = Parameters<ExternalProjectsClient["diffSyncManifest"]>[1];

function createClient(accessToken: string) {
	return new ExternalProjectsClient({
		apiKey: accessToken,
		baseUrl: getKendraApiBaseUrl(),
	});
}

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Tuturuuu sync diff failed";
}

export async function POST() {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const workspaceId = getKendraWorkspaceId();
		const client = createClient(session.accessToken);
		const manifest = linkExternalProjectPublicFolderAssets(
			kendraExternalProjectManifest as unknown as SdkManifest,
		);

		await client.setupExternalProjectStudio(workspaceId, {
			manifest,
		});

		return NextResponse.json(await client.diffSyncManifest(workspaceId, manifest));
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}
