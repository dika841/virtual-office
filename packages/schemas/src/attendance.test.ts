import { describe, expect, it } from "vitest";
import {
	clockInInputSchema,
	clockOutInputSchema,
	dailyReportInputSchema,
} from "./attendance.ts";

describe("attendance schemas", () => {
	it("validates valid daily reports with 1 to 3 points", () => {
		const valid = dailyReportInputSchema.safeParse({
			points: ["Finished attendance router", "Fixed PixiJS lerp"],
			taskLinks: ["https://github.com/my-org/virtual-office/pull/12"],
		});
		expect(valid.success).toBe(true);
	});

	it("rejects daily reports with empty points", () => {
		const invalid = dailyReportInputSchema.safeParse({
			points: [],
			taskLinks: [],
		});
		expect(invalid.success).toBe(false);
	});

	it("validates clock-in and clock-out payloads", () => {
		const clockIn = clockInInputSchema.safeParse({
			workspaceId: "wsp_main",
			userId: "usr_alice",
		});
		expect(clockIn.success).toBe(true);

		const clockOut = clockOutInputSchema.safeParse({
			workspaceId: "wsp_main",
			attendanceId: "att_123",
			report: {
				points: ["Done for today"],
				taskLinks: [],
			},
		});
		expect(clockOut.success).toBe(true);
	});
});
