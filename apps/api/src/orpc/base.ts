import { os } from "@orpc/server";
import type { TORPCContext } from "./context.ts";

export const pub = os.$context<TORPCContext>();
