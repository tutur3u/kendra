import { describe, expect, test } from "bun:test";
import { GET } from "./route";

describe("Kendra admin logout route", () => {
	test("redirects home while clearing the admin session cookie without caching", () => {
		const response = GET(new Request("http://localhost/admin/logout"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("http://localhost/");
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get("set-cookie")).toContain(
			"kendra_admin_session=;",
		);
	});
});
