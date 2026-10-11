import { createAuthClient } from "better-auth/react";

const rawApiBase = import.meta.env.DEV
	? window.location.origin
	: (import.meta.env.VITE_API_URL ?? window.location.origin);

const API_BASE = rawApiBase.endsWith("/")
	? rawApiBase.slice(0, -1)
	: rawApiBase;

export const authClient = createAuthClient({
	baseURL: API_BASE,
	fetchOptions: { credentials: "include" },
});

export const { useSession, signIn, signUp, signOut } = authClient;
