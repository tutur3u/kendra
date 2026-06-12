import { afterEach, describe, expect, mock, test } from "bun:test";
import {
	getKendraAdminSessionRefreshDelayMs,
	refreshKendraAdminSession,
} from "./kendra-admin-session-client";

const originalFetch = globalThis.fetch;

describe("Kendra admin session client", () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("caps large refresh lead values so short-lived tokens do not loop", () => {
		const now = new Date("2026-06-12T00:00:00.000Z").getTime();
		const expiresAt = new Date(now + 60_000).toISOString();

		expect(
			getKendraAdminSessionRefreshDelayMs({
				expiresAt,
				now,
				refreshEarlySeconds: 900,
			}),
		).toBe(30_000);
	});

	test("uses a fallback delay for invalid expiry timestamps", () => {
		expect(
			getKendraAdminSessionRefreshDelayMs({
				expiresAt: "not-a-date",
				now: 0,
			}),
		).toBe(5 * 60 * 1000);
	});

	test("de-dupes concurrent refresh requests", async () => {
		const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
		globalThis.fetch = mock(async (input, init) => {
			calls.push({ init, input });
			return Response.json({
				expiresAt: new Date(Date.now() + 60_000).toISOString(),
				refreshEarlySeconds: 900,
				valid: true,
			});
		}) as typeof fetch;

		const [first, second] = await Promise.all([
			refreshKendraAdminSession(),
			refreshKendraAdminSession(),
		]);

		expect(first?.valid).toBe(true);
		expect(second?.valid).toBe(true);
		expect(calls).toHaveLength(1);
		expect(String(calls[0]?.input)).toBe("/api/auth/session/refresh");
	});
});
