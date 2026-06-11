import type { Metadata } from "next";
import { KendraAdminClient } from "../components/kendra-admin-client";
import { KendraAdminLoginPanel } from "../components/kendra-admin-login-panel";
import { getKendraCentralizedLoginHref } from "./login-link";
import { resolveKendraAdminTargetKey } from "@/lib/kendra-config";
import {
	getKendraAdminSession,
	getKendraAdminStudio,
	type KendraAdminStudioPayload,
} from "@/lib/kendra-admin-api";
import { readKendraAdminReels } from "@/lib/kendra-admin-reel-model";
import { getKendraStorageAnalytics } from "@/lib/kendra-storage-analytics";
import { getKendraStorageFiles } from "@/lib/kendra-storage-files";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Admin Dashboard",
	description: "Kendra audio reel management and publishing controls.",
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
		return (
			<KendraAdminLoginPanel
				loginHref={await getKendraCentralizedLoginHref(targetKey)}
			/>
		);
	}

	const [studio, storageAnalytics, storageFiles] = await Promise.all([
		getKendraAdminStudio(session.accessToken).catch(() => emptyStudio()),
		getKendraStorageAnalytics(session.accessToken),
		getKendraStorageFiles(session.accessToken),
	]);

	return (
		<KendraAdminClient
			initialReels={readKendraAdminReels(studio)}
			sessionExpiresAt={session.expiresAt}
			sessionRefreshEarlySeconds={session.refreshEarlySeconds}
			storageAnalytics={storageAnalytics}
			storageFiles={storageFiles}
			userEmail={session.user.email}
		/>
	);
}
