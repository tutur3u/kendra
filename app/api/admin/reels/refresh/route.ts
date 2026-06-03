import { getKendraAdminSession } from "@/lib/kendra-admin-api";
import { refreshKendraReels } from "@/lib/kendra-admin-reels";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Reel refresh failed";
}

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
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}
