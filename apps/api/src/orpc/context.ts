import type { TDb } from "@virtual-office/database";

/**
 * Keep this file free of Workers-only globals: the web app type-checks the
 * router graph through `@virtual-office/api`.
 */
export type TORPCContext = {
	db: TDb;
};
