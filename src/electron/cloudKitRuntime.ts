import type { PromptStore } from "../bun/promptStore";
import type { CloudKitRuntimeStatus } from "../shared/cloudkit";
import { CloudKitBridgeClient } from "./cloudKitBridge";

export class CloudKitRuntimeService {
	private syncTimer: Timer | null = null;
	private syncInFlight: Promise<void> | null = null;
	private status: CloudKitRuntimeStatus = {
		available: false,
		accountStatus: "unknown",
		syncInFlight: false,
		phase: "idle",
		lastAttemptAt: null,
		lastSyncAt: null,
		lastError: null,
	};

	constructor(
		private readonly promptStore: PromptStore,
		private readonly bridge: CloudKitBridgeClient,
	) {}

	scheduleSync(delayMs = 1500) {
		if (this.syncTimer) {
			clearTimeout(this.syncTimer);
		}

		this.syncTimer = setTimeout(() => {
			this.syncTimer = null;
			void this.syncNow();
		}, delayMs);
	}

	async syncNow() {
		if (this.syncInFlight) {
			return this.syncInFlight;
		}

		this.status = {
			...this.status,
			syncInFlight: true,
			phase: "starting",
			lastAttemptAt: new Date().toISOString(),
			lastError: null,
		};
		this.syncInFlight = this.runSync().finally(() => {
			this.syncInFlight = null;
			this.status = {
				...this.status,
				syncInFlight: false,
				phase: this.status.lastError ? "error" : "idle",
			};
		});
		return this.syncInFlight;
	}

	getStatus(): CloudKitRuntimeStatus {
		return this.status;
	}

	private async runSync() {
		try {
			this.status = {
				...this.status,
				phase: "checking-account",
			};
			const status = await this.bridge.accountStatus();
			this.status = {
				...this.status,
				accountStatus: status.result?.accountStatus ?? "unknown",
				available: status.result?.accountStatus === "available",
			};
			if (status.result?.accountStatus !== "available") {
				this.status = {
					...this.status,
					phase: "idle",
				};
				return;
			}

			this.status = {
				...this.status,
				phase: "ensuring-zone",
			};
			await this.bridge.ensureZone();

			this.status = {
				...this.status,
				phase: "pulling",
			};
			const syncState = await this.promptStore.readSyncState();
			const pullResponse = await this.bridge.pullChanges(syncState);
			await this.promptStore.applyCloudKitPullPayload(pullResponse.payload);
			await this.promptStore.writeSyncState(pullResponse.syncState);

			this.status = {
				...this.status,
				phase: "planning-push",
			};
			const plan = await this.promptStore.buildCloudKitPushPlan();
			const hasPushWork =
				plan.foldersToSave.length > 0 ||
				plan.promptsToSave.length > 0 ||
				plan.recordsToDelete.length > 0;

			if (!hasPushWork) {
				const completedAt = new Date().toISOString();
				await this.promptStore.markCloudKitSyncCompleted({
					lastSyncAt: completedAt,
				});
				this.status = {
					...this.status,
					lastSyncAt: completedAt,
					phase: "idle",
				};
				return;
			}

			this.status = {
				...this.status,
				phase: "pushing",
			};
			await this.bridge.pushChanges(plan);
			const completedAt = new Date().toISOString();
			await this.promptStore.acknowledgeCloudKitPushPlan(plan, {
				lastSyncAt: completedAt,
			});
			this.status = {
				...this.status,
				lastSyncAt: completedAt,
				phase: "idle",
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.status = {
				...this.status,
				lastError: message,
				phase: "error",
			};
			console.warn("[CloudKit] sync skipped:", error);
		}
	}
}
