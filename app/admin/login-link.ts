import { headers } from "next/headers";
import {
	buildKendraCentralizedLoginUrl,
	type KendraAdminTargetKey,
} from "@/lib/kendra-config";

function getRequestOrigin(headersList: Headers) {
	const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

	if (!host) {
		return null;
	}

	const protocol =
		headersList.get("x-forwarded-proto") ??
		(host.startsWith("localhost") || host.startsWith("127.0.0.1")
			? "http"
			: "https");

	return `${protocol}://${host}`;
}

export async function getKendraCentralizedLoginHref(
	targetKey: KendraAdminTargetKey,
) {
	const requestOrigin = getRequestOrigin(await headers());
	const nextUrlByTarget: Record<KendraAdminTargetKey, string> = {
		dashboard: "/admin",
	};

	return buildKendraCentralizedLoginUrl({
		...(requestOrigin ? { appBaseUrl: requestOrigin } : {}),
		nextUrl: nextUrlByTarget[targetKey],
	});
}
