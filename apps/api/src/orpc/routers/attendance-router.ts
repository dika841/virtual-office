import { and, desc, eq, isNull } from "drizzle-orm";
import {
	attendanceLogs,
	createId,
	dailyReports,
	ID_PREFIX,
	users,
	workspaceMembers,
	workspaces,
} from "@virtual-office/database";
import {
	attendanceHistoryInputSchema,
	attendanceStatusInputSchema,
	clockInInputSchema,
	clockOutInputSchema,
} from "@virtual-office/schemas";
import { pub } from "../base.ts";
import type { TORPCContext } from "../context.ts";

const DEFAULT_USER_ID = "usr_me";
const DEFAULT_WORKSPACE_ID = "wsp_main";

async function ensureSeedContext(
	db: TORPCContext["db"],
	workspaceId: string,
	userId: string,
	userName?: string,
	assignedDeskId = "desk_1",
) {
	const effectiveUserId = userId || DEFAULT_USER_ID;
	const effectiveWorkspaceId = workspaceId || DEFAULT_WORKSPACE_ID;

	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.id, effectiveUserId))
		.limit(1);

	if (existingUser.length === 0) {
		await db
			.insert(users)
			.values({
				id: effectiveUserId,
				email: `${effectiveUserId}@virtualoffice.local`,
				name: userName || "Workspace Member",
				avatarSpriteId: "default",
			})
			.onConflictDoNothing();
	}

	const existingWorkspace = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.id, effectiveWorkspaceId))
		.limit(1);

	if (existingWorkspace.length === 0) {
		await db
			.insert(workspaces)
			.values({
				id: effectiveWorkspaceId,
				name: "Main Virtual HQ",
				slug: effectiveWorkspaceId.replace(/^wsp_/, "") || "hq",
				ownerId: effectiveUserId,
			})
			.onConflictDoNothing();
	}

	const existingMember = await db
		.select()
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, effectiveWorkspaceId),
				eq(workspaceMembers.userId, effectiveUserId),
			),
		)
		.limit(1);

	let member = existingMember[0];
	if (!member) {
		const created = await db
			.insert(workspaceMembers)
			.values({
				id: createId(ID_PREFIX.member),
				workspaceId: effectiveWorkspaceId,
				userId: effectiveUserId,
				role: "member",
				assignedDeskId,
			})
			.onConflictDoNothing()
			.returning();
		member = created[0];
	}

	return {
		userId: effectiveUserId,
		workspaceId: effectiveWorkspaceId,
		assignedDeskId: member?.assignedDeskId ?? assignedDeskId,
	};
}

export const attendanceRouter = {
	clockIn: pub.input(clockInInputSchema).handler(async ({ input, context }) => {
		const meta = await ensureSeedContext(
			context.db,
			input.workspaceId,
			input.userId ?? DEFAULT_USER_ID,
			input.userName,
			input.assignedDeskId ?? "desk_1",
		);

		// Check for an existing open session
		const openSessions = await context.db
			.select()
			.from(attendanceLogs)
			.where(
				and(
					eq(attendanceLogs.workspaceId, meta.workspaceId),
					eq(attendanceLogs.userId, meta.userId),
					isNull(attendanceLogs.clockOutAt),
				),
			)
			.orderBy(desc(attendanceLogs.clockInAt))
			.limit(1);

		if (openSessions.length > 0 && openSessions[0]) {
			const existing = openSessions[0];
			return {
				attendanceId: existing.id,
				clockInAt: existing.clockInAt.toISOString(),
				assignedDeskId: meta.assignedDeskId,
				isResumed: true,
			};
		}

		const newId = createId(ID_PREFIX.attendance);
		const clockInDate = new Date();

		await context.db.insert(attendanceLogs).values({
			id: newId,
			workspaceId: meta.workspaceId,
			userId: meta.userId,
			clockInAt: clockInDate,
		});

		return {
			attendanceId: newId,
			clockInAt: clockInDate.toISOString(),
			assignedDeskId: meta.assignedDeskId,
			isResumed: false,
		};
	}),

	clockOut: pub
		.input(clockOutInputSchema)
		.handler(async ({ input, context }) => {
			const clockOutDate = new Date();
			const effectiveUserId = input.userId ?? DEFAULT_USER_ID;

			// Update attendance log
			await context.db
				.update(attendanceLogs)
				.set({ clockOutAt: clockOutDate })
				.where(eq(attendanceLogs.id, input.attendanceId));

			// Insert daily report
			const reportId = createId(ID_PREFIX.dailyReport);
			await context.db.insert(dailyReports).values({
				id: reportId,
				workspaceId: input.workspaceId,
				userId: effectiveUserId,
				attendanceId: input.attendanceId,
				summaryText: input.report.points.join("\n"),
				taskLinks: input.report.taskLinks,
			});

			return {
				success: true,
				attendanceId: input.attendanceId,
				reportId,
				clockOutAt: clockOutDate.toISOString(),
			};
		}),

	status: pub
		.input(attendanceStatusInputSchema)
		.handler(async ({ input, context }) => {
			const effectiveUserId = input.userId ?? DEFAULT_USER_ID;
			const effectiveWorkspaceId = input.workspaceId ?? DEFAULT_WORKSPACE_ID;

			const openSessions = await context.db
				.select()
				.from(attendanceLogs)
				.where(
					and(
						eq(attendanceLogs.workspaceId, effectiveWorkspaceId),
						eq(attendanceLogs.userId, effectiveUserId),
						isNull(attendanceLogs.clockOutAt),
					),
				)
				.orderBy(desc(attendanceLogs.clockInAt))
				.limit(1);

			const active = openSessions[0];

			const member = await context.db
				.select()
				.from(workspaceMembers)
				.where(
					and(
						eq(workspaceMembers.workspaceId, effectiveWorkspaceId),
						eq(workspaceMembers.userId, effectiveUserId),
					),
				)
				.limit(1);

			return {
				isClockedIn: Boolean(active),
				activeSession: active
					? {
							id: active.id,
							clockInAt: active.clockInAt.toISOString(),
						}
					: null,
				assignedDeskId: member[0]?.assignedDeskId ?? "desk_1",
			};
		}),

	reports: pub
		.input(attendanceHistoryInputSchema)
		.handler(async ({ input, context }) => {
			const reports = await context.db
				.select({
					id: dailyReports.id,
					attendanceId: dailyReports.attendanceId,
					userId: dailyReports.userId,
					userName: users.name,
					summaryText: dailyReports.summaryText,
					taskLinks: dailyReports.taskLinks,
					createdAt: dailyReports.createdAt,
				})
				.from(dailyReports)
				.leftJoin(users, eq(dailyReports.userId, users.id))
				.where(eq(dailyReports.workspaceId, input.workspaceId))
				.orderBy(desc(dailyReports.createdAt))
				.limit(input.limit ?? 10);

			return reports.map((r) => ({
				...r,
				userName: r.userName ?? "Member",
				createdAt:
					r.createdAt instanceof Date
						? r.createdAt.toISOString()
						: String(r.createdAt ?? new Date().toISOString()),
				points: (r.summaryText ?? "").split("\n").filter(Boolean),
			}));
		}),
};
