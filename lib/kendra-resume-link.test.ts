import { describe, expect, mock, test } from "bun:test";
import { getKendraResumeStoragePath, resolveKendraResumeLink } from "./kendra-resume-link";

const path = "external-projects/kendra/Resume 2026.pdf";
const expired = `https://project.supabase.co/storage/v1/object/sign/workspaces/ws-1/${encodeURI(path)}?token=expired`;

describe("resume links", () => {
	test("extracts the object path without needing a valid preview token", () => {
		expect(getKendraResumeStoragePath(expired, "ws-1")).toBe(path);
	});
	test("preserves permanent external links", async () => {
		const createAsset = mock(async () => ({ id: "asset-1" }));
		const url = "https://docs.google.com/document/d/resume/edit";
		expect(await resolveKendraResumeLink({ client: { createAsset, getAssetUrl: () => "unused" }, workspaceId: "ws-1", entryId: "entry-1", resumeUrl: url, assets: [] })).toBe(url);
		expect(createAsset).not.toHaveBeenCalled();
	});
	test("registers the same PDF on the published content entry", async () => {
		const createAsset = mock(async () => ({ id: "asset-1" }));
		const getAssetUrl = mock((ws: string, id: string) => `https://platform.example/${ws}/assets/${id}`);
		expect(await resolveKendraResumeLink({ client: { createAsset, getAssetUrl }, workspaceId: "ws-1", entryId: "entry-1", resumeUrl: expired, assets: [] })).toBe("https://platform.example/ws-1/assets/asset-1");
		expect(createAsset.mock.calls[0]).toEqual(["ws-1", {
			asset_type: "document", entry_id: "entry-1", storage_path: path,
			source_url: null, metadata: { fieldKey: "site.resumeUrl", filename: "Resume 2026.pdf" }, sort_order: 0,
		}]);
	});
	test("reuses an existing asset on the same entry", async () => {
		const createAsset = mock(async () => ({ id: "new" }));
		expect(await resolveKendraResumeLink({ client: { createAsset, getAssetUrl: (_ws, id) => `https://platform.example/assets/${id}` }, workspaceId: "ws-1", entryId: "entry-1", resumeUrl: expired, assets: [{ id: "existing", entry_id: "entry-1", storage_path: path }] })).toBe("https://platform.example/assets/existing");
		expect(createAsset).not.toHaveBeenCalled();
	});
	test("rejects other workspaces, project folders, and encoded traversal", () => {
		for (const url of [expired.replace("ws-1", "ws-2"), expired.replace("kendra/", "other/"), expired.replace("Resume%202026.pdf", "%2E%2E%2Fsecret.pdf"), expired.replace("project.supabase.co", "untrusted.example")]) {
			expect(() => getKendraResumeStoragePath(url, "ws-1")).toThrow();
		}
	});
});
