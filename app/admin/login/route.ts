import {
	buildKendraCentralizedLoginUrl,
	resolveKendraAdminTargetKey,
} from "@/lib/kendra-config";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
	const targetKey = resolveKendraAdminTargetKey(
		request.nextUrl.searchParams.get("next"),
	);
	const nextUrl =
		targetKey === "library" ? "/admin" : `/admin?target=${targetKey}`;

	return NextResponse.redirect(
		buildKendraCentralizedLoginUrl({
			appBaseUrl: request.nextUrl.origin,
			nextUrl,
		}),
	);
}
