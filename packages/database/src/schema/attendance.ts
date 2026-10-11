import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId, ID_PREFIX } from "../ids.ts";
import { users } from "./users.ts";
import { workspaces } from "./workspaces.ts";

/**
 * Official work sessions only. There is intentionally no table for avatar
 * coordinates or seat duration (privacy-first, brief section 3).
 */
export const attendanceLogs = pgTable(
	"attendance_logs",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId(ID_PREFIX.attendance)),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		clockInAt: timestamp("clock_in_at", { withTimezone: true }).notNull(),
		clockOutAt: timestamp("clock_out_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("attendance_logs_workspace_user_clock_in_idx").on(
			table.workspaceId,
			table.userId,
			table.clockInAt,
		),
	],
);

export const dailyReports = pgTable("daily_reports", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId(ID_PREFIX.dailyReport)),
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspaces.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	attendanceId: text("attendance_id")
		.notNull()
		.unique()
		.references(() => attendanceLogs.id, { onDelete: "cascade" }),
	summaryText: text("summary_text").notNull(),
	taskLinks: jsonb("task_links").$type<string[]>().notNull().default([]),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type TAttendanceLog = typeof attendanceLogs.$inferSelect;
export type TDailyReport = typeof dailyReports.$inferSelect;
