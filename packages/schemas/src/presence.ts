import { z } from "zod";

/**
 * Ephemeral presence contract (brief section 4).
 * Nothing in this file is ever persisted to PostgreSQL.
 */
export const PRESENCE_STATES = ["idle", "working", "focus", "break"] as const;

export const presenceStateSchema = z.enum(PRESENCE_STATES);
export type TPresenceState = z.infer<typeof presenceStateSchema>;

/** Redis key TTL for a user's live position. Expires on its own after disconnect. */
export const PRESENCE_TTL_SECONDS = 60;

/** Active tab: 20Hz coordinate broadcast. */
export const PRESENCE_ACTIVE_INTERVAL_MS = 50;

/** Hidden / minimized tab: heartbeat every 30s (~0.03Hz). */
export const PRESENCE_HIDDEN_INTERVAL_MS = 30_000;

/** Spatial Audio max radius in 2D canvas pixels. */
export const SPATIAL_AUDIO_MAX_DISTANCE = 260;
export const SPATIAL_AUDIO_MIN_DISTANCE = 60;

/** Bubble Chat duration before auto-dissolving (in ms). */
export const CHAT_BUBBLE_DURATION_MS = 6000;

export const presenceEventSchema = z.object({
	userId: z.string().min(1),
	workspaceId: z.string().min(1),
	x: z.number().finite(),
	y: z.number().finite(),
	state: presenceStateSchema,
	characterId: z.number().int().min(1).max(6).optional().default(1),
});
export type TPresenceEvent = z.infer<typeof presenceEventSchema>;

/** Messages sent by the browser to the workspace presence hub. */
export const presenceClientMessageSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("move"),
		x: z.number().finite(),
		y: z.number().finite(),
	}),
	z.object({ type: z.literal("state"), state: presenceStateSchema }),
	z.object({
		type: z.literal("character"),
		characterId: z.number().int().min(1).max(6),
	}),
	z.object({ type: z.literal("heartbeat") }),
	z.object({
		type: z.literal("signal"),
		targetUserId: z.string().min(1),
		signal: z.unknown(),
	}),
	z.object({
		type: z.literal("chat"),
		text: z.string().trim().min(1).max(120),
	}),
]);
export type TPresenceClientMessage = z.infer<
	typeof presenceClientMessageSchema
>;

/** Messages broadcast by the presence hub to every connected browser. */
export const presenceServerMessageSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("snapshot"),
		peers: z.array(presenceEventSchema),
	}),
	z.object({ type: z.literal("presence"), peer: presenceEventSchema }),
	z.object({ type: z.literal("leave"), userId: z.string().min(1) }),
	z.object({
		type: z.literal("signal"),
		senderUserId: z.string().min(1),
		signal: z.unknown(),
	}),
	z.object({
		type: z.literal("chat"),
		userId: z.string().min(1),
		text: z.string().min(1).max(120),
		timestamp: z.number(),
	}),
]);
export type TPresenceServerMessage = z.infer<
	typeof presenceServerMessageSchema
>;

export type TChatBubble = {
	userId: string;
	text: string;
	timestamp: number;
};
