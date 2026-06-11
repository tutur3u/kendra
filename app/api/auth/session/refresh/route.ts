import {
	refreshKendraSessionFromCookies,
	setKendraSessionCookie,
} from "@/lib/kendra-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
	const session = await refreshKendraSessionFromCookies();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const response = NextResponse.json({
		expiresAt: session.expiresAt,
		refreshEarlySeconds: session.refreshEarlySeconds,
		userId: session.user.id,
		valid: true,
	});

	setKendraSessionCookie(response, session);
	return response;
}
