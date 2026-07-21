import { NextResponse } from "next/server";
import { clearKendraSessionCookie } from "@/lib/kendra-session";

export function GET(request: Request) {
	const response = NextResponse.redirect(new URL("/", request.url));
	response.headers.set("Cache-Control", "no-store");
	clearKendraSessionCookie(response);
	return response;
}
