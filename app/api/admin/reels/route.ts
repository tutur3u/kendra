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
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Reel request failed";
}

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
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
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

		const result = await createKendraReel(
			createKendraExternalProjectsClient(session.accessToken),
			getKendraWorkspaceId(),
			input,
		);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}
