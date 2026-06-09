import type { StorageAnalytics } from "tuturuuu";
import { getKendraApiBaseUrl, getKendraWorkspaceId } from "./kendra-config";

export type KendraStorageAnalyticsState =
	| { data: StorageAnalytics; status: "ready" }
	| { message: string; status: "unavailable" };

type StorageAnalyticsResponse = {
	data?: StorageAnalytics;
};

const unavailableMessage = "Storage details are not available right now.";

function isStorageFile(value: unknown): value is StorageAnalytics["largestFile"] {
	if (value === null) return true;
	if (!value || typeof value !== "object") return false;

	const file = value as Record<string, unknown>;
	return (
		typeof file.name === "string" &&
		typeof file.size === "number" &&
		typeof file.createdAt === "string"
	);
}

function isStorageAnalytics(value: unknown): value is StorageAnalytics {
	if (!value || typeof value !== "object") return false;

	const analytics = value as Record<string, unknown>;
	return (
		typeof analytics.totalSize === "number" &&
		typeof analytics.fileCount === "number" &&
		typeof analytics.storageLimit === "number" &&
		typeof analytics.usagePercentage === "number" &&
		isStorageFile(analytics.largestFile) &&
		isStorageFile(analytics.smallestFile)
	);
}

export async function getKendraStorageAnalytics(
	accessToken: string,
): Promise<KendraStorageAnalyticsState> {
	try {
		const apiBaseUrl = getKendraApiBaseUrl().replace(/\/+$/, "");
		const workspaceId = getKendraWorkspaceId();
		const response = await fetch(
			`${apiBaseUrl}/workspaces/${encodeURIComponent(workspaceId)}/storage/analytics`,
			{
				cache: "no-store",
				headers: {
					Accept: "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		if (!response.ok) {
			return {
				message: unavailableMessage,
				status: "unavailable",
			};
		}

		const payload = (await response.json().catch(() => null)) as
			| StorageAnalyticsResponse
			| null;
		const data = payload?.data;

		if (!isStorageAnalytics(data)) {
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
