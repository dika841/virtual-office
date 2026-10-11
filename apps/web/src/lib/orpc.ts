import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { TAppRouterClient } from "@virtual-office/api";
import { getApiOrigin } from "./api-origin.ts";

const rpcLink = new RPCLink({
	url: () => `${getApiOrigin()}/rpc`,
	fetch: (request, init) =>
		globalThis.fetch(request, { ...init, credentials: "include" }),
});

export const orpcClient: TAppRouterClient = createORPCClient(rpcLink);
export const orpc = createTanstackQueryUtils(orpcClient);
