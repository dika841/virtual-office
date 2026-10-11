import { createDb } from "@virtual-office/database";
import type { Hono } from "hono";
import type { TBindings } from "../../env.ts";
import { authCreate } from "../infrastructure/better-auth.ts";

export const authMount = (app: Hono<{ Bindings: TBindings }>): void => {
	app.on(["GET", "POST", "PUT", "DELETE", "PATCH"], "/api/auth/*", (c) => {
		const db = createDb(c.env.DATABASE_URL);
		const auth = authCreate({ db, env: c.env });
		return auth.handler(c.req.raw);
	});
};
