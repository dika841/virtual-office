import type { RouterClient } from "@orpc/server";
import type { TAppRouter } from "./orpc/router.ts";

export type { TAppRouter } from "./orpc/router.ts";
export type TAppRouterClient = RouterClient<TAppRouter>;
