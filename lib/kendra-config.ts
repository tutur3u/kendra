export const KENDRA_APP_NAME = "kendra";

export type KendraAdminTargetKey = "dashboard";

type KendraAdminTarget = {
	key: KendraAdminTargetKey;
	label: string;
};

export const KENDRA_ADMIN_TARGETS: KendraAdminTarget[] = [
	{
		key: "dashboard",
		label: "Reel dashboard",
	},
];

function isEnabled(value: string | undefined) {
	return value ? ["1", "true", "yes", "on"].includes(value.trim().toLowerCase()) : false;
}

function trimTrailingSlash(value: string) {
	return value.replace(/\/+$/, "");
}

function getAdminDevMode() {
	return isEnabled(process.env.DEV_MODE ?? process.env.NEXT_PUBLIC_DEV_MODE);
}

function getConfiguredUrl({
	envName,
	localUrl,
	productionUrl,
}: {
	envName: string;
	localUrl: string;
	productionUrl: string;
}) {
	const configured = process.env[envName] ?? process.env[`NEXT_PUBLIC_${envName}`];

	if (configured?.trim()) {
		return trimTrailingSlash(configured.trim());
	}

	return getAdminDevMode() ? localUrl : productionUrl;
}

export function getKendraApiBaseUrl() {
	return (
		process.env.TUTURUUU_API_BASE_URL ??
		process.env.NEXT_PUBLIC_TUTURUUU_API_BASE_URL ??
		"https://tuturuuu.com/api/v1"
	);
}

export function getOptionalKendraWorkspaceId() {
	return (
		process.env.TUTURUUU_KENDRA_WORKSPACE_ID ??
		process.env.NEXT_PUBLIC_TUTURUUU_KENDRA_WORKSPACE_ID ??
		null
	)?.trim() || null;
}

export function getKendraWorkspaceId() {
	const workspaceId = getOptionalKendraWorkspaceId();

	if (!workspaceId) {
		throw new Error(
			"[kendra] Missing TUTURUUU_KENDRA_WORKSPACE_ID. Point it at the CMS workspace that uses the kendra adapter.",
		);
	}

	return workspaceId;
}

export function getKendraAppId() {
	return (process.env.KENDRA_APP_ID ?? KENDRA_APP_NAME).trim().toLowerCase();
}

export function getKendraAppSecret() {
	const secret = process.env.KENDRA_APP_SECRET ?? process.env.TUTURUUU_KENDRA_APP_SECRET;

	if (!secret?.trim()) {
		throw new Error("[kendra] Missing KENDRA_APP_SECRET.");
	}

	return secret.trim();
}

export function getKendraWebAppUrl() {
	return getConfiguredUrl({
		envName: "TUTURUUU_WEB_APP_URL",
		localUrl: "http://localhost:7803",
		productionUrl: "https://tuturuuu.com",
	});
}

export function getKendraAppBaseUrl(requestOrigin?: string) {
	const configured =
		process.env.KENDRA_APP_URL ??
		process.env.NEXT_PUBLIC_KENDRA_APP_URL ??
		process.env.NEXT_PUBLIC_APP_URL;

	if (configured?.trim()) {
		return trimTrailingSlash(configured.trim());
	}

	if (requestOrigin?.trim()) {
		return trimTrailingSlash(requestOrigin.trim());
	}

	if (process.env.VERCEL_URL?.trim()) {
		return `https://${trimTrailingSlash(process.env.VERCEL_URL.trim())}`;
	}

	return "http://localhost:3000";
}

export function sanitizeKendraNextPath(
	rawValue: string | null | undefined,
	requestOrigin = "http://localhost",
	fallbackPath = "/admin",
) {
	if (!rawValue?.trim() || rawValue.startsWith("//")) {
		return fallbackPath;
	}

	try {
		const parsed = new URL(rawValue, requestOrigin);

		if (parsed.origin !== requestOrigin) {
			return fallbackPath;
		}

		return `${parsed.pathname}${parsed.search}`;
	} catch {
		return fallbackPath;
	}
}

export function resolveKendraAdminTargetKey(
	value: string | null | undefined,
): KendraAdminTargetKey {
	return KENDRA_ADMIN_TARGETS.some((target) => target.key === value)
		? (value as KendraAdminTargetKey)
		: "dashboard";
}

export function buildKendraCentralizedLoginUrl({
	appBaseUrl = getKendraAppBaseUrl(),
	nextUrl = "/admin",
	webAppUrl = getKendraWebAppUrl(),
}: {
	appBaseUrl?: string;
	nextUrl?: string;
	webAppUrl?: string;
}) {
	const appOrigin = new URL(appBaseUrl).origin;
	const verifyUrl = new URL("/verify-token", appOrigin);
	verifyUrl.searchParams.set("nextUrl", sanitizeKendraNextPath(nextUrl, appOrigin));

	const loginUrl = new URL("/login", webAppUrl);
	loginUrl.searchParams.set("returnUrl", verifyUrl.toString());
	return loginUrl.toString();
}

export function getKendraAdminLoginPath(targetKey: KendraAdminTargetKey) {
	return `/admin/login?next=${encodeURIComponent(targetKey)}`;
}
