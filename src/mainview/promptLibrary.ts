import type { FolderRecord, PromptRecord, PromptSummary } from "../shared/prompt-store";

export const DEFAULT_PROMPT_TITLE = "Untitled Prompt";

export type SortMode = "updated" | "title" | "created";

export function summarizePrompt(prompt: PromptRecord): PromptSummary {
	return {
		id: prompt.id,
		title: prompt.title,
		folderId: prompt.folderId,
		createdAt: prompt.createdAt,
		updatedAt: prompt.updatedAt,
		deletedAt: prompt.deletedAt,
		lastSyncedAt: prompt.lastSyncedAt,
		syncStatus: prompt.syncStatus,
		cloudKitRecordName: prompt.cloudKitRecordName,
		excerpt: prompt.bodyMarkdown.replace(/\s+/g, " ").trim().slice(0, 120),
	};
}

export function replacePromptSummary(
	current: PromptSummary[],
	next: PromptSummary,
): PromptSummary[] {
	const remaining = current.filter((entry) => entry.id !== next.id);
	return [next, ...remaining].sort((left, right) =>
		right.updatedAt.localeCompare(left.updatedAt),
	);
}

export function mergePromptSummaries(
	current: PromptSummary[],
	nextForFolder: PromptSummary[],
	folderId: string,
): PromptSummary[] {
	const preserved = current.filter((prompt) => prompt.folderId !== folderId);
	return [...preserved, ...nextForFolder].sort((left, right) =>
		right.updatedAt.localeCompare(left.updatedAt),
	);
}

export function folderNameFor(folderId: string, folders: FolderRecord[]): string {
	return folders.find((folder) => folder.id === folderId)?.name ?? "Unknown Folder";
}

export function folderPathLabel(folder: FolderRecord, folders: FolderRecord[]): string {
	const names: string[] = [folder.name];
	let parentId = folder.parentId;

	while (parentId) {
		const parent = folders.find((entry) => entry.id === parentId);
		if (!parent) {
			break;
		}
		names.unshift(parent.name);
		parentId = parent.parentId;
	}

	return names.join(" / ");
}

export function formatTimestamp(value: string): string {
	return new Date(value).toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});
}

export function formatDateTime(value: string): string {
	return new Date(value).toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function sortFolders(left: FolderRecord, right: FolderRecord): number {
	return left.name.localeCompare(right.name);
}

export function sortPrompts(
	left: PromptSummary,
	right: PromptSummary,
	mode: SortMode,
): number {
	switch (mode) {
		case "title":
			return left.title.localeCompare(right.title);
		case "created":
			return right.createdAt.localeCompare(left.createdAt);
		case "updated":
		default:
			return right.updatedAt.localeCompare(left.updatedAt);
	}
}

