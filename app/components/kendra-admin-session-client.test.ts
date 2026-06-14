import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  adminFetch,
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
    globalThis.fetch = mock(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ init, input });
        return Response.json({
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          refreshEarlySeconds: 900,
          valid: true,
        });
      },
    ) as typeof fetch;

    const [first, second] = await Promise.all([
      refreshKendraAdminSession(),
      refreshKendraAdminSession(),
    ]);

    expect(first?.valid).toBe(true);
    expect(second?.valid).toBe(true);
    expect(calls).toHaveLength(1);
    expect(String(calls[0]?.input)).toBe("/api/auth/session/refresh");
  });

  test("refreshes and retries stale admin requests once", async () => {
    const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    globalThis.fetch = mock(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ init, input });

        if (String(input) === "/api/admin/site-content") {
          return calls.filter((call) => String(call.input) === String(input))
            .length === 1
            ? Response.json({ error: "Unauthorized" }, { status: 401 })
            : Response.json({ ok: true });
        }

        return Response.json({
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          valid: true,
        });
      },
    ) as typeof fetch;

    const response = await adminFetch("/api/admin/site-content", {
      body: JSON.stringify({ ok: true }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(calls.map((call) => String(call.input))).toEqual([
      "/api/admin/site-content",
      "/api/auth/session/refresh",
      "/api/admin/site-content",
    ]);
  });

  test("does not retry admin requests when refresh fails", async () => {
    const calls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    globalThis.fetch = mock(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ init, input });

        if (String(input) === "/api/admin/storage") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        return Response.json({ valid: false }, { status: 401 });
      },
    ) as typeof fetch;

    const response = await adminFetch("/api/admin/storage", {
      method: "GET",
    });

    expect(response.status).toBe(403);
    expect(calls.map((call) => String(call.input))).toEqual([
      "/api/admin/storage",
      "/api/auth/session/refresh",
    ]);
  });
});
