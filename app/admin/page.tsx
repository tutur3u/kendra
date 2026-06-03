import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KendraAdminClient } from "../components/kendra-admin-client";
import {
	getKendraAdminLoginPath,
	resolveKendraAdminTargetKey,
} from "@/lib/kendra-config";
import {
	getKendraAdminSession,
	getKendraAdminStudio,
	type KendraAdminStudioPayload,
} from "@/lib/kendra-admin-api";
import { readKendraAdminReels } from "@/lib/kendra-admin-reel-model";

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
		redirect(getKendraAdminLoginPath(targetKey));
	}

	const studio = await getKendraAdminStudio(session.accessToken).catch(
		() => emptyStudio(),
	);

	return (
		<KendraAdminClient
			initialReels={readKendraAdminReels(studio)}
			userEmail={session.user.email}
		/>
	);
}
