import type {
	BootstrapPayload,
	FolderRecord,
	PromptLibrarySnapshot,
	PromptRecord,
	PromptRepository,
	PromptSummary,
	RecordQueryOptions,
} from "../shared/prompt-store";
import { FilePromptRepository } from "./filePromptRepository";

export { PromptStoreError } from "./filePromptRepository";
export { FilePromptRepository } from "./filePromptRepository";

export class PromptStore implements PromptRepository {
	readonly repository: FilePromptRepository;

	constructor(rootDir: string) {
		this.repository = new FilePromptRepository(rootDir);
	}

	bootstrap(options?: RecordQueryOptions): Promise<BootstrapPayload> {
		return this.repository.bootstrap(options);
	}

	listFolders(options?: RecordQueryOptions): Promise<FolderRecord[]> {
		return this.repository.listFolders(options);
	}

	listPrompts(folderId: string, options?: RecordQueryOptions): Promise<PromptSummary[]> {
		return this.repository.listPrompts(folderId, options);
	}

	getPrompt(promptId: string, options?: RecordQueryOptions): Promise<PromptRecord | null> {
		return this.repository.getPrompt(promptId, options);
	}

	createFolder(name: string, parentId: string | null): Promise<FolderRecord> {
		return this.repository.createFolder(name, parentId);
	}

	renameFolder(folderId: string, name: string): Promise<FolderRecord> {
		return this.repository.renameFolder(folderId, name);
	}

	deleteFolder(folderId: string): Promise<void> {
		return this.repository.deleteFolder(folderId);
	}

	createPrompt(folderId: string, title?: string): Promise<PromptRecord> {
		return this.repository.createPrompt(folderId, title);
	}

	savePrompt(promptId: string, title: string, bodyMarkdown: string): Promise<PromptRecord> {
		return this.repository.savePrompt(promptId, title, bodyMarkdown);
	}

	movePrompt(promptId: string, folderId: string): Promise<PromptRecord> {
		return this.repository.movePrompt(promptId, folderId);
	}

	renamePrompt(promptId: string, title: string): Promise<PromptRecord> {
		return this.repository.renamePrompt(promptId, title);
	}

	deletePrompt(promptId: string): Promise<void> {
		return this.repository.deletePrompt(promptId);
	}

	searchPrompts(query: string, options?: RecordQueryOptions): Promise<PromptSummary[]> {
		return this.repository.searchPrompts(query, options);
	}

	exportSnapshot(options?: RecordQueryOptions): Promise<PromptLibrarySnapshot> {
		return this.repository.exportSnapshot(options);
	}

	importSnapshot(snapshot: PromptLibrarySnapshot): Promise<void> {
		return this.repository.importSnapshot(snapshot);
	}
}
