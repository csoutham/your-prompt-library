export type SyncStatus = "local" | "modified" | "synced" | "conflict";

export type SyncMetadata = {
	deletedAt: string | null;
	lastSyncedAt: string | null;
	syncStatus: SyncStatus;
	cloudKitRecordName: string | null;
};

export type FolderRecord = {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
	updatedAt: string;
} & SyncMetadata;

export type PromptRecord = {
	id: string;
	title: string;
	folderId: string;
	bodyMarkdown: string;
	createdAt: string;
	updatedAt: string;
} & SyncMetadata;

export type PromptSummary = Omit<PromptRecord, "bodyMarkdown"> & {
	excerpt: string;
};

export type BootstrapPayload = {
	folders: FolderRecord[];
	prompts: PromptSummary[];
};

export type PromptLibrarySnapshot = {
	version: 1;
	exportedAt: string;
	folders: FolderRecord[];
	prompts: PromptRecord[];
};

export type RecordQueryOptions = {
	includeDeleted?: boolean;
};

export type AutoExportMode = "rolling" | "timestamped";

export type AutoExportSchedulePreset = "hourly" | "every-6-hours" | "daily" | "weekly";

export type AutoExportSettings = {
	enabled: boolean;
	destinationPath: string | null;
	mode: AutoExportMode;
	schedulePreset: AutoExportSchedulePreset;
	retentionCount: number;
};

export type AutoExportStatus = {
	isRunning: boolean;
	nextRunAt: string | null;
	lastRunAttemptedAt: string | null;
	lastRunSucceededAt: string | null;
	lastErrorMessage: string | null;
};

export type AutoExportState = {
	settings: AutoExportSettings;
	status: AutoExportStatus;
};

export interface PromptRepository {
	bootstrap(options?: RecordQueryOptions): Promise<BootstrapPayload>;
	listFolders(options?: RecordQueryOptions): Promise<FolderRecord[]>;
	listPrompts(folderId: string, options?: RecordQueryOptions): Promise<PromptSummary[]>;
	getPrompt(promptId: string, options?: RecordQueryOptions): Promise<PromptRecord | null>;
	createFolder(name: string, parentId: string | null): Promise<FolderRecord>;
	renameFolder(folderId: string, name: string): Promise<FolderRecord>;
	deleteFolder(folderId: string): Promise<void>;
	createPrompt(folderId: string, title?: string): Promise<PromptRecord>;
	savePrompt(promptId: string, title: string, bodyMarkdown: string): Promise<PromptRecord>;
	movePrompt(promptId: string, folderId: string): Promise<PromptRecord>;
	renamePrompt(promptId: string, title: string): Promise<PromptRecord>;
	deletePrompt(promptId: string): Promise<void>;
	searchPrompts(query: string, options?: RecordQueryOptions): Promise<PromptSummary[]>;
	exportSnapshot(options?: RecordQueryOptions): Promise<PromptLibrarySnapshot>;
	importSnapshot(snapshot: PromptLibrarySnapshot): Promise<void>;
}

export interface PromptStoreApi {
	bootstrap: () => Promise<BootstrapPayload>;
	listFolders: () => Promise<FolderRecord[]>;
	listPrompts: (folderId: string) => Promise<PromptSummary[]>;
	getPrompt: (promptId: string) => Promise<PromptRecord | null>;
	createFolder: (name: string, parentId: string | null) => Promise<FolderRecord>;
	renameFolder: (folderId: string, name: string) => Promise<FolderRecord>;
	deleteFolder: (folderId: string) => Promise<{ deleted: true }>;
	createPrompt: (folderId: string, title?: string) => Promise<PromptRecord>;
	savePrompt: (
		promptId: string,
		title: string,
		bodyMarkdown: string,
	) => Promise<PromptRecord>;
	movePrompt: (promptId: string, folderId: string) => Promise<PromptRecord>;
	renamePrompt: (promptId: string, title: string) => Promise<PromptRecord>;
	deletePrompt: (promptId: string) => Promise<{ deleted: true }>;
	searchPrompts: (query: string) => Promise<PromptSummary[]>;
	copyPrompt: (promptId: string) => Promise<{ copied: true }>;
	exportLibrary: () => Promise<{ filePath: string | null }>;
	importLibrary: () => Promise<{ imported: boolean }>;
	getAutoExportSettings: () => Promise<AutoExportState>;
	saveAutoExportSettings: (settings: AutoExportSettings) => Promise<AutoExportState>;
	chooseAutoExportFolder: () => Promise<AutoExportState>;
	runAutoExportNow: () => Promise<AutoExportState>;
}
