/**
 * Prefixed, sortable-enough ids such as `usr_3f9c...` and `wsp_8a1b...`,
 * matching the id shape used in the brief's realtime payload example.
 * Uses Web Crypto so it runs on Cloudflare Workers and Node alike.
 */
export const ID_PREFIX = {
	user: "usr",
	workspace: "wsp",
	member: "wsm",
	attendance: "att",
	dailyReport: "rpt",
} as const;

export type TIdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];

export const createId = (prefix: TIdPrefix): string =>
	`${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
