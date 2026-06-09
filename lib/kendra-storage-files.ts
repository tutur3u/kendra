import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";

export type KendraStorageFileItem = {
	contentType: string | null;
	createdAt: string | null;
	kind: "file" | "folder";
	name: string;
	path: string;
	size: number;
	updatedAt: string | null;
};

export type KendraStorageFilesPayload = {
	items: KendraStorageFileItem[];
	path: string;
	provider?: string;
	total: number;
};

export type KendraStorageFilesState =
	| { data: KendraStorageFilesPayload; status: "ready" }
	| { message: string; status: "unavailable" };

type StorageFilesResponse = {
	data?: KendraStorageFilesPayload;
};

const unavailableMessage = "Files are not available right now.";

function isStorageFileItem(value: unknown): value is KendraStorageFileItem {
	if (!value || typeof value !== "object") return false;

	const item = value as Record<string, unknown>;
	return (
		(item.kind === "file" || item.kind === "folder") &&
		typeof item.name === "string" &&
		typeof item.path === "string" &&
		typeof item.size === "number" &&
		(typeof item.contentType === "string" || item.contentType === null) &&
		(typeof item.createdAt === "string" || item.createdAt === null) &&
		(typeof item.updatedAt === "string" || item.updatedAt === null)
	);
}

function isStorageFilesPayload(
	value: unknown,
): value is KendraStorageFilesPayload {
	if (!value || typeof value !== "object") return false;

	const payload = value as Record<string, unknown>;
	return (
		Array.isArray(payload.items) &&
		payload.items.every(isStorageFileItem) &&
		typeof payload.path === "string" &&
		typeof payload.total === "number"
	);
}

export async function getKendraStorageFiles(
	accessToken: string,
	path = "",
): Promise<KendraStorageFilesState> {
	try {
		const apiBaseUrl = getKendraApiBaseUrl().replace(/\/+$/, "");
		const workspaceId = getKendraWorkspaceId();
		const url = new URL(
			`${apiBaseUrl}/workspaces/${encodeURIComponent(workspaceId)}/external-projects/storage`,
		);
		url.searchParams.set("limit", "100");
		url.searchParams.set("sortBy", "updated_at");
		url.searchParams.set("sortOrder", "desc");
		if (path) {
			url.searchParams.set("path", path);
		}

		const response = await fetch(url, {
			cache: "no-store",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			return {
				message: unavailableMessage,
				status: "unavailable",
			};
		}

		const payload = (await response
			.json()
			.catch(() => null)) as StorageFilesResponse | null;
		const data = payload?.data;

		if (!isStorageFilesPayload(data)) {
			return {
				message: unavailableMessage,
				status: "unavailable",
			};
		}

		return {
			data,
			status: "ready",
		};
	} catch {
		return {
			message: unavailableMessage,
			status: "unavailable",
		};
	}
}
