import { describe, expect, test } from "bun:test";
import {
	KendraAdminDownstreamError,
	createKendraAdminErrorResponse,
	getKendraAdminErrorPayload,
} from "./kendra-admin-route-errors";

describe("Kendra admin route errors", () => {
	test("preserves SDK status codes", () => {
		const payload = getKendraAdminErrorPayload({
			message: "Forbidden",
			statusCode: 403,
		});

		expect(payload).toEqual({
			error: "Forbidden",
			status: 403,
		});
	});

	test("reads downstream HTTP status and JSON error messages", () => {
		const payload = getKendraAdminErrorPayload(
			new Error('HTTP 400: Bad Request - {"error":"Invalid payload"}'),
		);

		expect(payload).toEqual({
			error: "Invalid payload",
			status: 400,
		});
	});

	test("maps upload failures with embedded status codes", async () => {
		const response = createKendraAdminErrorResponse(
			new Error("Failed to upload file (413): Too large"),
		);

		expect(response.status).toBe(413);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to upload file (413): Too large",
		});
	});

	test("includes sanitized debug details and save step metadata", () => {
		const payload = getKendraAdminErrorPayload(
			new KendraAdminDownstreamError("Upstream failed", {
				details: {
					Authorization: "Bearer secret-token",
					endpoint: "/api/v1/workspaces/ws-1/external-projects/entries",
					nested: {
						signedUrl: "https://storage.example/upload?X-Amz-Signature=secret",
					},
					response: { error: "Failed" },
				},
				statusCode: 500,
			}),
			"Reel request failed",
			{ label: "Saving reel details", step: "save-entry" },
		);

		expect(payload).toEqual({
			details: {
				Authorization: "[redacted]",
				endpoint: "/api/v1/workspaces/ws-1/external-projects/entries",
				nested: {
					signedUrl: "[redacted]",
				},
				response: { error: "Failed" },
			},
			error: "Upstream failed",
			label: "Saving reel details",
			status: 500,
			step: "save-entry",
		});
	});
});
