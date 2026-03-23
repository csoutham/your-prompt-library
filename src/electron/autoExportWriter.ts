import { mkdir, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { AutoExportMode, PromptLibrarySnapshot } from "../shared/prompt-store";

const ROLLING_EXPORT_FILE = "prompt-library-latest.json";
const TIMESTAMPED_EXPORT_PATTERN =
	/^prompt-library-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}(?:-\d+)?\.json$/;

type AutoExportWriteOptions = {
	destinationPath: string;
	mode: AutoExportMode;
	retentionCount: number;
};

export class AutoExportWriter {
	async writeSnapshot(
		snapshot: PromptLibrarySnapshot,
		options: AutoExportWriteOptions,
	): Promise<string> {
		await mkdir(options.destinationPath, { recursive: true });
		const outputPath =
			options.mode === "rolling"
				? join(options.destinationPath, ROLLING_EXPORT_FILE)
				: await this.nextTimestampedFilePath(options.destinationPath, snapshot.exportedAt);
		const tempPath = join(
			options.destinationPath,
			`.${basename(outputPath)}.tmp-${crypto.randomUUID()}`,
		);
		await writeFile(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
		await rename(tempPath, outputPath);

		if (options.mode === "timestamped") {
			await this.pruneTimestampedExports(options.destinationPath, options.retentionCount);
		}

		return outputPath;
	}

	private async nextTimestampedFilePath(
		destinationPath: string,
		exportedAt: string,
	): Promise<string> {
		const stamp = formatExportTimestamp(exportedAt);
		const baseName = `prompt-library-${stamp}.json`;
		const firstCandidate = join(destinationPath, baseName);
		if (!(await pathExists(firstCandidate))) {
			return firstCandidate;
		}

		let index = 2;
		while (true) {
			const candidate = join(destinationPath, `prompt-library-${stamp}-${index}.json`);
			if (!(await pathExists(candidate))) {
				return candidate;
			}
			index += 1;
		}
	}

	private async pruneTimestampedExports(
		destinationPath: string,
		retentionCount: number,
	): Promise<void> {
		const names = await readdir(destinationPath);
		const timestampedFiles = names
			.filter((name) => TIMESTAMPED_EXPORT_PATTERN.test(name))
			.sort((left, right) => right.localeCompare(left));
		const staleFiles = timestampedFiles.slice(retentionCount);

		await Promise.all(staleFiles.map((name) => unlink(join(destinationPath, name))));
	}
}

function formatExportTimestamp(value: string): string {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	return `${year}-${month}-${day}-${hours}-${minutes}`;
}

function pad(value: number): string {
	return value.toString().padStart(2, "0");
}

async function pathExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

export { formatExportTimestamp };
