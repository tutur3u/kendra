import { describe, expect, test } from "bun:test";
import {
	getKendraAdminSectionHref,
	isKendraAdminSection,
} from "./kendra-admin-sections";

describe("Kendra admin sections", () => {
	test("accepts only registered section slugs", () => {
		expect(isKendraAdminSection("audio")).toBe(true);
		expect(isKendraAdminSection("members")).toBe(true);
		expect(isKendraAdminSection("unknown")).toBe(false);
		expect(isKendraAdminSection(undefined)).toBe(false);
	});

	test("builds canonical section URLs", () => {
		expect(getKendraAdminSectionHref("storage")).toBe("/admin/storage");
	});
});
