/** Cloudflare bindings, mirrored from wrangler.jsonc. */
export type TBindings = {
	PRESENCE_HUB: DurableObjectNamespace;
	DATABASE_URL: string;
	UPSTASH_REDIS_REST_URL: string;
	UPSTASH_REDIS_REST_TOKEN: string;
	WEB_ORIGIN: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	ENVIRONMENT?: string;
	NODE_ENV?: string;
};
