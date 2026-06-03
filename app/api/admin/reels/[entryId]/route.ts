import {
	createKendraExternalProjectsClient,
	getKendraAdminSession,
} from "@/lib/kendra-admin-api";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import {
	deleteKendraReel,
	updateKendraReel,
} from "@/lib/kendra-admin-reels";
import { parseKendraReelFormData } from "@/lib/kendra-admin-reel-model";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Reel request failed";
}

export async function PATCH(
	request: Request,
	context: { params: Promise<{ entryId: string }> },
) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { entryId } = await context.params;
		const { errors, input } = parseKendraReelFormData(await request.formData());

		if (!input) {
			return NextResponse.json({ errors }, { status: 400 });
		}

		return NextResponse.json(
			await updateKendraReel(
				createKendraExternalProjectsClient(session.accessToken),
				getKendraWorkspaceId(),
				entryId,
				input,
			),
		);
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

export async function DELETE(
	_request: Request,
	context: { params: Promise<{ entryId: string }> },
) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { entryId } = await context.params;

		return NextResponse.json(
			await deleteKendraReel(
				createKendraExternalProjectsClient(session.accessToken),
				getKendraWorkspaceId(),
				entryId,
			),
		);
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}
