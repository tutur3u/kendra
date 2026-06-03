import { buildKendraCentralizedLoginUrl } from "@/lib/kendra-config";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
	return NextResponse.redirect(
		buildKendraCentralizedLoginUrl({
			appBaseUrl: request.nextUrl.origin,
			nextUrl: "/admin",
		}),
	);
}
