import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
	getKendraApiBaseUrl,
	getKendraAppId,
	getKendraAppSecret,
	getKendraWorkspaceId,
} from "./kendra-config";

const KENDRA_SESSION_COOKIE = "kendra_admin_session";
const SESSION_VERSION = "v1";
const KENDRA_ADMIN_SCOPES = ["external-projects:*"] as const;

export type KendraAdminSession = {
	accessToken: string;
	app: {
		name: string;
	};
	expiresAt: string;
	refreshEarlySeconds?: number;
	refreshExpiresAt?: string;
	refreshToken?: string;
	tokenType: "Bearer";
	workspaceId: string;
	user: {
		email: string | null;
		id: string;
	};
};

export type KendraSessionReadState =
	| {
			session: KendraAdminSession;
			status: "authenticated";
	  }
	| {
			session: KendraAdminSession;
			status: "refreshable";
	  }
	| {
			session: null;
			status: "unauthenticated";
	  };

export type KendraSessionReadPreparation = {
	candidate: KendraAdminSession | null;
	state: Promise<KendraSessionReadState>;
};

export type KendraAppTokenExchangeResponse = {
	accessToken?: string;
	app?: {
		name?: string;
	};
	error?: string;
	expiresAt?: string;
	refreshEarlySeconds?: number;
	refreshExpiresAt?: string;
	refreshToken?: string;
	tokenType?: string;
	workspaceId?: string | null;
	user?: {
		email?: string | null;
		id?: string;
	};
};

function getSessionSecret() {
	const secret = process.env.KENDRA_SESSION_SECRET ?? process.env.KENDRA_APP_SECRET;

	if (!secret?.trim()) {
		throw new Error("[kendra] Missing KENDRA_SESSION_SECRET or KENDRA_APP_SECRET.");
	}

	return createHash("sha256").update(secret.trim()).digest();
}

function encode(value: Buffer) {
	return value.toString("base64url");
}

function decode(value: string) {
	return Buffer.from(value, "base64url");
}

function readTimestamp(value: string | null | undefined) {
	if (!value) return null;

	const timestamp = new Date(value).getTime();
	return Number.isFinite(timestamp) ? timestamp : null;
}

function isAccessTokenCurrent(session: Pick<KendraAdminSession, "expiresAt">) {
	const expiresAt = readTimestamp(session.expiresAt);
	return expiresAt !== null && expiresAt > Date.now();
}

function isRefreshTokenCurrent(session: Pick<KendraAdminSession, "refreshExpiresAt" | "refreshToken">) {
	const expiresAt = readTimestamp(session.refreshExpiresAt);
	return Boolean(session.refreshToken) && expiresAt !== null && expiresAt > Date.now();
}

function getSessionCookieExpiresAt(session: KendraAdminSession) {
	const refreshExpiresAt = readTimestamp(session.refreshExpiresAt);
	const accessExpiresAt = readTimestamp(session.expiresAt);
	const expiresAt = Math.max(refreshExpiresAt ?? 0, accessExpiresAt ?? 0);

	return new Date(expiresAt || Date.now());
}

function getKendraSessionCookieOptions(session: KendraAdminSession) {
	return {
		expires: getSessionCookieExpiresAt(session),
		httpOnly: true,
		path: "/",
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
	};
}

function sealSession(session: KendraAdminSession) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", getSessionSecret(), iv);
	const plaintext = Buffer.from(JSON.stringify(session), "utf8");
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();

	return [SESSION_VERSION, encode(iv), encode(tag), encode(ciphertext)].join(".");
}

function unsealSession(value: string): KendraAdminSession | null {
	const [version, encodedIv, encodedTag, encodedCiphertext] = value.split(".");

	if (version !== SESSION_VERSION || !encodedIv || !encodedTag || !encodedCiphertext) {
		return null;
	}

	try {
		const decipher = createDecipheriv("aes-256-gcm", getSessionSecret(), decode(encodedIv));
		decipher.setAuthTag(decode(encodedTag));
		const plaintext = Buffer.concat([
			decipher.update(decode(encodedCiphertext)),
			decipher.final(),
		]).toString("utf8");
		const session = JSON.parse(plaintext) as KendraAdminSession;

		if (!session.accessToken || !session.user?.id || !session.expiresAt || !session.workspaceId) {
			return null;
		}

		if (!isAccessTokenCurrent(session) && !isRefreshTokenCurrent(session)) {
			return null;
		}

		if (session.workspaceId !== getKendraWorkspaceId()) {
			return null;
		}

		return session;
	} catch {
		return null;
	}
}

export function createKendraSessionFromExchangePayload(
	payload: KendraAppTokenExchangeResponse,
	fallback?: KendraAdminSession,
): KendraAdminSession {
	const workspaceId = payload.workspaceId ?? fallback?.workspaceId;
	const userId = payload.user?.id ?? fallback?.user.id;

	if (!payload.accessToken || !payload.expiresAt || !userId || !workspaceId) {
		throw new Error("Invalid Tuturuuu app token exchange response.");
	}

	return {
		accessToken: payload.accessToken,
		app: {
			name: payload.app?.name ?? fallback?.app.name ?? getKendraAppId(),
		},
		expiresAt: payload.expiresAt,
		refreshEarlySeconds:
			typeof payload.refreshEarlySeconds === "number" &&
			Number.isFinite(payload.refreshEarlySeconds)
				? payload.refreshEarlySeconds
				: fallback?.refreshEarlySeconds,
		refreshExpiresAt: payload.refreshExpiresAt ?? fallback?.refreshExpiresAt,
		refreshToken: payload.refreshToken ?? fallback?.refreshToken,
		tokenType: "Bearer",
		workspaceId,
		user: {
			email: payload.user?.email ?? fallback?.user.email ?? null,
			id: userId,
		},
	};
}

