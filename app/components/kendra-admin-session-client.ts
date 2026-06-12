"use client";

export type RefreshSessionResponse = {
	expiresAt?: string;
	refreshEarlySeconds?: number;
	valid?: boolean;
};

const FALLBACK_REFRESH_DELAY_MS = 5 * 60 * 1000;
const MAX_REFRESH_LEAD_SECONDS = 30;
const MIN_REFRESH_LEAD_SECONDS = 5;

let pendingRefresh: Promise<RefreshSessionResponse | null> | null = null;

export function getKendraAdminSessionRefreshLeadSeconds(
	refreshEarlySeconds?: number | null,
) {
	const requested =
		typeof refreshEarlySeconds === "number" &&
		Number.isFinite(refreshEarlySeconds)
			? refreshEarlySeconds
			: MAX_REFRESH_LEAD_SECONDS;

	return Math.min(
		MAX_REFRESH_LEAD_SECONDS,
		Math.max(MIN_REFRESH_LEAD_SECONDS, requested),
	);
}

export function getKendraAdminSessionRefreshDelayMs({
	expiresAt,
	now = Date.now(),
	refreshEarlySeconds,
}: {
	expiresAt: string;
	now?: number;
	refreshEarlySeconds?: number | null;
}) {
	const expiresAtMs = new Date(expiresAt).getTime();

	if (!Number.isFinite(expiresAtMs)) {
		return FALLBACK_REFRESH_DELAY_MS;
	}

	return Math.max(
		0,
		expiresAtMs -
			now -
			getKendraAdminSessionRefreshLeadSeconds(refreshEarlySeconds) * 1000,
	);
}

async function requestKendraAdminSessionRefresh() {
	try {
		const response = await fetch("/api/auth/session/refresh", {
			cache: "no-store",
			credentials: "same-origin",
			method: "POST",
		});
		const payload = (await response.json().catch(() => null)) as
			| RefreshSessionResponse
			| null;

		return response.ok && payload?.valid ? payload : null;
	} catch {
		return null;
	}
}

export function refreshKendraAdminSession() {
	if (!pendingRefresh) {
		pendingRefresh = requestKendraAdminSessionRefresh().finally(() => {
			pendingRefresh = null;
		});
	}

	return pendingRefresh;
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	const response = await fetch(input, {
		...init,
		credentials: init.credentials ?? "same-origin",
	});

	if (response.status !== 401) {
		return response;
	}

	const refreshed = await refreshKendraAdminSession();

	if (!refreshed) {
		return response;
	}

	return fetch(input, {
		...init,
		credentials: init.credentials ?? "same-origin",
	});
}

export function scheduleKendraAdminSessionRefresh({
	expiresAt,
	onRefresh,
	refreshEarlySeconds,
}: {
	expiresAt: string;
	onRefresh?: (payload: RefreshSessionResponse) => void;
	refreshEarlySeconds?: number | null;
}) {
	let cancelled = false;
	let currentExpiresAt = expiresAt;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	const schedule = (nextExpiresAt: string) => {
		if (cancelled) return;
		if (timeout) clearTimeout(timeout);

		currentExpiresAt = nextExpiresAt;
		timeout = setTimeout(
			() => void refreshNow(),
			getKendraAdminSessionRefreshDelayMs({
				expiresAt: currentExpiresAt,
				refreshEarlySeconds,
			}),
		);
	};

	const refreshNow = async () => {
		const payload = await refreshKendraAdminSession();

		if (cancelled) return;

		if (payload?.expiresAt) {
			onRefresh?.(payload);
			schedule(payload.expiresAt);
			return;
		}

		schedule(new Date(Date.now() + FALLBACK_REFRESH_DELAY_MS).toISOString());
	};

	const refreshIfNeeded = () => {
		if (cancelled) return;

		if (
			typeof document !== "undefined" &&
			document.visibilityState === "hidden"
		) {
			return;
		}

		const delay = getKendraAdminSessionRefreshDelayMs({
			expiresAt: currentExpiresAt,
			refreshEarlySeconds,
		});

		if (delay <= 0) {
			void refreshNow();
		}
	};

	if (typeof window !== "undefined") {
		window.addEventListener("focus", refreshIfNeeded);
	}

	if (typeof document !== "undefined") {
		document.addEventListener("visibilitychange", refreshIfNeeded);
	}

	schedule(expiresAt);

	return () => {
		cancelled = true;
		if (timeout) clearTimeout(timeout);
		if (typeof window !== "undefined") {
			window.removeEventListener("focus", refreshIfNeeded);
		}
		if (typeof document !== "undefined") {
			document.removeEventListener("visibilitychange", refreshIfNeeded);
		}
	};
}
