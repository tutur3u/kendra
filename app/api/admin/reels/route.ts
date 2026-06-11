import {
	createKendraExternalProjectsClient,
	getKendraAdminSession,
} from "@/lib/kendra-admin-api";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import {
	createKendraReel,
	refreshKendraReels,
} from "@/lib/kendra-admin-reels";
import { parseKendraReelFormData } from "@/lib/kendra-admin-reel-model";
import { createKendraReelMutationStream } from "@/lib/kendra-admin-reel-stream";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		return NextResponse.json({
			reels: await refreshKendraReels(session.accessToken),
		});
	} catch (error) {
		return createKendraAdminErrorResponse(error, "Reel refresh failed");
	}
}

export async function POST(request: Request) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { errors, input } = parseKendraReelFormData(await request.formData());

		if (!input) {
			return NextResponse.json({ errors }, { status: 400 });
		}

		const client = createKendraExternalProjectsClient(session.accessToken);
		const workspaceId = getKendraWorkspaceId();

		return createKendraReelMutationStream({
			fallback: "Reel request failed",
			run: (onProgress) =>
				createKendraReel(client, workspaceId, input, { onProgress }),
		});
	} catch (error) {
		return createKendraAdminErrorResponse(error, "Reel request failed");
	}
}
