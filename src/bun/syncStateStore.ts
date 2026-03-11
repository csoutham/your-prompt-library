import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CloudKitSyncState, SyncStateStore } from "../shared/prompt-store";

const SYNC_STATE_FILE = "sync-state.json";

export class FileSyncStateStore implements SyncStateStore {
	constructor(private readonly rootDir: string) {}

	async read(): Promise<CloudKitSyncState> {
		await mkdir(this.rootDir, { recursive: true });

		try {
			const raw = await readFile(this.filePath, "utf8");
			const parsed = JSON.parse(raw) as Partial<CloudKitSyncState>;
			return normalizeSyncState(parsed);
		} catch (error) {
			if (isMissingFile(error)) {
				return defaultSyncState();
			}

			const backupPath = join(this.rootDir, `sync-state.invalid.${Date.now()}.json`);
			await rename(this.filePath, backupPath).catch(() => undefined);
			return defaultSyncState();
		}
	}

	async write(state: CloudKitSyncState): Promise<CloudKitSyncState> {
		await mkdir(this.rootDir, { recursive: true });
		const nextState = normalizeSyncState(state);
		await writeFile(this.filePath, JSON.stringify(nextState, null, 2));
		return nextState;
	}

	async reset(): Promise<CloudKitSyncState> {
		const state = defaultSyncState();
		await this.write(state);
		return state;
	}

	private get filePath(): string {
		return join(this.rootDir, SYNC_STATE_FILE);
	}
}

function defaultSyncState(): CloudKitSyncState {
	return {
		version: 1,
		databaseChangeToken: null,
		zoneChangeTokens: {},
		lastSyncAt: null,
		lastFullSyncAt: null,
	};
}

function normalizeSyncState(state: Partial<CloudKitSyncState>): CloudKitSyncState {
	return {
		version: 1,
		databaseChangeToken: state.databaseChangeToken ?? null,
		zoneChangeTokens:
			state.zoneChangeTokens && typeof state.zoneChangeTokens === "object"
				? state.zoneChangeTokens
				: {},
		lastSyncAt: state.lastSyncAt ?? null,
		lastFullSyncAt: state.lastFullSyncAt ?? null,
	};
}

function isMissingFile(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "ENOENT"
	);
}
