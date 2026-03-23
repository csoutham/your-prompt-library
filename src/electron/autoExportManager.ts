import { app, dialog, type BrowserWindow, type OpenDialogOptions } from "electron";
import type {
	AutoExportSchedulePreset,
	AutoExportSettings,
	AutoExportState,
	PromptLibrarySnapshot,
	PromptRepository,
} from "../shared/prompt-store";
import { AutoExportSettingsStore } from "./autoExportSettingsStore";
import { AutoExportWriter } from "./autoExportWriter";

type PromptExportRepository = Pick<PromptRepository, "exportSnapshot">;

type OpenDialogResultWithBookmarks = Awaited<
	ReturnType<typeof dialog.showOpenDialog>
> & {
	bookmarks?: string[];
};

type BookmarkingApp = typeof app & {
	startAccessingSecurityScopedResource?: (bookmarkData: string) => (() => void) | void;
};

type StoredAutoExportState = AutoExportState & {
	destinationBookmark: string | null;
};

export class AutoExportManager {
	private timer: ReturnType<typeof setTimeout> | null = null;
	private state: StoredAutoExportState | null = null;
	private runPromise: Promise<void> | null = null;
	private readonly writer = new AutoExportWriter();

	constructor(
		private readonly repository: PromptExportRepository,
		private readonly settingsStore: AutoExportSettingsStore,
	) {}

	async initialise(): Promise<void> {
		this.state = await this.loadState();
		if (this.shouldRunImmediately(this.state)) {
			await this.executeRun("scheduled");
			return;
		}

		this.scheduleNextRun();
	}

	async getState(): Promise<AutoExportState> {
		const state = await this.ensureState();
		return this.toPublicState(state);
	}

	async saveSettings(settings: AutoExportSettings): Promise<AutoExportState> {
		const current = await this.ensureState();
		const next: StoredAutoExportState = {
			...current,
			settings: normalizeAutoExportSettings(settings, current.settings.destinationPath),
		};
		if (next.settings.destinationPath !== current.settings.destinationPath) {
			next.destinationBookmark = null;
		}

		this.state = await this.persistState(next);
		this.scheduleNextRun();
		return this.toPublicState(this.state);
	}

	async chooseFolder(browserWindow?: BrowserWindow): Promise<AutoExportState> {
		const current = await this.ensureState();
		const dialogOptions: OpenDialogOptions = {
			properties: ["openDirectory", "createDirectory"],
			securityScopedBookmarks: isMasBuild(),
		};
		const result = (
			browserWindow
				? await dialog.showOpenDialog(browserWindow, dialogOptions)
				: await dialog.showOpenDialog(dialogOptions)
		) as OpenDialogResultWithBookmarks;
		const destinationPath = result.filePaths[0];
		if (!destinationPath) {
			return this.toPublicState(current);
		}

		const next: StoredAutoExportState = {
			...current,
			settings: {
				...current.settings,
				destinationPath,
			},
			destinationBookmark:
				isMasBuild() ? result.bookmarks?.[0] ?? current.destinationBookmark : null,
		};

		this.state = await this.persistState(next);
		this.scheduleNextRun();
		return this.toPublicState(this.state);
	}

	async runNow(): Promise<AutoExportState> {
		await this.executeRun("manual");
		return this.getState();
	}

	private async executeRun(reason: "manual" | "scheduled"): Promise<void> {
		if (this.runPromise) {
			await this.runPromise;
			return;
		}

		this.runPromise = this.performRun(reason);
		try {
			await this.runPromise;
		} finally {
			this.runPromise = null;
		}
	}

	private async performRun(_reason: "manual" | "scheduled"): Promise<void> {
		const current = await this.ensureState();
		if (!current.settings.destinationPath) {
			throw new Error("Choose an automatic export folder before running backups.");
		}

		const attemptedAt = new Date().toISOString();
		let nextState: StoredAutoExportState = {
			...current,
			status: {
				...current.status,
				isRunning: true,
				lastRunAttemptedAt: attemptedAt,
				lastErrorMessage: null,
			},
		};
		this.state = nextState;
		await this.persistState(nextState);

		try {
			const snapshot = await this.repository.exportSnapshot();
			await this.writeSnapshot(snapshot, nextState);
			const succeededAt = new Date().toISOString();
			nextState = {
				...nextState,
				status: {
					...nextState.status,
					isRunning: false,
					lastRunSucceededAt: succeededAt,
					lastErrorMessage: null,
				},
			};
		} catch (error) {
			nextState = {
				...nextState,
				status: {
					...nextState.status,
					isRunning: false,
					lastErrorMessage: toMessage(error),
				},
			};
		}

		this.state = await this.persistState(nextState);
		this.scheduleNextRun();
	}

	private async writeSnapshot(
		snapshot: PromptLibrarySnapshot,
		state: StoredAutoExportState,
	): Promise<void> {
		const destinationPath = state.settings.destinationPath;
		if (!destinationPath) {
			throw new Error("Choose an automatic export folder before running backups.");
		}

		await withSecurityScopedAccess(state.destinationBookmark, async () => {
			await this.writer.writeSnapshot(snapshot, {
				destinationPath,
				mode: state.settings.mode,
				retentionCount: state.settings.retentionCount,
			});
		});
	}

