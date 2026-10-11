import { z } from "zod";

/** Clock-out modal asks for 1 to 3 short points (brief section 5). */
export const dailyReportInputSchema = z.object({
	points: z.array(z.string().trim().min(1).max(280)).min(1).max(10),
	taskLinks: z.array(z.url()).max(10).default([]),
});
export type TDailyReportInput = z.infer<typeof dailyReportInputSchema>;

export const clockInInputSchema = z.object({
	workspaceId: z.string().min(1),
	userId: z.string().optional(),
	userName: z.string().optional(),
	userEmail: z.string().optional(),
	assignedDeskId: z.string().optional(),
});
export type TClockInInput = z.infer<typeof clockInInputSchema>;

export const clockOutInputSchema = z.object({
	workspaceId: z.string().min(1),
	attendanceId: z.string().min(1),
	userId: z.string().optional(),
	report: dailyReportInputSchema,
});
export type TClockOutInput = z.infer<typeof clockOutInputSchema>;

export const attendanceStatusInputSchema = z.object({
	workspaceId: z.string().min(1),
	userId: z.string().optional(),
});
export type TAttendanceStatusInput = z.infer<
	typeof attendanceStatusInputSchema
>;

export const attendanceHistoryInputSchema = z.object({
	workspaceId: z.string().min(1),
	limit: z.number().int().min(1).max(50).optional().default(10),
});
export type TAttendanceHistoryInput = z.infer<
	typeof attendanceHistoryInputSchema
>;
