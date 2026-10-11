import { useCallback, useEffect, useState } from "react";
import { useSession } from "../../../libs/auth/index.ts";

export type TUserIdentity = {
	id: string;
	name: string;
	characterId: number;
	email?: string;
};

const STORAGE_KEY = "virtual_office_client_identity";
const DEFAULT_NAMES = ["Randika", "Alex", "Devin", "Sarah", "Kenji", "Elena"];

function hashToCharIndex(id: string): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}
	return (Math.abs(hash) % 6) + 1;
}

function getPersistentGuestId(): TUserIdentity {
	if (typeof window === "undefined") {
		return { id: "usr_guest", name: "Guest", characterId: 1 };
	}

	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			if (parsed.id && parsed.name) {
				return {
					id: parsed.id,
					name: parsed.name,
					characterId: Number(parsed.characterId) || hashToCharIndex(parsed.id),
				};
			}
		} catch {
			// Fallback to fresh guest if corrupt
		}
	}

	const randomSuffix = Math.floor(100 + Math.random() * 900);
	const randomName =
		DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)] ||
		"Engineer";

	const id = `usr_${randomName.toLowerCase()}_${randomSuffix}`;
	const identity: TUserIdentity = {
		id,
		name: `${randomName} #${randomSuffix}`,
		characterId: hashToCharIndex(id),
	};

	localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
	return identity;
}

export function useUserIdentity() {
	const { data: sessionData, isPending: isSessionLoading } = useSession();
	const [guestUser, setGuestUser] = useState<TUserIdentity>(() =>
		getPersistentGuestId(),
	);
	const [activeOverrides, setActiveOverrides] = useState<{
		name?: string;
		characterId?: number;
	}>({});

	// Load local avatar/name preferences if saved
	useEffect(() => {
		if (typeof window === "undefined") return;
		const savedOverrides = localStorage.getItem("virtual_office_active_char");
		if (savedOverrides) {
			try {
				const parsed = JSON.parse(savedOverrides);
				if (parsed.characterId || parsed.name) {
					setActiveOverrides(parsed);
				}
			} catch {
				// Ignore parse errors
			}
		}
	}, []);

	const isAuthenticated = Boolean(sessionData?.user);

	// Compute effective user
	const sessionUser = sessionData?.user;
	const user: TUserIdentity = sessionUser
		? {
				id: sessionUser.id,
				name:
					activeOverrides.name ||
					sessionUser.name ||
					`Member ${sessionUser.id.slice(0, 4)}`,
				characterId:
					activeOverrides.characterId ??
					(sessionUser as { characterId?: number }).characterId ??
					hashToCharIndex(sessionUser.id),
				email: sessionUser.email,
			}
		: {
				id: guestUser.id,
				name: activeOverrides.name || guestUser.name,
				characterId: activeOverrides.characterId ?? guestUser.characterId,
			};

	const updateIdentity = useCallback(
		(updates: Partial<Omit<TUserIdentity, "id">>) => {
			setActiveOverrides((prev) => {
				const next = { ...prev, ...updates };
				localStorage.setItem(
					"virtual_office_active_char",
					JSON.stringify(next),
				);
				return next;
			});

			if (!sessionUser) {
				setGuestUser((prev) => {
					const next = { ...prev, ...updates };
					localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
					return next;
				});
			}
		},
		[sessionUser],
	);

	return {
		user,
		isAuthenticated,
		sessionUser: sessionUser ?? null,
		isSessionLoading,
		updateIdentity,
	};
}
