import { createKendraExternalProjectsClient } from "@/lib/kendra-admin-api";
import { getKendraAdminRouteSession } from "@/lib/kendra-admin-route-session";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import {
	deleteKendraReel,
	updateKendraReel,
} from "@/lib/kendra-admin-reels";
import { parseKendraReelFormData } from "@/lib/kendra-admin-reel-model";
import { createKendraReelMutationStream } from "@/lib/kendra-admin-reel-stream";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
	request: Request,
	context: { params: Promise<{ entryId: string }> },
) {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		const { entryId } = await context.params;
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
					updateKendraReel(client, workspaceId, entryId, input, { onProgress }),
			}),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Reel request failed"),
		);
	}
}

export async function DELETE(
	_request: Request,
	context: { params: Promise<{ entryId: string }> },
) {
	const auth = await getKendraAdminRouteSession();

	if (!auth.session) {
		return auth.response;
	}

	try {
		const { entryId } = await context.params;

		return auth.withSessionCookie(
			NextResponse.json(
				await deleteKendraReel(
					createKendraExternalProjectsClient(auth.session.accessToken),
					getKendraWorkspaceId(),
					entryId,
				),
			),
		);
	} catch (error) {
		return auth.withSessionCookie(
			createKendraAdminErrorResponse(error, "Reel request failed"),
		);
	}
}