	private scheduleNextRun(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		if (!this.state || !this.state.settings.enabled || !this.state.settings.destinationPath) {
			if (this.state) {
				this.state.status.nextRunAt = null;
				void this.persistState(this.state);
			}
			return;
		}

		const anchor = this.state.status.lastRunAttemptedAt ?? this.state.status.lastRunSucceededAt;
		const nextRunAt = anchor
			? new Date(new Date(anchor).getTime() + intervalForPreset(this.state.settings.schedulePreset))
			: new Date();
		this.state.status.nextRunAt = nextRunAt.toISOString();
		void this.persistState(this.state);

		const delay = Math.max(0, nextRunAt.getTime() - Date.now());
		this.timer = setTimeout(() => {
			void this.executeRun("scheduled");
		}, delay);
	}

	private shouldRunImmediately(state: StoredAutoExportState): boolean {
		if (!state.settings.enabled || !state.settings.destinationPath) {
			return false;
		}

		if (!state.status.lastRunAttemptedAt && !state.status.lastRunSucceededAt) {
			return true;
		}

		const anchor = state.status.lastRunAttemptedAt ?? state.status.lastRunSucceededAt;
		if (!anchor) {
			return true;
		}

		return Date.now() >= new Date(anchor).getTime() + intervalForPreset(state.settings.schedulePreset);
	}

	private async ensureState(): Promise<StoredAutoExportState> {
		if (this.state) {
			return this.state;
		}

		this.state = await this.loadState();
		return this.state;
	}

	private async loadState(): Promise<StoredAutoExportState> {
		const stored = await this.settingsStore.load();
		return {
			settings: {
				enabled: stored.enabled,
				destinationPath: stored.destinationPath,
				mode: stored.mode,
				schedulePreset: stored.schedulePreset,
				retentionCount: stored.retentionCount,
			},
			status: {
				isRunning: false,
				nextRunAt: stored.nextRunAt,
				lastRunAttemptedAt: stored.lastRunAttemptedAt,
				lastRunSucceededAt: stored.lastRunSucceededAt,
				lastErrorMessage: stored.lastErrorMessage,
			},
			destinationBookmark: stored.destinationBookmark,
		};
	}

	private async persistState(state: StoredAutoExportState): Promise<StoredAutoExportState> {
		const saved = await this.settingsStore.save({
			...state.settings,
			...state.status,
			destinationBookmark: state.destinationBookmark,
		});
		return {
			settings: {
				enabled: saved.enabled,
				destinationPath: saved.destinationPath,
				mode: saved.mode,
				schedulePreset: saved.schedulePreset,
				retentionCount: saved.retentionCount,
			},
			status: {
				isRunning: state.status.isRunning,
				nextRunAt: saved.nextRunAt,
				lastRunAttemptedAt: saved.lastRunAttemptedAt,
				lastRunSucceededAt: saved.lastRunSucceededAt,
				lastErrorMessage: saved.lastErrorMessage,
			},
			destinationBookmark: saved.destinationBookmark,
		};
	}

	private toPublicState(state: StoredAutoExportState): AutoExportState {
		return {
			settings: state.settings,
			status: state.status,
		};
	}
}

function normalizeAutoExportSettings(
	settings: AutoExportSettings,
	currentDestinationPath: string | null,
): AutoExportSettings {
	const destinationPath =
		typeof settings.destinationPath === "string" && settings.destinationPath.trim()
			? settings.destinationPath
			: currentDestinationPath;

	return {
		enabled: Boolean(settings.enabled),
		destinationPath,
		mode: settings.mode === "timestamped" ? "timestamped" : "rolling",
		schedulePreset: normalizeSchedulePreset(settings.schedulePreset),
		retentionCount: Math.min(100, Math.max(1, Math.floor(settings.retentionCount || 20))),
	};
}

function normalizeSchedulePreset(
	value: AutoExportSchedulePreset,
): AutoExportSchedulePreset {
	switch (value) {
		case "hourly":
		case "every-6-hours":
		case "daily":
		case "weekly":
			return value;
		default:
			return "daily";
	}
}

function intervalForPreset(schedulePreset: AutoExportSchedulePreset): number {
	switch (schedulePreset) {
		case "hourly":
			return 60 * 60 * 1000;
		case "every-6-hours":
			return 6 * 60 * 60 * 1000;
		case "weekly":
			return 7 * 24 * 60 * 60 * 1000;
		case "daily":
		default:
			return 24 * 60 * 60 * 1000;
	}
}

async function withSecurityScopedAccess<T>(
	bookmarkData: string | null,
	action: () => Promise<T>,
): Promise<T> {
	const bookmarkingApp = app as BookmarkingApp;
	const stopAccess = bookmarkData
		? bookmarkingApp.startAccessingSecurityScopedResource?.(bookmarkData)
		: undefined;

	try {
		return await action();
	} finally {
		if (typeof stopAccess === "function") {
			stopAccess();
		}
	}
}

function isMasBuild(): boolean {
	const processWithMas = process as NodeJS.Process & { mas?: boolean };
	return Boolean(processWithMas.mas);
}

function toMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Automatic export failed.";
}

export { intervalForPreset };
