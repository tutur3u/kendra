import { NextResponse } from "next/server";
import { getKendraAdminSession } from "@/lib/kendra-admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await getKendraAdminSession();

		return NextResponse.json({
			authenticated: Boolean(session),
			email: session?.user.email ?? null,
		});
	} catch {
		return NextResponse.json({
			authenticated: false,
			email: null,
		});
	}
}
