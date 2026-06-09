import { NextResponse } from "next/server";
import { getKendraAdminSession } from "@/lib/kendra-admin-api";
import { getKendraStorageAnalytics } from "@/lib/kendra-storage-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json(
		await getKendraStorageAnalytics(session.accessToken),
	);
}
