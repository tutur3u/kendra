import { cache } from "react";
import {
	buildKendraContent,
	DEFAULT_KENDRA_CONTENT,
	type KendraDeliveryPayload,
} from "./kendra-content";
import { getKendraApiBaseUrl, getOptionalKendraWorkspaceId } from "./kendra-config";

const DELIVERY_REVALIDATE_SECONDS = 60;

async function fetchDeliveryPayload() {
	const workspaceId = getOptionalKendraWorkspaceId();

	if (!workspaceId) {
		return null;
	}

	const apiBaseUrl = getKendraApiBaseUrl();
	const response = await fetch(
		`${apiBaseUrl.replace(/\/+$/, "")}/workspaces/${encodeURIComponent(workspaceId)}/external-projects/delivery`,
		{
			cache: "force-cache",
			next: {
				revalidate: DELIVERY_REVALIDATE_SECONDS,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Tuturuuu delivery failed with status ${response.status}`);
	}

	return {
		apiBaseUrl,
		delivery: (await response.json()) as KendraDeliveryPayload,
	};
}

export async function getUncachedKendraContent() {
	try {
		const payload = await fetchDeliveryPayload();

		if (!payload) {
			return DEFAULT_KENDRA_CONTENT;
		}

		return buildKendraContent(payload.delivery, {
			apiBaseUrl: payload.apiBaseUrl,
		});
	} catch {
		return DEFAULT_KENDRA_CONTENT;
	}
}

export const getKendraContent = cache(getUncachedKendraContent);
