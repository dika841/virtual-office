import {
	CHAT_BUBBLE_DURATION_MS,
	type TPresenceEvent,
	type TPresenceState,
} from "@virtual-office/schemas";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	connectPresence,
	type TPresenceConnection,
} from "../presence-socket.ts";

type TUseOfficePresenceOptions = {
	workspaceId: string;
	userId: string;
	characterId?: number;
	initialX?: number;
	initialY?: number;
};

export type TChatBubbleRecord = Record<
	string,
	{ text: string; timestamp: number }
>;

export function useOfficePresence({
	workspaceId,
	userId,
	characterId = 1,
	initialX = 165,
	initialY = 235,
}: TUseOfficePresenceOptions) {
	const [userPos, setUserPos] = useState({ x: initialX, y: initialY });
	const [peers, setPeers] = useState<TPresenceEvent[]>([]);
	const [socketStatus, setSocketStatus] = useState<
		"connected" | "connecting" | "disconnected"
	>("connecting");
	const [chatBubbles, setChatBubbles] = useState<TChatBubbleRecord>({});

	const initialPosRef = useRef({ x: initialX, y: initialY });
	const socketRef = useRef<TPresenceConnection | null>(null);
	const signalHandlerRef = useRef<
		((senderUserId: string, signal: unknown) => void) | null
	>(null);
	const bubbleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);

	useEffect(() => {
		const conn = connectPresence({
			workspaceId,
			userId,
			characterId,
			initialX: initialPosRef.current.x,
			initialY: initialPosRef.current.y,
			onStatusChange: (status) => setSocketStatus(status),
			onMessage: (msg) => {
				if (msg.type === "snapshot") {
					setPeers(msg.peers.filter((p) => p.userId !== userId));
				} else if (msg.type === "presence") {
					if (msg.peer.userId === userId) return;
					setPeers((prev) => {
						const index = prev.findIndex((p) => p.userId === msg.peer.userId);
						if (index >= 0) {
							const copy = [...prev];
							copy[index] = msg.peer;
							return copy;
						}
						return [...prev, msg.peer];
					});
				} else if (msg.type === "leave") {
					setPeers((prev) => prev.filter((p) => p.userId !== msg.userId));
					setChatBubbles((prev) => {
						if (!prev[msg.userId]) return prev;
						const copy = { ...prev };
						delete copy[msg.userId];
						return copy;
					});
				} else if (msg.type === "signal") {
					signalHandlerRef.current?.(msg.senderUserId, msg.signal);
				} else if (msg.type === "chat") {
					const senderId = msg.userId;
					setChatBubbles((prev) => ({
						...prev,
						[senderId]: { text: msg.text, timestamp: msg.timestamp },
					}));

					// Auto-dismiss bubble after duration
					const existingTimer = bubbleTimersRef.current.get(senderId);
					if (existingTimer) clearTimeout(existingTimer);

					const timer = setTimeout(() => {
						setChatBubbles((prev) => {
							if (!prev[senderId]) return prev;
							const copy = { ...prev };
							delete copy[senderId];
							return copy;
						});
						bubbleTimersRef.current.delete(senderId);
					}, CHAT_BUBBLE_DURATION_MS);

					bubbleTimersRef.current.set(senderId, timer);
				}
			},
		});

		socketRef.current = conn;

		return () => {
			for (const timer of bubbleTimersRef.current.values()) {
				clearTimeout(timer);
			}
			bubbleTimersRef.current.clear();
			conn.close();
			socketRef.current = null;
		};
	}, [workspaceId, userId, characterId]);

	const move = useCallback((x: number, y: number) => {
		setUserPos({ x, y });
		socketRef.current?.move(x, y);
	}, []);

	const setPresenceState = useCallback((state: TPresenceState) => {
		socketRef.current?.setState(state);
	}, []);

	const setCharacter = useCallback((id: number) => {
		socketRef.current?.setCharacter(id);
	}, []);

	const sendSignal = useCallback((targetUserId: string, signal: unknown) => {
		socketRef.current?.sendSignal(targetUserId, signal);
	}, []);

	const sendChat = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		socketRef.current?.sendChat(trimmed);
	}, []);

	const registerSignalHandler = useCallback(
		(handler: (senderUserId: string, signal: unknown) => void) => {
			signalHandlerRef.current = handler;
			return () => {
				if (signalHandlerRef.current === handler) {
					signalHandlerRef.current = null;
				}
			};
		},
		[],
	);

	return {
		userPos,
		setUserPos,
		peers,
		socketStatus,
		chatBubbles,
		move,
		setPresenceState,
		setCharacter,
		sendSignal,
		sendChat,
		registerSignalHandler,
	};
}
