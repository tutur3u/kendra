import { NextResponse } from "next/server";
import type { KendraAdminSession } from "@/lib/kendra-session";
import {
	getKendraSessionReadStateFromCookies,
	refreshKendraSessionFromCookies,
	setKendraSessionCookie,
} from "@/lib/kendra-session";

function createSessionPayload(session: KendraAdminSession) {
	return {
		authenticated: true,
		email: session.user.email,
		expiresAt: session.expiresAt,
		refreshEarlySeconds: session.refreshEarlySeconds,
	};
}

function createSignedOutPayload() {
	return {
		authenticated: false,
		email: null,
		expiresAt: null,
		refreshEarlySeconds: null,
	};
}

export async function GET() {
	try {
		const state = await getKendraSessionReadStateFromCookies();

		if (state.status === "authenticated") {
			return NextResponse.json(createSessionPayload(state.session));
		}

		if (state.status === "refreshable") {
			const session = await refreshKendraSessionFromCookies();

			if (session) {
				const response = NextResponse.json(createSessionPayload(session));
				setKendraSessionCookie(response, session);
				return response;
			}
		}

		return NextResponse.json(createSignedOutPayload());
	} catch {
		return NextResponse.json(createSignedOutPayload());
	}
}
