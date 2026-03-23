import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoExportWriter } from "./autoExportWriter";
import type { PromptLibrarySnapshot } from "../shared/prompt-store";

const createdDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		createdDirs.splice(0, createdDirs.length).map(async (path) => {
			await Bun.$`rm -rf ${path}`.quiet();
		}),
	);
});

describe("AutoExportWriter", () => {
	test("writes a rolling snapshot to a stable file", async () => {
		const writer = new AutoExportWriter();
		const destinationPath = await makeTempDir();
		const snapshot = createSnapshot("2026-03-23T14:30:00.000Z");

		const outputPath = await writer.writeSnapshot(snapshot, {
			destinationPath,
			mode: "rolling",
			retentionCount: 20,
		});

		expect(outputPath).toBe(join(destinationPath, "prompt-library-latest.json"));
		const saved = JSON.parse(await readFile(outputPath, "utf8")) as PromptLibrarySnapshot;
		expect(saved.exportedAt).toBe(snapshot.exportedAt);
	});

	test("keeps only the latest timestamped backups within retention", async () => {
		const writer = new AutoExportWriter();
		const destinationPath = await makeTempDir();

		for (const exportedAt of [
			"2026-03-23T12:00:00.000Z",
			"2026-03-23T13:00:00.000Z",
			"2026-03-23T14:00:00.000Z",
		]) {
			await writer.writeSnapshot(createSnapshot(exportedAt), {
				destinationPath,
				mode: "timestamped",
				retentionCount: 2,
			});
		}

		const files = (await readdir(destinationPath))
			.filter((name) => name.startsWith("prompt-library-"))
			.sort();

		expect(files).toEqual([
			"prompt-library-2026-03-23-13-00.json",
			"prompt-library-2026-03-23-14-00.json",
		]);
	});
});

async function makeTempDir(): Promise<string> {
	const path = await mkdtemp(join(tmpdir(), "prompt-library-auto-export-"));
	createdDirs.push(path);
	return path;
}

function createSnapshot(exportedAt: string): PromptLibrarySnapshot {
	return {
		version: 1,
		exportedAt,
		folders: [],
		prompts: [],
	};
}
