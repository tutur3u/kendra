import { NextResponse } from "next/server";
import type { KendraAdminSession } from "./kendra-session";
import {
	getKendraSessionReadStateFromCookies,
	refreshKendraSessionFromCookies,
	setKendraSessionCookie,
} from "./kendra-session";

type AuthorizedRouteSession = {
	session: KendraAdminSession;
	withSessionCookie: <T extends NextResponse>(response: T) => T;
};

type UnauthorizedRouteSession = {
	response: NextResponse;
	session: null;
	withSessionCookie: null;
};

export type KendraAdminRouteSession =
	| AuthorizedRouteSession
	| UnauthorizedRouteSession;

function createUnauthorizedSessionResult(): UnauthorizedRouteSession {
	return {
		response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
		session: null,
		withSessionCookie: null,
	};
}

export async function getKendraAdminRouteSession(): Promise<KendraAdminRouteSession> {
	const state = await getKendraSessionReadStateFromCookies();

	if (state.status === "authenticated") {
		return {
			session: state.session,
			withSessionCookie: (response) => response,
		};
	}

	if (state.status === "refreshable") {
		const session = await refreshKendraSessionFromCookies();

		if (session) {
			return {
				session,
				withSessionCookie: (response) => {
					setKendraSessionCookie(response, session);
					return response;
				},
			};
		}
	}

	return createUnauthorizedSessionResult();
}
