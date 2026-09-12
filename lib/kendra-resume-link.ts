import type { ExternalProjectsClient } from "tuturuuu/external-projects";

/** Recover the durable object reference, never the expiring preview token. */
export function getKendraResumeStoragePath(value: string, workspaceId: string) {
	const url = new URL(value);
	if (!url.pathname.startsWith("/storage/v1/object/sign/")) return null;
	if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
		throw new Error("Use a permanent resume link or a preview from this site's storage.");
	}
	const prefix = `/storage/v1/object/sign/workspaces/${workspaceId}/`;
	const pathname = decodeURIComponent(url.pathname);
	if (!pathname.startsWith(`${prefix}external-projects/kendra/`)) {
		throw new Error("Choose a resume from this site's storage.");
	}
	const path = pathname.slice(prefix.length);
	if (path.split("/").some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
		throw new Error("The resume storage path is invalid.");
	}
	return path;
}

export async function resolveKendraResumeLink({
	client, workspaceId, entryId, resumeUrl, assets,
}: {
	client: Pick<ExternalProjectsClient, "createAsset" | "getAssetUrl">;
	workspaceId: string;
	entryId: string;
	resumeUrl: string;
	assets: Array<Record<string, unknown>>;
}) {
	if (!resumeUrl) return resumeUrl;
	const storagePath = getKendraResumeStoragePath(resumeUrl, workspaceId);
	if (!storagePath) return resumeUrl;
	const existing = assets.find((asset) => asset.storage_path === storagePath && asset.entry_id === entryId);
	const asset = existing ?? await client.createAsset(workspaceId, {
		asset_type: "document",
		entry_id: entryId,
		storage_path: storagePath,
		source_url: null,
		metadata: { fieldKey: "site.resumeUrl", filename: storagePath.split("/").at(-1) },
		sort_order: 0,
	});
	const record = asset && typeof asset === "object" ? asset as Record<string, unknown> : {};
	const nested = record.asset && typeof record.asset === "object" ? record.asset as Record<string, unknown> : {};
	const id = record.id ?? nested.id;
	if (typeof id !== "string" || !id) throw new Error("The resume asset could not be saved.");
	return client.getAssetUrl(workspaceId, id);
}
