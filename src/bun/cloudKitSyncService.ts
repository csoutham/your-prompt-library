import type {
	CloudKitSyncState,
	PromptRepository,
	SyncStateStore,
} from "../shared/prompt-store";
import {
	type CloudKitPushPlan,
	folderToCloudKitDelete,
	folderToCloudKitRecord,
	promptToCloudKitDelete,
	promptToCloudKitRecord,
} from "../shared/cloudkit";

export class CloudKitSyncService {
	constructor(
		private readonly repository: PromptRepository,
		private readonly syncStateStore: SyncStateStore,
	) {}

	async buildPushPlan(): Promise<CloudKitPushPlan> {
		const [snapshot] = await Promise.all([
			this.repository.exportSnapshot({ includeDeleted: true }),
			this.syncStateStore.read(),
		]);

		const foldersToSave = snapshot.folders
			.filter((folder) => folder.deletedAt === null && shouldPushRecord(folder.syncStatus))
			.map(folderToCloudKitRecord);
		const promptsToSave = snapshot.prompts
			.filter((prompt) => prompt.deletedAt === null && shouldPushRecord(prompt.syncStatus))
			.map(promptToCloudKitRecord);
		const recordsToDelete = [
			...snapshot.prompts
				.filter((prompt) => prompt.deletedAt !== null && hasCloudKitIdentity(prompt))
				.map(promptToCloudKitDelete),
			...snapshot.folders
				.filter((folder) => folder.deletedAt !== null && hasCloudKitIdentity(folder))
				.map(folderToCloudKitDelete),
		];

		return {
			generatedAt: new Date().toISOString(),
			foldersToSave,
			promptsToSave,
			recordsToDelete,
		};
	}

	async markSyncCompleted(nextState: Partial<CloudKitSyncState> = {}): Promise<CloudKitSyncState> {
		const currentState = await this.syncStateStore.read();
		const syncedAt = nextState.lastSyncAt ?? new Date().toISOString();

		return this.syncStateStore.write({
			...currentState,
			...nextState,
			version: 1,
			lastSyncAt: syncedAt,
		});
	}
}

function shouldPushRecord(syncStatus: string): boolean {
	return syncStatus === "local" || syncStatus === "modified" || syncStatus === "conflict";
}

function hasCloudKitIdentity(record: { cloudKitRecordName: string | null }): boolean {
	return Boolean(record.cloudKitRecordName);
}
