"use client";

import type { RefreshSessionResponse } from "./kendra-admin-session-client";

export type KendraAdminSessionHint = {
	authenticated: true;
	email: string | null;
	expiresAt: string;
	refreshEarlySeconds?: number | null;
};

const SESSION_HINT_KEY = "kendra_admin_session_hint";

function getLocalStorage() {
	if (typeof window === "undefined") return null;

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function isSessionHint(value: unknown): value is KendraAdminSessionHint {
	if (!value || typeof value !== "object") return false;

	const payload = value as Record<string, unknown>;
	return (
		payload.authenticated === true &&
		typeof payload.expiresAt === "string" &&
		(payload.email === null || typeof payload.email === "string")
	);
}

export function clearKendraAdminSessionHint() {
	const localStorage = getLocalStorage();
	if (!localStorage) return;

	try {
		localStorage.removeItem(SESSION_HINT_KEY);
	} catch {
		// Ignore storage access errors from private browsing or blocked storage.
	}
}

export function readKendraAdminSessionHint() {
	const localStorage = getLocalStorage();
	if (!localStorage) return null;

	try {
		const value = localStorage.getItem(SESSION_HINT_KEY);
		if (!value) return null;

		const payload = JSON.parse(value) as unknown;
		if (!isSessionHint(payload)) {
			clearKendraAdminSessionHint();
			return null;
		}

		return payload;
	} catch {
		clearKendraAdminSessionHint();
		return null;
	}
}

export function writeKendraAdminSessionHint(
	hint: Pick<KendraAdminSessionHint, "email" | "expiresAt"> & {
		refreshEarlySeconds?: number | null;
	},
) {
	const localStorage = getLocalStorage();
	if (!localStorage) return;

	try {
		localStorage.setItem(
			SESSION_HINT_KEY,
			JSON.stringify({
				authenticated: true,
				email: hint.email ?? null,
				expiresAt: hint.expiresAt,
				refreshEarlySeconds: hint.refreshEarlySeconds ?? null,
			} satisfies KendraAdminSessionHint),
		);
	} catch {
		// Ignore storage access errors from private browsing or blocked storage.
	}
}

export function writeKendraAdminSessionRefreshHint({
	fallbackEmail = null,
	payload,
}: {
	fallbackEmail?: string | null;
	payload: RefreshSessionResponse;
}) {
	if (!payload.expiresAt) return;

	writeKendraAdminSessionHint({
		email: payload.email ?? fallbackEmail,
		expiresAt: payload.expiresAt,
		refreshEarlySeconds: payload.refreshEarlySeconds ?? null,
	});
}
