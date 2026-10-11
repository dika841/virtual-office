import { describe, expect, it } from "vitest";
import { appRouter } from "../router.ts";

describe("attendance router contracts", () => {
	it("exposes expected attendance procedures", () => {
		expect(appRouter.attendance).toBeDefined();
		expect(appRouter.attendance.clockIn).toBeDefined();
		expect(appRouter.attendance.clockOut).toBeDefined();
		expect(appRouter.attendance.status).toBeDefined();
		expect(appRouter.attendance.reports).toBeDefined();
	});
});
