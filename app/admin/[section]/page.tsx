import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { KendraAdminClient } from "../../components/kendra-admin-client";
import { KendraAdminLoginPanel } from "../../components/kendra-admin-login-panel";
import { getKendraCentralizedLoginHref } from "../login-link";
import {
	getKendraTuturuuuDrivePathPrefix,
	getKendraTuturuuuDriveUrl,
	getKendraTuturuuuMembersUrl,
} from "@/lib/kendra-config";
import {
	getKendraAdminPageSessionReadState,
	getKendraAdminStudioSnapshot,
	type KendraAdminStudioPayload,
} from "@/lib/kendra-admin-api";
import { readKendraAdminReels } from "@/lib/kendra-admin-reel-model";
import { isKendraAdminSection } from "@/lib/kendra-admin-sections";

export const metadata: Metadata = {
	title: "Admin Dashboard",
	description: "Kendra audio reel management and publishing controls.",
};

function emptyStudio(): KendraAdminStudioPayload {
	return { assets: [], blocks: [], collections: [], entries: [] };
}

export default function AdminSectionPage({
	params,
}: {
	params: Promise<{ section: string }>;
}) {
	return <KendraAdminSectionContent params={params} />;
}

async function KendraAdminSectionContent({
	params,
}: {
	params: Promise<{ section: string }>;
}) {
	await connection();

	const { section } = await params;
	if (!isKendraAdminSection(section)) notFound();

	const sessionState = await getKendraAdminPageSessionReadState();

	if (sessionState.status === "unauthenticated") {
		return (
			<KendraAdminLoginPanel
				loginHref={await getKendraCentralizedLoginHref("dashboard", {
					nextUrl: `/admin/${section}`,
				})}
			/>
		);
	}

	if (sessionState.status === "refreshable") {
		redirect(
			`/api/auth/session/refresh?nextUrl=${encodeURIComponent(`/admin/${section}`)}`,
		);
	}

	const { session } = sessionState;
	const studio =
		section === "audio"
			? await getKendraAdminStudioSnapshot(session.accessToken).catch(() =>
					emptyStudio(),
				)
			: emptyStudio();

	return (
		<KendraAdminClient
			activeSection={section}
			initialReels={readKendraAdminReels(studio)}
			key={section}
			sessionExpiresAt={session.expiresAt}
			sessionRefreshEarlySeconds={session.refreshEarlySeconds}
			tuturuuuDrivePathPrefix={getKendraTuturuuuDrivePathPrefix()}
			tuturuuuDriveUrl={getKendraTuturuuuDriveUrl()}
			tuturuuuMembersUrl={getKendraTuturuuuMembersUrl()}
			userEmail={session.user.email}
		/>
	);
}
