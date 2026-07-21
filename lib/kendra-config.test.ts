import { describe, expect, test } from "bun:test";
import { buildKendraTasksUrl } from "./kendra-config";

describe("Kendra config links", () => {
	test("opens tasks for the linked Tuturuuu workspace", () => {
		expect(
			buildKendraTasksUrl({
				tasksAppUrl: "https://tasks.tuturuuu.com",
				workspaceId: "ws-linked",
			}),
		).toBe("https://tasks.tuturuuu.com/ws-linked/tasks");
	});
});
