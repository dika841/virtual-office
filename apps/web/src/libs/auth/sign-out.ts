import { signOut } from "./client.ts";

export const signOutUser = async (): Promise<void> => {
	await signOut();
};
