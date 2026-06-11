"use client";

type RefreshSessionResponse = {
	expiresAt?: string;
	refreshEarlySeconds?: number;
	valid?: boolean;
};

export async function refreshKendraAdminSession() {
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
	let timeout: ReturnType<typeof setTimeout> | null = null;
	const earlySeconds =
		typeof refreshEarlySeconds === "number" && Number.isFinite(refreshEarlySeconds)
			? Math.max(60, refreshEarlySeconds)
			: 300;

	const schedule = (nextExpiresAt: string) => {
		if (cancelled) return;
		if (timeout) clearTimeout(timeout);

		const expiresAtMs = new Date(nextExpiresAt).getTime();
		const fallbackDelay = 5 * 60 * 1000;
		const delay = Number.isFinite(expiresAtMs)
			? Math.max(0, expiresAtMs - Date.now() - earlySeconds * 1000)
			: fallbackDelay;

		timeout = setTimeout(async () => {
			const payload = await refreshKendraAdminSession();

			if (cancelled) return;

			if (payload?.expiresAt) {
				onRefresh?.(payload);
				schedule(payload.expiresAt);
				return;
			}

			schedule(new Date(Date.now() + fallbackDelay).toISOString());
		}, delay);
	};

	schedule(expiresAt);

	return () => {
		cancelled = true;
		if (timeout) clearTimeout(timeout);
	};
}
