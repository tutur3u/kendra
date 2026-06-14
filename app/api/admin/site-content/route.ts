import {
	createKendraExternalProjectsClient,
	getKendraAdminSession,
	getKendraAdminStudio,
} from "@/lib/kendra-admin-api";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { saveKendraAdminSiteContent } from "@/lib/kendra-admin-site-content";
import {
	parseKendraEditableSiteContentPayload,
	readKendraAdminSiteContent,
} from "@/lib/kendra-admin-site-content-model";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const studio = await getKendraAdminStudio(session.accessToken);
		return NextResponse.json({
			content: readKendraAdminSiteContent(studio).content,
		});
	} catch (error) {
		return createKendraAdminErrorResponse(
			error,
			"Site content refresh failed",
		);
	}
}

export async function PUT(request: Request) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const payload = await request.json().catch(() => null);
		const { content, errors } = parseKendraEditableSiteContentPayload(payload);

		if (!content) {
			return NextResponse.json({ errors }, { status: 400 });
		}

		const savedContent = await saveKendraAdminSiteContent(
			createKendraExternalProjectsClient(session.accessToken),
			getKendraWorkspaceId(),
			content,
		);

		return NextResponse.json({ content: savedContent });
	} catch (error) {
		return createKendraAdminErrorResponse(error, "Site content save failed");
	}
}
