import { DurableObject } from "cloudflare:workers";
import {
	presenceClientMessageSchema,
	type TPresenceEvent,
	type TPresenceServerMessage,
} from "@virtual-office/schemas";
import type { TBindings } from "../env.ts";
import { createPresenceStore, type TPresenceStore } from "./presence-store.ts";

/**
 * Redis is a mirror, not the hot path. Coordinates arrive at up to 20Hz per
 * user; writing each one to Upstash would be wasteful. Mirror on state change
 * or when the last write is older than this.
 */
const REDIS_MIRROR_INTERVAL_MS = 15_000;

type TAttachment = TPresenceEvent & { mirroredAt: number };

/**
 * One instance per workspace. Uses the WebSocket Hibernation API so idle
 * workspaces cost nothing; per-socket state lives in the socket attachment and
 * survives hibernation.
 */
export class PresenceHub extends DurableObject<TBindings> {
	private readonly store: TPresenceStore;

	constructor(ctx: DurableObjectState, env: TBindings) {
		super(ctx, env);
		this.store = createPresenceStore(env);
	}

	override async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected a WebSocket upgrade", { status: 426 });
		}

		const url = new URL(request.url);
		const workspaceId = url.searchParams.get("workspaceId");
		// TODO(auth): derive userId from a verified session, never from the query string.
		const userId = url.searchParams.get("userId");
		if (!workspaceId || !userId) {
			return new Response("workspaceId and userId are required", {
				status: 400,
			});
		}

		const { 0: client, 1: server } = new WebSocketPair();
		this.ctx.acceptWebSocket(server, [userId]);

		const initialX = Number(url.searchParams.get("x")) || 165;
		const initialY = Number(url.searchParams.get("y")) || 305;
		const characterId = Number(url.searchParams.get("characterId")) || 1;

		const attachment: TAttachment = {
			userId,
			workspaceId,
			x: initialX,
			y: initialY,
			state: "idle",
			characterId,
			mirroredAt: 0,
		};
		server.serializeAttachment(attachment);

		this.send(server, { type: "snapshot", peers: this.peers() });
		this.broadcast({ type: "presence", peer: toEvent(attachment) }, server);

		return new Response(null, { status: 101, webSocket: client });
	}

	override async webSocketMessage(
		ws: WebSocket,
		raw: string | ArrayBuffer,
	): Promise<void> {
		if (typeof raw !== "string") return;

		const parsed = presenceClientMessageSchema.safeParse(safeJson(raw));
		if (!parsed.success) return;

		const current = ws.deserializeAttachment() as TAttachment;
		const message = parsed.data;

		if (message.type === "chat") {
			this.broadcast({
				type: "chat",
				userId: current.userId,
				text: message.text,
				timestamp: Date.now(),
			});
			return;
		}

		if (message.type === "signal") {
			let targets = this.ctx.getWebSockets(message.targetUserId);
			if (targets.length === 0) {
				targets = this.ctx.getWebSockets().filter((s) => {
					const att = s.deserializeAttachment() as TAttachment | null;
					return att?.userId === message.targetUserId;
				});
			}
			for (const target of targets) {
				this.send(target, {
					type: "signal",
					senderUserId: current.userId,
					signal: message.signal,
				});
			}
			return;
		}

		const next: TAttachment =
			message.type === "move"
				? { ...current, x: message.x, y: message.y }
				: message.type === "state"
					? { ...current, state: message.state }
					: message.type === "character"
						? { ...current, characterId: message.characterId }
						: current;

		const now = Date.now();
		const shouldMirror =
			next.state !== current.state ||
			now - current.mirroredAt > REDIS_MIRROR_INTERVAL_MS;

		if (shouldMirror) {
			next.mirroredAt = now;
			this.ctx.waitUntil(this.store.put(toEvent(next)));
		}
		ws.serializeAttachment(next);

		if (message.type !== "heartbeat") {
			this.broadcast({ type: "presence", peer: toEvent(next) }, ws);
		}
	}

	override async webSocketClose(ws: WebSocket): Promise<void> {
		this.leave(ws);
	}

	override async webSocketError(ws: WebSocket): Promise<void> {
		this.leave(ws);
	}

	private leave(ws: WebSocket): void {
		const { userId, workspaceId } = ws.deserializeAttachment() as TAttachment;
		this.ctx.waitUntil(this.store.remove(workspaceId, userId));
		this.broadcast({ type: "leave", userId }, ws);
	}

	private peers(): TPresenceEvent[] {
		return this.ctx
			.getWebSockets()
			.map((socket) => toEvent(socket.deserializeAttachment() as TAttachment));
	}

	private broadcast(message: TPresenceServerMessage, except?: WebSocket): void {
		for (const socket of this.ctx.getWebSockets()) {
			if (socket !== except) this.send(socket, message);
		}
	}

	private send(socket: WebSocket, message: TPresenceServerMessage): void {
		try {
			socket.send(JSON.stringify(message));
		} catch {
			// Socket already closing; webSocketClose will clean up.
		}
	}
}

const toEvent = ({ mirroredAt: _, ...event }: TAttachment): TPresenceEvent =>
	event;

const safeJson = (raw: string): unknown => {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};
