import {
	createKendraExternalProjectsClient,
} from "@/lib/kendra-admin-api";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import {
	createKendraReel,
	refreshKendraReels,
} from "@/lib/kendra-admin-reels";
import { parseKendraReelFormData } from "@/lib/kendra-admin-reel-model";
import { createKendraReelMutationStream } from "@/lib/kendra-admin-reel-stream";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { NextResponse } from "next/server";

export async function GET() {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		return auth.withSessionCookie(
			NextResponse.json({
				reels: await refreshKendraReels(auth.session.accessToken),
			}),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Reel refresh failed"),
		);
	}
}

export async function POST(request: Request) {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		const { errors, input } = parseKendraReelFormData(await request.formData());

		if (!input) {
			return NextResponse.json({ errors }, { status: 400 });
		}

		const client = createKendraExternalProjectsClient(auth.session.accessToken);
		const workspaceId = getKendraWorkspaceId();

		return auth.withSessionCookie(
			createKendraReelMutationStream({
				fallback: "Reel request failed",
				run: (onProgress) =>
					createKendraReel(client, workspaceId, input, { onProgress }),
			}),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Reel request failed"),
		);
	}
}
