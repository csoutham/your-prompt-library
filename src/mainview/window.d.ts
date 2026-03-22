import type {
	BootstrapPayload,
	FolderRecord,
	PromptStoreApi,
	PromptRecord,
	PromptSummary,
} from "../shared/prompt-store";

declare global {
	interface Window {
		promptStore: PromptStoreApi;
	}
}

export {};
