import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { KendraAdminClient } from "../components/kendra-admin-client";
import { KendraAdminLoadingPanel } from "../components/kendra-admin-loading-panel";
import { KendraAdminLoginPanel } from "../components/kendra-admin-login-panel";
import { getKendraCentralizedLoginHref } from "./login-link";
import {
	getKendraTuturuuuDrivePathPrefix,
	getKendraTuturuuuDriveUrl,
	getKendraTuturuuuMembersUrl,
	getKendraTuturuuuTasksUrl,
	resolveKendraAdminTargetKey,
} from "@/lib/kendra-config";
import {
	getKendraAdminSessionReadState,
	getKendraAdminStudio,
	type KendraAdminStudioPayload,
} from "@/lib/kendra-admin-api";
import { readKendraAdminReels } from "@/lib/kendra-admin-reel-model";

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

export default function AdminPage({
	searchParams,
}: {
	searchParams: Promise<{ target?: string }>;
}) {
	return (
		<Suspense fallback={<KendraAdminLoadingPanel />}>
			<KendraAdminContent searchParams={searchParams} />
		</Suspense>
	);
}

async function KendraAdminContent({
	searchParams,
}: {
	searchParams: Promise<{ target?: string }>;
}) {
	await connection();

	const params = await searchParams;
	const targetKey = resolveKendraAdminTargetKey(params.target);
	const [loginHref, sessionState] = await Promise.all([
		getKendraCentralizedLoginHref(targetKey),
		getKendraAdminSessionReadState(),
	]);

	if (sessionState.status === "unauthenticated") {
		return <KendraAdminLoginPanel loginHref={loginHref} />;
	}

	if (sessionState.status === "refreshable") {
		redirect(
			`/api/auth/session/refresh?nextUrl=${encodeURIComponent("/admin")}`,
		);
	}

	const { session } = sessionState;

	const studio = await getKendraAdminStudio(session.accessToken).catch(() =>
		emptyStudio(),
	);

	return (
		<KendraAdminClient
			initialReels={readKendraAdminReels(studio)}
			sessionExpiresAt={session.expiresAt}
			sessionRefreshEarlySeconds={session.refreshEarlySeconds}
			tuturuuuDrivePathPrefix={getKendraTuturuuuDrivePathPrefix()}
			tuturuuuDriveUrl={getKendraTuturuuuDriveUrl()}
			tuturuuuMembersUrl={getKendraTuturuuuMembersUrl()}
			tuturuuuTasksUrl={getKendraTuturuuuTasksUrl()}
			userEmail={session.user.email}
		/>
	);
}
