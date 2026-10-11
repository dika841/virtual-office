import { attendanceRouter } from "./routers/attendance-router.ts";
import { healthRouter } from "./routers/health-router.ts";

export const appRouter = {
	health: healthRouter,
	attendance: attendanceRouter,
};

export type TAppRouter = typeof appRouter;
