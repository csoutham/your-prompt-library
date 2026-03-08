import { defineElectrobunRPC } from "electrobun/bun";
import type { PromptStoreRpcSchema } from "../shared/prompt-store";

export function createBunRpc(
	handlers: Parameters<typeof defineElectrobunRPC<PromptStoreRpcSchema>>[1]["handlers"]["requests"],
) {
	return defineElectrobunRPC<PromptStoreRpcSchema>("bun", {
		handlers: {
			requests: handlers,
			messages: {},
		},
	});
}
