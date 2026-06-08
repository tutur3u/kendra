import { revalidatePath } from "next/cache";
import { ExternalProjectsClient } from "tuturuuu/external-projects";
import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";
import { getKendraSessionFromCookies } from "./kendra-session";

type SignedAssetUploadUrl = Awaited<
	ReturnType<ExternalProjectsClient["createAssetUploadUrl"]>
> & {
	contentType?: string | null;
	headers?: Record<string, string> | null;
	token?: string | null;
};

export type KendraAdminStudioPayload = {
	assets: Array<Record<string, unknown>>;
	binding?: Record<string, unknown>;
	blocks: Array<Record<string, unknown>>;
	collections: Array<Record<string, unknown>>;
	entries: Array<Record<string, unknown>>;
	importJobs?: unknown[];
	loadingData?: unknown;
	publishEvents?: unknown[];
};

async function uploadFileWithSignedUrl(file: File, uploadUrl: SignedAssetUploadUrl) {
	const headers: Record<string, string> = {
		...(uploadUrl.headers ?? {}),
	};

	if (!headers["Content-Type"]) {
		headers["Content-Type"] =
			uploadUrl.contentType || file.type || "application/octet-stream";
	}

	if (uploadUrl.token) {
		headers.Authorization = `Bearer ${uploadUrl.token}`;
	}

	let response = await fetch(uploadUrl.signedUrl, {
		body: file,
		cache: "no-store",
		headers,
		method: "PUT",
	});

	if (!response.ok) {
		const fallbackHeaders = { ...headers };
		delete fallbackHeaders["Content-Type"];

		response = await fetch(uploadUrl.signedUrl, {
			body: file,
			cache: "no-store",
			headers: fallbackHeaders,
			method: "PUT",
		});
	}

	if (!response.ok) {
		const message = await response.text().catch(() => "");
		throw new Error(
			`Failed to upload file (${response.status})${message ? `: ${message}` : ""}`,
		);
	}

	return {
		fullPath: uploadUrl.fullPath,
		path: uploadUrl.path,
	};
}

export function createKendraExternalProjectsClient(accessToken: string) {
	const client = new ExternalProjectsClient({
		apiKey: accessToken,
		baseUrl: getKendraApiBaseUrl(),
	});

	client.uploadAssetFile = async (workspaceId, file, options) => {
		const uploadUrl = (await client.createAssetUploadUrl(workspaceId, {
			...options,
			contentType: file.type || "application/octet-stream",
			filename: file.name,
			size: file.size,
		} as Parameters<ExternalProjectsClient["createAssetUploadUrl"]>[1] & {
			contentType: string;
			size: number;
		})) as SignedAssetUploadUrl;

		return uploadFileWithSignedUrl(file, uploadUrl);
	};

	return client;
}

export async function getKendraAdminSession() {
	return getKendraSessionFromCookies();
}

export async function getKendraAdminStudio(accessToken: string) {
	const client = createKendraExternalProjectsClient(accessToken);
	return client.getStudio(getKendraWorkspaceId()) as Promise<KendraAdminStudioPayload>;
}

export function revalidateKendraContent() {
	revalidatePath("/", "layout");
	revalidatePath("/voice-over");
}
