import {
	getKendraApiBaseUrl,
	getKendraAppId,
	getKendraAppSecret,
	getKendraWorkspaceId,
} from "@/lib/kendra-config";
import {
	createKendraSessionFromExchangePayload,
	setKendraSessionCookie,
	type KendraAppTokenExchangeResponse,
} from "@/lib/kendra-session";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

class TokenExchangeError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

function normalizeApiBaseUrl() {
	return getKendraApiBaseUrl().replace(/\/+$/, "");
}

async function readExchangeError(response: Response) {
	const fallback = `Tuturuuu app token exchange failed with status ${response.status}`;
	const payload = (await response.json().catch(() => null)) as
		| KendraAppTokenExchangeResponse
		| null;

	return payload?.error || fallback;
}

async function exchangeCrossAppToken(token: string) {
	const response = await fetch(`${normalizeApiBaseUrl()}/auth/app-token/exchange`, {
		body: JSON.stringify({
			appId: getKendraAppId(),
			appSecret: getKendraAppSecret(),
			requestedScopes: ["external-projects:*"],
			token,
			workspaceId: getKendraWorkspaceId(),
		}),
		cache: "no-store",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		method: "POST",
	});

	if (!response.ok) {
		throw new TokenExchangeError(await readExchangeError(response), response.status);
	}

	return (await response.json()) as KendraAppTokenExchangeResponse;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
		const token = typeof body?.token === "string" ? body.token.trim() : "";

		if (!token) {
			return NextResponse.json({ error: "Missing required parameter: token" }, { status: 400 });
		}

		const session = createKendraSessionFromExchangePayload(
			await exchangeCrossAppToken(token),
		);
		const response = NextResponse.json({
			expiresAt: session.expiresAt,
			refreshEarlySeconds: session.refreshEarlySeconds,
			userId: session.user.id,
			valid: true,
		});

		setKendraSessionCookie(response, session);
		return response;
	} catch (error) {
		console.error("[kendra:auth] app token exchange failed", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: error instanceof TokenExchangeError ? error.status : 500 },
		);
	}
}
