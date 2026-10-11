import { RPCHandler } from "@orpc/server/fetch";
import { createDb } from "@virtual-office/database";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMount } from "./auth/index.ts";
import type { TBindings } from "./env.ts";
import { appRouter } from "./orpc/router.ts";

const rpcHandler = new RPCHandler(appRouter);

export const app = new Hono<{ Bindings: TBindings }>();

app.use("*", logger());
app.use("*", (c, next) => {
	const origin = c.req.header("Origin");
	const allowedOrigins = [
		c.env.WEB_ORIGIN,
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	].filter(Boolean) as string[];

	return cors({
		origin:
			origin && (allowedOrigins.includes(origin) || allowedOrigins.length === 0)
				? origin
				: c.env.WEB_ORIGIN || "http://localhost:5173",
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposeHeaders: ["Set-Cookie"],
		credentials: true,
	})(c, next);
});

app.get("/health", (c) => c.json({ status: "ok", app: "virtual-office-api" }));

// Better Auth Route Mount
authMount(app);

app.all("/rpc/*", async (c) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: { db: createDb(c.env.DATABASE_URL) },
	});
	return matched ? response : c.notFound();
});

/** WebSocket entry: one PresenceHub Durable Object per workspace. */
app.get("/ws/:workspaceId", (c) => {
	const workspaceId = c.req.param("workspaceId");
	const url = new URL(c.req.url);
	url.searchParams.set("workspaceId", workspaceId);

	const hub = c.env.PRESENCE_HUB.get(
		c.env.PRESENCE_HUB.idFromName(workspaceId),
	);
	return hub.fetch(new Request(url, c.req.raw));
});
