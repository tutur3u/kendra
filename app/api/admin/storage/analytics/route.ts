import { NextResponse } from "next/server";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { getKendraStorageAnalytics } from "@/lib/kendra-storage-analytics";

export async function GET() {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	return auth.withSessionCookie(
		NextResponse.json(
			await getKendraStorageAnalytics(auth.session.accessToken),
		),
	);
}
