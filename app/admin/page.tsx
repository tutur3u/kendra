import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KendraAdminClient } from "../components/kendra-admin-client";
import {
	buildKendraAdminLinks,
	getKendraAdminLoginPath,
	getKendraCmsBaseUrl,
	getKendraWebAppUrl,
	getKendraWorkspaceId,
	resolveKendraAdminTargetKey,
} from "@/lib/kendra-config";
import { kendraExternalProjectManifest } from "@/lib/kendra-external-project-manifest";
import { getKendraPublicManifestAssetPlan } from "@/lib/kendra-public-asset-sync";
import type { ExternalProjectsClient } from "tuturuuu/external-projects";
import {
	getKendraAdminSession,
	getKendraAdminStudio,
	type KendraAdminStudioPayload,
} from "@/lib/kendra-admin-api";

export const dynamic = "force-dynamic";

type SdkManifest = Parameters<ExternalProjectsClient["applySyncManifest"]>[1];

export const metadata: Metadata = {
	title: "Admin",
	description: "Kendra Tuturuuu CMS sync and admin controls.",
};

function emptyStudio(): KendraAdminStudioPayload {
	return {
		assets: [],
		blocks: [],
		collections: [],
		entries: [],
	};
}

export default async function AdminPage({
	searchParams,
}: {
	searchParams: Promise<{ target?: string }>;
}) {
	const params = await searchParams;
	const targetKey = resolveKendraAdminTargetKey(params.target);
	const session = await getKendraAdminSession();

	if (!session) {
		redirect(getKendraAdminLoginPath(targetKey));
	}

	const studio = await getKendraAdminStudio(session.accessToken).catch(
		() => emptyStudio(),
	);
	const workspaceId = getKendraWorkspaceId();

	return (
		<KendraAdminClient
			adminLinks={buildKendraAdminLinks(workspaceId)}
			publicAssets={getKendraPublicManifestAssetPlan(kendraExternalProjectManifest as unknown as SdkManifest)}
			cmsBaseUrl={getKendraCmsBaseUrl()}
			initialStudio={studio}
			initialTarget={targetKey}
			userEmail={session.user.email}
			webAppUrl={getKendraWebAppUrl()}
			workspaceId={workspaceId}
		/>
	);
}
