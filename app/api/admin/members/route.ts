import { NextResponse } from "next/server";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { getKendraMembers } from "@/lib/kendra-members";

export const dynamic = "force-dynamic";

export async function GET() {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	return auth.withSessionCookie(
		NextResponse.json(await getKendraMembers(auth.session.accessToken)),
	);
}
