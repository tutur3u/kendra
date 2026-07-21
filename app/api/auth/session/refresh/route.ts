import {
	refreshKendraSessionFromCookies,
	setKendraSessionCookie,
} from "@/lib/kendra-session";
import { sanitizeKendraNextPath } from "@/lib/kendra-config";
import { type NextRequest, NextResponse } from "next/server";

function readRefreshNextPath(request: NextRequest) {
	return sanitizeKendraNextPath(
		request.nextUrl.searchParams.get("nextUrl"),
		request.nextUrl.origin,
		"/admin",
	);
}

export async function GET(request: NextRequest) {
	const session = await refreshKendraSessionFromCookies();

	if (!session) {
		return NextResponse.redirect(
			new URL("/admin/login?next=dashboard", request.nextUrl.origin),
		);
	}

	const response = NextResponse.redirect(
		new URL(readRefreshNextPath(request), request.nextUrl.origin),
	);
	setKendraSessionCookie(response, session);
	return response;
}

export async function POST() {
	const session = await refreshKendraSessionFromCookies();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const response = NextResponse.json({
		email: session.user.email,
		expiresAt: session.expiresAt,
		refreshEarlySeconds: session.refreshEarlySeconds,
		userId: session.user.id,
		valid: true,
	});

	setKendraSessionCookie(response, session);
	return response;
}
