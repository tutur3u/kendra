import { revalidatePath } from "next/cache";
import { ExternalProjectsClient } from "tuturuuu/external-projects";
import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";
import { getKendraSessionFromCookies } from "./kendra-session";

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

export function createKendraExternalProjectsClient(accessToken: string) {
	return new ExternalProjectsClient({
		apiKey: accessToken,
		baseUrl: getKendraApiBaseUrl(),
	});
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
