import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KendraAdminClient } from "../components/kendra-admin-client";
import { KendraAdminLoginPanel } from "../components/kendra-admin-login-panel";
import { getKendraCentralizedLoginHref } from "./login-link";
import { resolveKendraAdminTargetKey } from "@/lib/kendra-config";
import {
	getKendraAdminSessionReadState,
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
	const loginHref = await getKendraCentralizedLoginHref(targetKey);
	const sessionState = await getKendraAdminSessionReadState();

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
			userEmail={session.user.email}
		/>
	);
}
