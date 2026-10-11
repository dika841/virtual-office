import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@virtual-office/database";
import type { TDb } from "@virtual-office/database";
import type { TBindings } from "../../env.ts";

type TCreateAuthOptions = {
	db: TDb;
	env: TBindings;
};

export const authCreate = (deps: TCreateAuthOptions) => {
	const isProd = deps.env.ENVIRONMENT === "production";
	const webOrigin = deps.env.WEB_ORIGIN || "http://localhost:5173";

	return betterAuth({
		baseURL: deps.env.BETTER_AUTH_URL || webOrigin,
		secret:
			deps.env.BETTER_AUTH_SECRET ||
			"virtual_office_default_super_secret_key_at_least_32_chars!",
		trustedOrigins: [
			webOrigin,
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		],
		database: drizzleAdapter(deps.db, {
			provider: "pg",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		advanced: {
			database: {
				generateId: (): string => crypto.randomUUID(),
			},
			defaultCookieAttributes: {
				sameSite: isProd ? "none" : "lax",
				secure: isProd,
			},
		},
		emailAndPassword: {
			enabled: true,
		},
		user: {
			additionalFields: {
				avatarSpriteId: {
					type: "string",
					defaultValue: "char_1",
					required: false,
				},
				characterId: {
					type: "number",
					defaultValue: 1,
					required: false,
				},
			},
		},
	});
};

export type TAuth = ReturnType<typeof authCreate>;
