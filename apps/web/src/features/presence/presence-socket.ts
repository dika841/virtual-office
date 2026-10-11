import {
	PRESENCE_ACTIVE_INTERVAL_MS,
	PRESENCE_HIDDEN_INTERVAL_MS,
	presenceServerMessageSchema,
	type TPresenceClientMessage,
	type TPresenceServerMessage,
	type TPresenceState,
} from "@virtual-office/schemas";
import { getApiOrigin } from "../../lib/api-origin.ts";

type TConnectOptions = {
	workspaceId: string;
	userId: string;
	initialX?: number;
	initialY?: number;
	characterId?: number;
	onMessage: (message: TPresenceServerMessage) => void;
	onStatusChange?: (
		status: "connected" | "connecting" | "disconnected",
	) => void;
};

/**
 * Adaptive heartbeat (brief section 6): coordinates are flushed at 20Hz while
 * the tab is visible; once hidden, only a heartbeat goes out every 30s.
 * Moves are coalesced, so only the latest position per tick is sent.
 */
export const connectPresence = ({
	workspaceId,
	userId,
	initialX = 165,
	initialY = 305,
	characterId = 1,
	onMessage,
	onStatusChange,
}: TConnectOptions) => {
	let isClosedByUser = false;
	let socket: WebSocket | null = null;
	let pendingMove: { x: number; y: number } | null = null;
	let timer: ReturnType<typeof setInterval> | undefined;
	let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

	const send = (message: TPresenceClientMessage) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	};

	const flush = () => {
		if (document.hidden) {
			send({ type: "heartbeat" });
			return;
		}
		if (pendingMove) {
			send({ type: "move", ...pendingMove });
			pendingMove = null;
		}
	};

	const schedule = () => {
		clearInterval(timer);
		timer = setInterval(
			flush,
			document.hidden
				? PRESENCE_HIDDEN_INTERVAL_MS
				: PRESENCE_ACTIVE_INTERVAL_MS,
		);
	};

	const createSocket = () => {
		if (isClosedByUser) return;
		onStatusChange?.("connecting");

		const url = new URL(
			`/ws/${encodeURIComponent(workspaceId)}`,
			getApiOrigin(),
		);
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		url.searchParams.set("userId", userId);
		url.searchParams.set("x", String(initialX));
		url.searchParams.set("y", String(initialY));
		url.searchParams.set("characterId", String(characterId));

		const ws = new WebSocket(url);
		socket = ws;

		ws.addEventListener("open", () => {
			onStatusChange?.("connected");
			schedule();
		});

		ws.addEventListener("message", (event) => {
			if (typeof event.data !== "string") return;
			const parsed = presenceServerMessageSchema.safeParse(
				safeJson(event.data),
			);
			if (parsed.success) onMessage(parsed.data);
		});

		ws.addEventListener("close", () => {
			clearInterval(timer);
			onStatusChange?.("disconnected");
			if (!isClosedByUser) {
				clearTimeout(reconnectTimer);
				reconnectTimer = setTimeout(createSocket, 2500);
			}
		});

		ws.addEventListener("error", () => {
			ws.close();
		});
	};

	createSocket();
	document.addEventListener("visibilitychange", schedule);

	return {
		move: (x: number, y: number) => {
			pendingMove = { x, y };
		},
		setState: (state: TPresenceState) => send({ type: "state", state }),
		setCharacter: (id: number) => send({ type: "character", characterId: id }),
		sendSignal: (targetUserId: string, signal: unknown) =>
			send({ type: "signal", targetUserId, signal }),
		sendChat: (text: string) => send({ type: "chat", text }),
		close: () => {
			isClosedByUser = true;
			clearInterval(timer);
			clearTimeout(reconnectTimer);
			document.removeEventListener("visibilitychange", schedule);
			if (socket) {
				socket.close();
				socket = null;
			}
		},
	};
};

export type TPresenceConnection = ReturnType<typeof connectPresence>;

const safeJson = (raw: string): unknown => {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};
