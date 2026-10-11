import { Redis } from "@upstash/redis/cloudflare";
import {
	PRESENCE_TTL_SECONDS,
	type TPresenceEvent,
} from "@virtual-office/schemas";
import type { TBindings } from "../env.ts";

const presenceKey = (workspaceId: string, userId: string): string =>
	`presence:${workspaceId}:${userId}`;

/**
 * Short-TTL mirror of live presence in Upstash Redis. Lets other services ask
 * "who is online" without waking the Durable Object. Keys expire on their own,
 * so a crashed client never leaves a ghost behind. Never written to Postgres.
 */
export const createPresenceStore = (env: TBindings) => {
	const redis = new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	});

	return {
		put: (event: TPresenceEvent) =>
			redis.set(presenceKey(event.workspaceId, event.userId), event, {
				ex: PRESENCE_TTL_SECONDS,
			}),
		remove: (workspaceId: string, userId: string) =>
			redis.del(presenceKey(workspaceId, userId)),
	};
};

export type TPresenceStore = ReturnType<typeof createPresenceStore>;
