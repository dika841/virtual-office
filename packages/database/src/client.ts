import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.ts";

/**
 * Local development talks to Postgres through local-neon-http-proxy
 * (see docker-compose.dev.yml). Its convention is the `db.localtest.me`
 * hostname, which resolves to 127.0.0.1.
 */
const LOCAL_NEON_HOST = "db.localtest.me";
const LOCAL_NEON_PROXY_PORT = 4444;

export const createDb = (databaseUrl: string) => {
	if (new URL(databaseUrl).hostname === LOCAL_NEON_HOST) {
		neonConfig.fetchEndpoint = (host) =>
			host === LOCAL_NEON_HOST
				? `http://${host}:${LOCAL_NEON_PROXY_PORT}/sql`
				: `https://${host}/sql`;
	}

	return drizzle({ client: neon(databaseUrl), schema });
};

export type TDb = ReturnType<typeof createDb>;
