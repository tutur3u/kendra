import { NextResponse } from "next/server";
import { clearKendraSessionCookie } from "@/lib/kendra-session";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
	const response = NextResponse.redirect(new URL("/", request.url));
	clearKendraSessionCookie(response);
	return response;
}
