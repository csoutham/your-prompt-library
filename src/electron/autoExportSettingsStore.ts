import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
	AutoExportMode,
	AutoExportSchedulePreset,
	AutoExportSettings,
	AutoExportStatus,
} from "../shared/prompt-store";

type StoredAutoExportSettings = AutoExportSettings &
	AutoExportStatus & {
		destinationBookmark: string | null;
	};

const DEFAULT_AUTO_EXPORT_SETTINGS: StoredAutoExportSettings = {
	enabled: false,
	destinationPath: null,
	destinationBookmark: null,
	mode: "rolling",
	schedulePreset: "daily",
	retentionCount: 20,
	isRunning: false,
	nextRunAt: null,
	lastRunAttemptedAt: null,
	lastRunSucceededAt: null,
	lastErrorMessage: null,
};

export class AutoExportSettingsStore {
	constructor(private readonly settingsPath: string) {}

	async load(): Promise<StoredAutoExportSettings> {
		try {
			const raw = await readFile(this.settingsPath, "utf8");
			const parsed = JSON.parse(raw) as Partial<StoredAutoExportSettings>;
			return normalizeStoredSettings(parsed);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return { ...DEFAULT_AUTO_EXPORT_SETTINGS };
			}
			throw error;
		}
	}

	async save(settings: StoredAutoExportSettings): Promise<StoredAutoExportSettings> {
		const next = normalizeStoredSettings(settings);
		await mkdir(dirname(this.settingsPath), { recursive: true });
		await writeFile(this.settingsPath, JSON.stringify(next, null, 2), "utf8");
		return next;
	}
}

function normalizeStoredSettings(
	input: Partial<StoredAutoExportSettings>,
): StoredAutoExportSettings {
	return {
		enabled: input.enabled ?? DEFAULT_AUTO_EXPORT_SETTINGS.enabled,
		destinationPath: input.destinationPath ?? null,
		destinationBookmark: input.destinationBookmark ?? null,
		mode: normalizeMode(input.mode),
		schedulePreset: normalizeSchedulePreset(input.schedulePreset),
		retentionCount: normalizeRetentionCount(input.retentionCount),
		isRunning: false,
		nextRunAt: normalizeTimestamp(input.nextRunAt),
		lastRunAttemptedAt: normalizeTimestamp(input.lastRunAttemptedAt),
		lastRunSucceededAt: normalizeTimestamp(input.lastRunSucceededAt),
		lastErrorMessage: normalizeErrorMessage(input.lastErrorMessage),
	};
}

function normalizeMode(value: AutoExportMode | undefined): AutoExportMode {
	return value === "timestamped" ? "timestamped" : "rolling";
}

function normalizeSchedulePreset(
	value: AutoExportSchedulePreset | undefined,
): AutoExportSchedulePreset {
	switch (value) {
		case "hourly":
		case "every-6-hours":
		case "daily":
		case "weekly":
			return value;
		default:
			return DEFAULT_AUTO_EXPORT_SETTINGS.schedulePreset;
	}
}

function normalizeRetentionCount(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return DEFAULT_AUTO_EXPORT_SETTINGS.retentionCount;
	}

	return Math.min(100, Math.max(1, Math.floor(value)));
}

function normalizeTimestamp(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeErrorMessage(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	return value.trim() || null;
}
