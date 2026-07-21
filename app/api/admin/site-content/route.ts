import {
	createKendraExternalProjectsClient,
	getKendraAdminStudio,
} from "@/lib/kendra-admin-api";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { saveKendraAdminSiteContent } from "@/lib/kendra-admin-site-content";
import {
	parseKendraEditableSiteContentPayload,
	readKendraAdminSiteContent,
} from "@/lib/kendra-admin-site-content-model";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import { NextResponse } from "next/server";

export async function GET() {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		const studio = await getKendraAdminStudio(auth.session.accessToken);
		return auth.withSessionCookie(
			NextResponse.json({
				content: readKendraAdminSiteContent(studio).content,
			}),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(
				error,
				"Site content refresh failed",
			),
		);
	}
}

export async function PUT(request: Request) {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		const payload = await request.json().catch(() => null);
		const { content, errors } = parseKendraEditableSiteContentPayload(payload);

		if (!content) {
			return NextResponse.json({ errors }, { status: 400 });
		}

		const savedContent = await saveKendraAdminSiteContent(
			createKendraExternalProjectsClient(auth.session.accessToken),
			getKendraWorkspaceId(),
			content,
		);

		return auth.withSessionCookie(NextResponse.json({ content: savedContent }));
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Site content save failed"),
		);
	}
}
