import { revalidatePath } from "next/cache";
import { ExternalProjectsClient } from "tuturuuu/external-projects";
import { KendraAdminDownstreamError } from "./kendra-admin-route-errors";
import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";
import { getKendraSessionFromCookies } from "./kendra-session";

export type KendraSignedAssetUploadUrl = Awaited<
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

function getRequestUrl(input: Parameters<typeof fetch>[0]) {
	return typeof input === "string" || input instanceof URL ? String(input) : input.url;
}

function getRequestMethod(input: Parameters<typeof fetch>[0], init?: RequestInit) {
	return init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");
}

async function readResponsePayload(response: Response) {
	const text = await response.clone().text().catch(() => "");
	const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

	if (contentType.includes("application/json") && text) {
		try {
			return JSON.parse(text) as unknown;
		} catch {
			return text;
		}
	}

	return text || null;
}

function readDownstreamMessage(payload: unknown, fallback: string) {
	if (payload && typeof payload === "object" && !Array.isArray(payload)) {
		const record = payload as Record<string, unknown>;
		return typeof record.message === "string"
			? record.message
			: typeof record.error === "string"
				? record.error
				: fallback;
	}

	return typeof payload === "string" && payload.trim() ? payload.trim() : fallback;
}

function readDownstreamCode(payload: unknown) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return undefined;
	}

	const code = (payload as Record<string, unknown>).code;
	return typeof code === "string" ? code : undefined;
}

async function kendraExternalProjectFetch(
	input: Parameters<typeof fetch>[0],
	init?: Parameters<typeof fetch>[1],
) {
	const response = await fetch(input, init);

	if (response.ok) {
		return response;
	}

	const payload = await readResponsePayload(response);
	const fallback = `HTTP ${response.status}: ${response.statusText}`;
	const endpoint = new URL(getRequestUrl(input)).pathname;

	throw new KendraAdminDownstreamError(readDownstreamMessage(payload, fallback), {
		code: readDownstreamCode(payload),
		details: {
			endpoint,
			method: getRequestMethod(input, init),
			response: payload,
			status: response.status,
			statusText: response.statusText,
		},
		statusCode: response.status,
	});
}

export function buildKendraSignedUploadHeaders(
	uploadUrl: KendraSignedAssetUploadUrl,
	contentType?: string | null,
) {
	const headers: Record<string, string> = {
		...(uploadUrl.headers ?? {}),
	};

	if (!headers["Content-Type"]) {
		headers["Content-Type"] =
			uploadUrl.contentType || contentType || "application/octet-stream";
	}

	if (uploadUrl.token) {
		headers.Authorization = `Bearer ${uploadUrl.token}`;
	}

	return headers;
}

export function createKendraExternalProjectsClient(accessToken: string) {
	const client = new ExternalProjectsClient({
		apiKey: accessToken,
		baseUrl: getKendraApiBaseUrl(),
		fetch: kendraExternalProjectFetch,
	});

	client.uploadAssetFile = async () => {
		throw new Error(
			"Kendra audio uploads must use a signed browser upload URL.",
		);
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
