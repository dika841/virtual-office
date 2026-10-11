import { describe, expect, it } from "vitest";
import {
	presenceClientMessageSchema,
	presenceEventSchema,
	presenceServerMessageSchema,
} from "./presence.ts";

describe("presenceEventSchema", () => {
	it("accepts the payload documented in the brief", () => {
		const parsed = presenceEventSchema.safeParse({
			userId: "usr_987654321",
			workspaceId: "wsp_123456789",
			x: 450,
			y: 120,
			state: "working",
			characterId: 2,
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.characterId).toBe(2);
		}
	});

	it("defaults characterId to 1 when omitted", () => {
		const parsed = presenceEventSchema.safeParse({
			userId: "usr_987654321",
			workspaceId: "wsp_123456789",
			x: 450,
			y: 120,
			state: "working",
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.characterId).toBe(1);
		}
	});

	it("rejects unknown states", () => {
		const parsed = presenceEventSchema.safeParse({
			userId: "usr_1",
			workspaceId: "wsp_1",
			x: 0,
			y: 0,
			state: "away",
		});
		expect(parsed.success).toBe(false);
	});
});

describe("presenceClientMessageSchema", () => {
	it("discriminates on type", () => {
		expect(
			presenceClientMessageSchema.safeParse({ type: "heartbeat" }).success,
		).toBe(true);
		expect(
			presenceClientMessageSchema.safeParse({ type: "move", x: 1 }).success,
		).toBe(false);
		expect(
			presenceClientMessageSchema.safeParse({
				type: "character",
				characterId: 4,
			}).success,
		).toBe(true);
		expect(
			presenceClientMessageSchema.safeParse({
				type: "signal",
				targetUserId: "usr_2",
				signal: { type: "offer", sdp: "dummy" },
			}).success,
		).toBe(true);
		expect(
			presenceClientMessageSchema.safeParse({
				type: "chat",
				text: "Halo semua! Sedang review PR.",
			}).success,
		).toBe(true);
	});
});

describe("presenceServerMessageSchema", () => {
	it("supports WebRTC signaling messages", () => {
		expect(
			presenceServerMessageSchema.safeParse({
				type: "signal",
				senderUserId: "usr_1",
				signal: { type: "candidate" },
			}).success,
		).toBe(true);
	});

	it("supports chat bubble broadcasts", () => {
		expect(
			presenceServerMessageSchema.safeParse({
				type: "chat",
				userId: "usr_1",
				text: "Halo semua!",
				timestamp: 1700000000000,
			}).success,
		).toBe(true);
	});
});
