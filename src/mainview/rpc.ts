import { Electroview } from "electrobun/view";
import type { PromptStoreRpcSchema } from "../shared/prompt-store";

export function createWebviewRpc() {
	return Electroview.defineRPC<PromptStoreRpcSchema>({
		handlers: {
			requests: {},
			messages: {},
		},
	});
}
