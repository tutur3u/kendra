import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { refreshKendraReels } from "@/lib/kendra-admin-reels";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { NextResponse } from "next/server";

export async function POST() {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		return auth.withSessionCookie(
			NextResponse.json({
				reels: await refreshKendraReels(auth.session.accessToken),
			}),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Reel refresh failed"),
		);
	}
}
