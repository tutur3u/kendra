import type { Metadata } from "next";
import { KendraAdminLoginPanel } from "@/app/components/kendra-admin-login-panel";
import { getKendraCentralizedLoginHref } from "../login-link";
import { resolveKendraAdminTargetKey } from "@/lib/kendra-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Admin Login",
	description: "Tuturuuu login for the Kendra Braun admin dashboard.",
};

export default async function AdminLoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const params = await searchParams;
	const targetKey = resolveKendraAdminTargetKey(params.next);

	return (
		<KendraAdminLoginPanel
			loginHref={await getKendraCentralizedLoginHref(targetKey)}
		/>
	);
}
