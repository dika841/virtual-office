import { sql } from "drizzle-orm";
import { pub } from "../base.ts";

export const healthRouter = {
	ping: pub.handler(() => ({
		status: "ok" as const,
		timestamp: new Date().toISOString(),
	})),

	database: pub.handler(async ({ context }) => {
		await context.db.execute(sql`select 1`);
		return { status: "ok" as const };
	}),
};
