import type { TPresenceEvent, TPresenceState } from "@virtual-office/schemas";
import {
	Application,
	Assets,
	Container,
	Graphics,
	Sprite,
	Text,
	TextStyle,
	type Texture,
} from "pixi.js";
import { useEffect, useRef, useState } from "react";
import type { TPeerAudioStatus } from "../../presence/hooks/useSpatialAudio.ts";

export type TDeskInfo = {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
	seatX: number;
	seatY: number;
};

export const PANTRY_COORDINATES = { x: 1060, y: 400 };
export const FOCUS_COORDINATES = { x: 420, y: 650 };
export const MEETING_COORDINATES = { x: 1040, y: 670 };
export const ENTRANCE_COORDINATES = { x: 685, y: 730 };

export const OFFICE_DESKS: TDeskInfo[] = [
	{
		id: "desk_1",
		label: "D-01",
		x: 95,
		y: 110,
		width: 140,
		height: 115,
		seatX: 165,
		seatY: 235,
	},
	{
		id: "desk_2",
		label: "D-02",
		x: 235,
		y: 110,
		width: 140,
		height: 115,
		seatX: 305,
		seatY: 235,
	},
	{
		id: "desk_3",
		label: "D-03",
		x: 375,
		y: 110,
		width: 140,
		height: 115,
		seatX: 445,
		seatY: 235,
	},
	{
		id: "desk_4",
		label: "D-04",
		x: 515,
		y: 110,
		width: 140,
		height: 115,
		seatX: 585,
		seatY: 235,
	},
	{
		id: "desk_5",
		label: "D-05",
		x: 95,
		y: 310,
		width: 140,
		height: 120,
		seatX: 165,
		seatY: 440,
	},
	{
		id: "desk_6",
		label: "D-06",
		x: 235,
		y: 310,
		width: 140,
		height: 120,
		seatX: 305,
		seatY: 440,
	},
	{
		id: "desk_7",
		label: "D-07",
		x: 375,
		y: 310,
		width: 140,
		height: 120,
		seatX: 445,
		seatY: 440,
	},
	{
		id: "desk_8",
		label: "D-08",
		x: 515,
		y: 310,
		width: 140,
		height: 120,
		seatX: 585,
		seatY: 440,
	},
	{
		id: "desk_9",
		label: "D-09",
		x: 95,
		y: 510,
		width: 140,
		height: 120,
		seatX: 165,
		seatY: 640,
	},
	{
		id: "desk_10",
		label: "D-10",
		x: 235,
		y: 510,
		width: 140,
		height: 120,
		seatX: 305,
		seatY: 640,
	},
	{
		id: "desk_11",
		label: "D-11",
		x: 375,
		y: 510,
		width: 140,
		height: 120,
		seatX: 445,
		seatY: 640,
	},
	{
		id: "desk_12",
		label: "D-12",
		x: 515,
		y: 510,
		width: 140,
		height: 120,
		seatX: 585,
		seatY: 640,
	},
];

const CHARACTER_SPRITES = [
	"/assets/characters/char_1.png",
	"/assets/characters/char_2.png",
	"/assets/characters/char_3.png",
	"/assets/characters/char_4.png",
	"/assets/characters/char_5.png",
	"/assets/characters/char_6.png",
];

export function getCharacterIndex(userId: string): number {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = (hash << 5) - hash + userId.charCodeAt(i);
		hash |= 0;
	}
	return (Math.abs(hash) % CHARACTER_SPRITES.length) + 1;
}

type TOfficeCanvasProps = {
	peers: TPresenceEvent[];
	currentUser: {
		id: string;
		name: string;
		characterId?: number;
		x: number;
		y: number;
		state: TPresenceState;
	};
	assignedDeskId?: string;
	isMicEnabled?: boolean;
	peersAudioStatus?: Map<string, TPeerAudioStatus>;
	chatBubbles?: Record<string, { text: string; timestamp: number }>;
	onMove: (x: number, y: number) => void;
	onSelectDesk?: (deskId: string) => void;
};

type TAvatarRenderState = {
	container: Container;
	sprite: Sprite;
	shadow: Graphics;
	statePill: Container;
	nameContainer: Container;
	chatBubbleContainer: Container;
	chatText: string;
	chatTimestamp: number;
	charIndex: number;
	targetX: number;
	targetY: number;
	currentX: number;
	currentY: number;
	walkStep: number;
	facingLeft: boolean;
	state: TPresenceState;
	name: string;
	isCurrent: boolean;
};

