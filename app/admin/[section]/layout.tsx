import type { ReactNode } from "react";
import { KendraAdminShell } from "../../components/kendra-admin-shell";
import { getKendraTuturuuuTasksUrl } from "@/lib/kendra-config";

export default function AdminSectionLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<KendraAdminShell tasksHref={getKendraTuturuuuTasksUrl()}>
			{children}
		</KendraAdminShell>
	);
}
