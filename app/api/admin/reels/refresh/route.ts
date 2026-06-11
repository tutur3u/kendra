import { getKendraAdminSession } from "@/lib/kendra-admin-api";
import { refreshKendraReels } from "@/lib/kendra-admin-reels";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		return NextResponse.json({
			reels: await refreshKendraReels(session.accessToken),
		});
	} catch (error) {
		return createKendraAdminErrorResponse(error, "Reel refresh failed");
	}
}