export function OfficeCanvas({
	peers,
	currentUser,
	assignedDeskId = "desk_1",
	isMicEnabled = false,
	peersAudioStatus,
	chatBubbles,
	onMove,
	onSelectDesk,
}: TOfficeCanvasProps) {
	const [isReady, setIsReady] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const appRef = useRef<Application | null>(null);
	const worldRef = useRef<Container | null>(null);
	const desksGraphicRef = useRef<Graphics | null>(null);
	const auraGraphicRef = useRef<Graphics | null>(null);
	const avatarMapRef = useRef<Map<string, TAvatarRenderState>>(new Map());
	const characterTexturesRef = useRef<Texture[]>([]);

	const currentUserRef = useRef(currentUser);
	const onMoveRef = useRef(onMove);
	const onSelectDeskRef = useRef(onSelectDesk);

	useEffect(() => {
		currentUserRef.current = currentUser;
		onMoveRef.current = onMove;
		onSelectDeskRef.current = onSelectDesk;
	});

	// Canvas initialization
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		let destroyed = false;
		let cleanupListeners: (() => void) | null = null;
		const app = new Application();

		const initApp = async () => {
			try {
				await app.init({
					resizeTo: el,
					backgroundColor: 0x05070f,
					resolution: Math.min(window.devicePixelRatio || 1, 2),
					autoDensity: true,
					antialias: false,
				});

				if (destroyed) {
					app.destroy(true, { children: true });
					return;
				}

				el.appendChild(app.canvas);
				appRef.current = app;

				// Load pixel art background and 8-bit character sprites
				const [bgTexture, ...charTextures] = await Promise.all([
					Assets.load<Texture>("/assets/office_map.jpg"),
					...CHARACTER_SPRITES.map((src) => Assets.load<Texture>(src)),
				]);

				if (destroyed) return;

				for (const tex of charTextures) {
					if (tex.source) {
						tex.source.scaleMode = "nearest";
					}
				}

				characterTexturesRef.current = charTextures;

				const world = new Container();
				app.stage.addChild(world);
				worldRef.current = world;

				const desksLayer = new Graphics();
				world.addChild(desksLayer);
				desksGraphicRef.current = desksLayer;

				const auraLayer = new Graphics();
				world.addChild(auraLayer);
				auraGraphicRef.current = auraLayer;

				const avatarsLayer = new Container();
				world.addChild(avatarsLayer);

				const mapW = 1376;
				const mapH = 768;

				const updateWorldTransform = () => {
					const screenW = app.screen.width;
					const screenH = app.screen.height;
					const scale = Math.min(screenW / mapW, screenH / mapH, 1.25);
					world.scale.set(scale);
					world.x = Math.round((screenW - mapW * scale) / 2);
					world.y = Math.round((screenH - mapH * scale) / 2);
				};

				updateWorldTransform();
				window.addEventListener("resize", updateWorldTransform);

				// 2D Pixel Art Map Background
				const bgSprite = new Sprite(bgTexture);
				bgSprite.width = 1376;
				bgSprite.height = 768;
				world.addChild(bgSprite);

				// Subtle architectural outer border
				const mapBorder = new Graphics();
				mapBorder.roundRect(0, 0, 1376, 768, 8);
				mapBorder.stroke({
					width: 1.5,
					color: 0x334155,
					alpha: 0.7,
				});
				world.addChild(mapBorder);

				world.setChildIndex(bgSprite, 0);
				world.setChildIndex(mapBorder, 1);
				world.setChildIndex(desksLayer, 2);
				world.setChildIndex(auraLayer, 3);
				world.setChildIndex(avatarsLayer, 4);

				// Stage pointer interaction
				app.stage.eventMode = "static";
				app.stage.hitArea = app.screen;
				app.stage.on("pointerdown", (e) => {
					const localPos = world.toLocal(e.global);
					const targetX = Math.round(localPos.x);
					const targetY = Math.round(localPos.y);

					// Check if click was on a desk
					const clickedDesk = OFFICE_DESKS.find(
						(d) =>
							targetX >= d.x &&
							targetX <= d.x + d.width &&
							targetY >= d.y &&
							targetY <= d.y + d.height,
					);

					if (clickedDesk) {
						onSelectDeskRef.current?.(clickedDesk.id);
						onMoveRef.current?.(clickedDesk.seatX, clickedDesk.seatY);
						return;
					}

					const clampedX = Math.max(30, Math.min(1346, targetX));
					const clampedY = Math.max(30, Math.min(738, targetY));
					onMoveRef.current?.(clampedX, clampedY);
				});

				// Animation ticker
				app.ticker.add((ticker) => {
					const now = performance.now();
					const delta = ticker.deltaTime;
					const lerpFactor = Math.min(1, 0.16 * delta);

					for (const avatar of avatarMapRef.current.values()) {
						const dx = avatar.targetX - avatar.currentX;
						const dy = avatar.targetY - avatar.currentY;
						const dist = Math.hypot(dx, dy);

						if (dist > 1.2) {
							avatar.currentX += dx * lerpFactor;
							avatar.currentY += dy * lerpFactor;
							avatar.walkStep += 0.24;

							if (dx < -0.6) avatar.facingLeft = true;
							else if (dx > 0.6) avatar.facingLeft = false;

							// Cute bounce step while moving
							const bob = Math.sin(avatar.walkStep) * 2.5;
							avatar.sprite.y = -Math.abs(bob);
							avatar.sprite.rotation = Math.sin(avatar.walkStep) * 0.08;
						} else {
							avatar.currentX = avatar.targetX;
							avatar.currentY = avatar.targetY;
							avatar.walkStep = 0;
							avatar.sprite.rotation = 0;

							// Cute breathing idle animation
							const breathe =
								Math.sin((now + avatar.charIndex * 180) / 400) * 0.8;
							avatar.sprite.y = breathe;
						}

						// Flip sprite facing direction
						const targetH = 54;
						const baseScale = targetH / (avatar.sprite.texture.height || 417);
						avatar.sprite.scale.x = avatar.facingLeft ? -baseScale : baseScale;
						avatar.sprite.scale.y = baseScale;

						avatar.container.x = Math.round(avatar.currentX);
						avatar.container.y = Math.round(avatar.currentY);

						// Bubble Chat animation & fading
						if (avatar.chatTimestamp && avatar.chatBubbleContainer.visible) {
							const elapsed = Date.now() - avatar.chatTimestamp;
							if (elapsed > 5000) {
								avatar.chatBubbleContainer.alpha = Math.max(
									0,
									1 - (elapsed - 5000) / 1000,
								);
							} else {
								avatar.chatBubbleContainer.alpha = 1;
							}
							avatar.chatBubbleContainer.y = -88 + Math.sin(now / 350) * 1.2;
						}
					}
				});

				// Canvas Ticker Throttling (battery / performance preservation)
				const handleVisibilityChange = () => {
					if (document.hidden) {
						app.ticker.stop();
					} else {
						app.ticker.start();
					}
				};

				document.addEventListener("visibilitychange", handleVisibilityChange);

				cleanupListeners = () => {
					window.removeEventListener("resize", updateWorldTransform);
					document.removeEventListener(
						"visibilitychange",
						handleVisibilityChange,
					);
				};

				setIsReady(true);
			} catch (err) {
				console.error("Failed to initialize PixiJS OfficeCanvas:", err);
			}
		};

		initApp();

		return () => {
			destroyed = true;
			cleanupListeners?.();
			if (appRef.current) {
				const app = appRef.current;
				try {
					if (app.renderer) {
						app.destroy(true, { children: true });
					}
				} catch {
					// Fallback
				}
				appRef.current = null;
			}
			avatarMapRef.current.clear();
			setIsReady(false);
		};
	}, []);

	// Render desk highlights
	useEffect(() => {
		const gfx = desksGraphicRef.current;
		if (!gfx || !isReady) return;

		gfx.clear();

		for (const desk of OFFICE_DESKS) {
			const isAssigned = desk.id === assignedDeskId;

			if (isAssigned) {
				gfx.roundRect(
					desk.x - 3,
					desk.y - 3,
					desk.width + 6,
					desk.height + 6,
					8,
				);
				gfx.fill({ color: 0x10b981, alpha: 0.1 });
				gfx.stroke({ width: 1.5, color: 0x10b981, alpha: 0.7 });
			} else {
				gfx.roundRect(desk.x, desk.y, desk.width, desk.height, 6);
				gfx.fill({ color: 0x0f172a, alpha: 0.2 });
				gfx.stroke({ width: 1, color: 0x334155, alpha: 0.35 });
			}

			// Soft desk seat circle
			gfx.circle(desk.seatX, desk.seatY, 11);
			gfx.fill({
				color: isAssigned ? 0x10b981 : 0x1e293b,
				alpha: isAssigned ? 0.3 : 0.4,
			});
			gfx.stroke({
				width: 1,
				color: isAssigned ? 0x34d399 : 0x475569,
				alpha: 0.6,
			});
		}
	}, [assignedDeskId, isReady]);

	// Render avatars, name tags, and speech bubbles
	useEffect(() => {
		if (!isReady || !worldRef.current) return;

		const avatarsLayer = worldRef.current.getChildAt(4) as Container;
		if (!avatarsLayer) return;

		const activeIds = new Set<string>();

		const allMembers = [
			{
				id: currentUser.id,
				name: currentUser.name,
				characterId: currentUser.characterId || 1,
				targetX: currentUser.x,
				targetY: currentUser.y,
				state: currentUser.state,
				isCurrent: true,
			},
			...peers.map((peer) => ({
				id: peer.userId,
				name: peer.userId.replace("usr_", "@"),
				characterId: peer.characterId || getCharacterIndex(peer.userId),
				targetX: peer.x,
				targetY: peer.y,
				state: peer.state,
				isCurrent: false,
			})),
		];

		const nameTagStyle = new TextStyle({
			fontFamily: "Geist Mono Variable, monospace",
			fontSize: 9,
			fill: 0xf8fafc,
			letterSpacing: 0.5,
		});

		for (const member of allMembers) {
			activeIds.add(member.id);
			let existing = avatarMapRef.current.get(member.id);
			const charIdx = member.characterId || getCharacterIndex(member.id);
			const texture =
				characterTexturesRef.current[charIdx - 1] ||
				characterTexturesRef.current[0];

			if (!existing && texture) {
				const avatarContainer = new Container();
				avatarContainer.x = member.targetX;
				avatarContainer.y = member.targetY;

				// 1. Soft pixel shadow
				const shadow = new Graphics();
				shadow.ellipse(0, 0, 14, 5);
				shadow.fill({ color: 0x05070d, alpha: 0.5 });
				avatarContainer.addChild(shadow);

				// 2. Cute 8-bit character sprite
				const sprite = new Sprite(texture);
				sprite.anchor.set(0.5, 0.95);
				const targetH = 54;
				const scaleFactor = targetH / (texture.height || 417);
				sprite.scale.set(scaleFactor);
				avatarContainer.addChild(sprite);

				// 3. Status Badge Pill
				const statePill = new Container();
				statePill.y = -58;
				avatarContainer.addChild(statePill);

				// 4. Name tag
				const nameContainer = new Container();
				nameContainer.y = -72;
				avatarContainer.addChild(nameContainer);

				// 5. Speech Bubble Container (floats above avatar)
				const chatBubbleContainer = new Container();
				chatBubbleContainer.y = -88;
				chatBubbleContainer.visible = false;
				avatarContainer.addChild(chatBubbleContainer);

				avatarsLayer.addChild(avatarContainer);

				existing = {
					container: avatarContainer,
					sprite,
					shadow,
					statePill,
					nameContainer,
					chatBubbleContainer,
					chatText: "",
					chatTimestamp: 0,
					charIndex: charIdx,
					targetX: member.targetX,
					targetY: member.targetY,
					currentX: member.targetX,
					currentY: member.targetY,
					walkStep: 0,
					facingLeft: false,
					state: member.state,
					name: member.name,
					isCurrent: member.isCurrent,
				};

				avatarMapRef.current.set(member.id, existing);
			}

			if (existing) {
				if (existing.charIndex !== charIdx && texture) {
					existing.charIndex = charIdx;
					existing.sprite.texture = texture;
					const targetH = 54;
					const scaleFactor = targetH / (texture.height || 417);
					existing.sprite.scale.set(scaleFactor);
				}
				existing.targetX = member.targetX;
				existing.targetY = member.targetY;
				existing.state = member.state;
				existing.name = member.name;

				// Refresh mini state pill
				const pill = existing.statePill;
				pill.removeChildren();

				const stateColor =
					member.state === "working"
						? 0x10b981
						: member.state === "focus"
							? 0x6366f1
							: member.state === "break"
								? 0xf59e0b
								: 0x64748b;

				const stateLabel = member.state.toUpperCase();
				const stateStyle = new TextStyle({
					fontFamily: "Geist Mono Variable, monospace",
					fontSize: 7.5,
					fill: stateColor,
					fontWeight: "bold",
				});
				const labelText = new Text({ text: stateLabel, style: stateStyle });
				labelText.x = -labelText.width / 2;

				const pillBg = new Graphics();
				const pillW = labelText.width + 8;
				pillBg.roundRect(-pillW / 2, -1, pillW, 11, 3);
				pillBg.fill({ color: 0x060913, alpha: 0.92 });
				pillBg.stroke({ width: 1, color: stateColor, alpha: 0.8 });

				pill.addChild(pillBg);
				pill.addChild(labelText);

				// Refresh name container with voice range indicator
				const nameBox = existing.nameContainer;
				nameBox.removeChildren();

				const isAudioInRange =
					!member.isCurrent &&
					peersAudioStatus?.get(member.id)?.inRange &&
					isMicEnabled &&
					currentUser.state !== "focus" &&
					member.state !== "focus";

				const displayName = member.isCurrent
					? `${member.name} (You)`
					: isAudioInRange
						? `${member.name} 🎙️`
						: member.name;

				const nameText = new Text({
					text: displayName,
					style: nameTagStyle,
				});
				nameText.x = -nameText.width / 2;

				const tagBg = new Graphics();
				const padX = 6;
				const bgW = nameText.width + padX * 2;
				tagBg.roundRect(-bgW / 2, -2, bgW, 14, 4);
				tagBg.fill({
					color: member.isCurrent
						? 0x064e3b
						: isAudioInRange
							? 0x0f2a24
							: 0x0b1120,
					alpha: 0.9,
				});
				tagBg.stroke({
					width: 1,
					color: member.isCurrent
						? 0x10b981
						: isAudioInRange
							? 0x34d399
							: 0x334155,
				});

				nameBox.addChild(tagBg);
				nameBox.addChild(nameText);

				// Render Bubble Chat
				const bubbleData = chatBubbles?.[member.id];
				const chatBubble = existing.chatBubbleContainer;

				if (bubbleData?.text) {
					if (
						existing.chatText !== bubbleData.text ||
						existing.chatTimestamp !== bubbleData.timestamp
					) {
						existing.chatText = bubbleData.text;
						existing.chatTimestamp = bubbleData.timestamp;
						chatBubble.removeChildren();
						chatBubble.visible = true;

						const chatTextStyle = new TextStyle({
							fontFamily: "Geist Variable, sans-serif",
							fontSize: 9.5,
							fill: 0xffffff,
							align: "center",
							wordWrap: true,
							wordWrapWidth: 130,
							lineHeight: 12,
						});

						const textObj = new Text({
							text: bubbleData.text,
							style: chatTextStyle,
						});
						textObj.anchor.set(0.5, 0.5);

						const padX = 8;
						const padY = 5;
						const bw = Math.max(40, Math.min(150, textObj.width + padX * 2));
						const bh = Math.max(22, textObj.height + padY * 2);

						const bubbleGfx = new Graphics();
						// Bubble background
						bubbleGfx.roundRect(-bw / 2, -bh, bw, bh, 7);
						bubbleGfx.fill({
							color: member.isCurrent ? 0x06281e : 0x0f172a,
							alpha: 0.95,
						});
						bubbleGfx.stroke({
							width: 1.2,
							color: member.isCurrent ? 0x10b981 : 0x475569,
							alpha: 0.9,
						});

						// Speech triangle tail
						bubbleGfx.moveTo(-3, 0);
						bubbleGfx.lineTo(0, 4);
						bubbleGfx.lineTo(3, 0);
						bubbleGfx.fill({
							color: member.isCurrent ? 0x06281e : 0x0f172a,
							alpha: 0.95,
						});

						textObj.y = -bh / 2;

						chatBubble.addChild(bubbleGfx);
						chatBubble.addChild(textObj);
					}
				} else {
					if (existing.chatText) {
						existing.chatText = "";
						existing.chatTimestamp = 0;
						chatBubble.removeChildren();
						chatBubble.visible = false;
					}
				}
			}
		}

		// Remove disconnected peers
		for (const [id, avatar] of avatarMapRef.current.entries()) {
			if (!activeIds.has(id)) {
				avatarsLayer.removeChild(avatar.container);
				avatar.container.destroy({ children: true });
				avatarMapRef.current.delete(id);
			}
		}
	}, [
		currentUser,
		peers,
		isReady,
		isMicEnabled,
		peersAudioStatus,
		chatBubbles,
	]);

	return (
		<div
			ref={containerRef}
			className="relative h-dvh w-full overflow-hidden bg-[#05070f] select-none cursor-pointer"
		/>
	);
}