function getKendraSessionValidationUrl(workspaceId: string) {
	const apiBaseUrl = getKendraApiBaseUrl().replace(/\/+$/, "");
	return `${apiBaseUrl}/workspaces/${encodeURIComponent(workspaceId)}/external-projects/summary`;
}

function getKendraAppTokenExchangeUrl() {
	const apiBaseUrl = getKendraApiBaseUrl().replace(/\/+$/, "");
	return `${apiBaseUrl}/auth/app-token/exchange`;
}

async function validateKendraSession(session: KendraAdminSession) {
	try {
		const response = await fetch(getKendraSessionValidationUrl(session.workspaceId), {
			cache: "no-store",
			headers: {
				Accept: "application/json",
				Authorization: `${session.tokenType} ${session.accessToken}`,
			},
		});

		if (response.ok) {
			return "authenticated" as const;
		}

		if ([401, 403, 404].includes(response.status)) {
			return "invalid" as const;
		}

		console.warn(
			`[kendra] Session validation is temporarily unavailable (${response.status}).`,
		);
		return "unavailable" as const;
	} catch (error) {
		console.warn("[kendra] Session validation request failed.", error);
		return "unavailable" as const;
	}
}

async function refreshKendraSession(session: KendraAdminSession) {
	if (!isRefreshTokenCurrent(session)) {
		return null;
	}

	try {
		const response = await fetch(getKendraAppTokenExchangeUrl(), {
			body: JSON.stringify({
				appId: getKendraAppId(),
				appSecret: getKendraAppSecret(),
				refreshToken: session.refreshToken,
				requestedScopes: [...KENDRA_ADMIN_SCOPES],
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
			return null;
		}

		const payload = (await response.json().catch(() => null)) as
			| KendraAppTokenExchangeResponse
			| null;

		if (!payload) {
			return null;
		}

		return createKendraSessionFromExchangePayload(payload, session);
	} catch {
		return null;
	}
}

async function getStoredKendraSession() {
	const cookieStore = await cookies();
	const value = cookieStore.get(KENDRA_SESSION_COOKIE)?.value;
	return value ? unsealSession(value) : null;
}

export async function refreshKendraSessionFromCookies() {
	const session = await getStoredKendraSession();

	if (!session) {
		return null;
	}

	const refreshed = await refreshKendraSession(session);

	if (!refreshed) {
		return null;
	}

	const validation = await validateKendraSession(refreshed);

	if (validation === "invalid") {
		return null;
	}

	return refreshed;
}

async function resolveKendraSessionReadState(
	session: KendraAdminSession | null,
): Promise<KendraSessionReadState> {
	if (!session) {
		return { session: null, status: "unauthenticated" };
	}

	if (!isAccessTokenCurrent(session)) {
		return isRefreshTokenCurrent(session)
			? { session, status: "refreshable" }
			: { session: null, status: "unauthenticated" };
	}

	const validation = await validateKendraSession(session);

	if (validation !== "invalid") {
		return { session, status: "authenticated" };
	}

	return isRefreshTokenCurrent(session)
		? { session, status: "refreshable" }
		: { session: null, status: "unauthenticated" };
}

export async function prepareKendraSessionReadFromCookies(): Promise<KendraSessionReadPreparation> {
	const session = await getStoredKendraSession();

	return {
		candidate: session && isAccessTokenCurrent(session) ? session : null,
		state: resolveKendraSessionReadState(session),
	};
}

export async function getKendraPageSessionReadStateFromCookies(): Promise<KendraSessionReadState> {
	const session = await getStoredKendraSession();

	if (!session) {
		return { session: null, status: "unauthenticated" };
	}

	if (isAccessTokenCurrent(session)) {
		return { session, status: "authenticated" };
	}

	return isRefreshTokenCurrent(session)
		? { session, status: "refreshable" }
		: { session: null, status: "unauthenticated" };
}

export async function getKendraSessionReadStateFromCookies(): Promise<KendraSessionReadState> {
	const prepared = await prepareKendraSessionReadFromCookies();
	return prepared.state;
}

export async function getKendraSessionFromCookies() {
	const state = await getKendraSessionReadStateFromCookies();
	return state.status === "authenticated" ? state.session : null;
}

export function setKendraSessionCookie(response: NextResponse, session: KendraAdminSession) {
	response.cookies.set(KENDRA_SESSION_COOKIE, sealSession(session), {
		...getKendraSessionCookieOptions(session),
	});
}

export function clearKendraSessionCookie(response: NextResponse) {
	response.cookies.set(KENDRA_SESSION_COOKIE, "", {
		expires: new Date(0),
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});
}
