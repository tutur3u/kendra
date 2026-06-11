import {
	buildKendraSignedUploadHeaders,
	createKendraExternalProjectsClient,
	getKendraAdminSession,
	type KendraSignedAssetUploadUrl,
} from "@/lib/kendra-admin-api";
import { getKendraWorkspaceId } from "@/lib/kendra-config";
import {
	isKendraAudioFileDescriptor,
	MAX_AUDIO_FILE_BYTES,
	slugifyKendraReel,
} from "@/lib/kendra-admin-reel-model";
import { createKendraAdminErrorResponse } from "@/lib/kendra-admin-route-errors";
import { KENDRA_REEL_COLLECTION_SLUG } from "@/lib/kendra-external-project-manifest";
import { NextResponse } from "next/server";
import type { ExternalProjectsClient } from "tuturuuu/external-projects";

export const dynamic = "force-dynamic";

function readString(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return typeof value === "string" ? value.trim() : "";
}

function readSize(value: unknown) {
	const size = typeof value === "number" ? value : Number(value);
	return Number.isSafeInteger(size) && size > 0 ? size : null;
}

export async function POST(request: Request) {
	const session = await getKendraAdminSession();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		const value = await request.json();
		body = value && typeof value === "object" && !Array.isArray(value) ? value : {};
	} catch {
		return NextResponse.json(
			{ error: "Send upload metadata as JSON." },
			{ status: 400 },
		);
	}

	const filename = readString(body, "filename");
	const contentType = readString(body, "contentType");
	const slug = slugifyKendraReel(readString(body, "slug"));
	const size = readSize(body.size);
	const errors: Record<string, string> = {};

	if (!filename) {
		errors.filename = "Choose an audio file.";
	} else if (!isKendraAudioFileDescriptor({ contentType, filename })) {
		errors.filename = "Upload an audio file.";
	}

	if (!size) {
		errors.size = "Audio file size is required.";
	} else if (size > MAX_AUDIO_FILE_BYTES) {
		errors.size = "Audio files must stay under 96 MB.";
	}

	if (!slug) {
		errors.slug = "Add a reel slug before uploading audio.";
	}

	if (Object.keys(errors).length > 0) {
		return NextResponse.json({ errors }, { status: 400 });
	}

	try {
		const client = createKendraExternalProjectsClient(session.accessToken);
		const uploadUrl = (await client.createAssetUploadUrl(getKendraWorkspaceId(), {
			collectionType: KENDRA_REEL_COLLECTION_SLUG,
			contentType: contentType || "application/octet-stream",
			entrySlug: slug,
			filename,
			size,
			upsert: true,
		} as Parameters<ExternalProjectsClient["createAssetUploadUrl"]>[1] & {
			contentType: string;
			size: number;
		})) as KendraSignedAssetUploadUrl;

		return NextResponse.json({
			fullPath: uploadUrl.fullPath,
			headers: buildKendraSignedUploadHeaders(uploadUrl, contentType),
			method: "PUT",
			path: uploadUrl.path,
			signedUrl: uploadUrl.signedUrl,
		});
	} catch (error) {
		return createKendraAdminErrorResponse(error, "Audio upload preparation failed", {
			label: "Preparing upload",
			step: "prepare-upload",
		});
	}
}
