import type { Ref } from "react";
import type {
	AutoExportSettings,
	AutoExportState,
} from "../../shared/prompt-store";
import { formatDateTime } from "../promptLibrary";

type AutoExportDialogProps = {
	draft: AutoExportSettings;
	state: AutoExportState;
	errorMessage: string | null;
	isSubmitting: boolean;
	retentionInputRef: Ref<HTMLInputElement>;
	onDraftChange: (next: AutoExportSettings) => void;
	onChooseFolder: () => void | Promise<void>;
	onRunNow: () => void | Promise<void>;
	onClose: () => void;
	onSave: () => void | Promise<void>;
};

export function AutoExportDialog({
	draft,
	state,
	errorMessage,
	isSubmitting,
	retentionInputRef,
	onDraftChange,
	onChooseFolder,
	onRunNow,
	onClose,
	onSave,
}: AutoExportDialogProps) {
	const saveDisabled = isSubmitting || (draft.enabled && !draft.destinationPath);

	return (
		<div className="dialog-scrim" onClick={onClose}>
			<div
				className="dialog-card dialog-card--wide"
				onClick={(event) => event.stopPropagation()}
			>
				<p className="eyebrow">Automatic Exports</p>
				<h3>Automatic exports</h3>
				<p className="dialog-card__description">
					Write a JSON backup into a synced folder and let the app keep it up to date
					while it remains open.
				</p>

				<label className="toggle-field">
					<input
						type="checkbox"
						checked={draft.enabled}
						onChange={(event) =>
							onDraftChange({
								...draft,
								enabled: event.target.checked,
							})
						}
					/>
					<span>Enable automatic exports</span>
				</label>

				<div className="auto-export-grid">
					<label className="editor-field auto-export-grid__full">
						<span>Destination folder</span>
						<div className="folder-picker">
							<input value={draft.destinationPath ?? "No folder selected"} readOnly />
							<button className="button" onClick={() => void onChooseFolder()}>
								Choose Folder
							</button>
						</div>
					</label>

					<label className="editor-field">
						<span>Export mode</span>
						<div className="select-shell">
							<select
								value={draft.mode}
								onChange={(event) =>
									onDraftChange({
										...draft,
										mode: event.target.value as AutoExportSettings["mode"],
									})
								}
							>
								<option value="rolling">Rolling snapshot</option>
								<option value="timestamped">Timestamped backups</option>
							</select>
						</div>
					</label>

					<label className="editor-field">
						<span>Schedule</span>
						<div className="select-shell">
							<select
								value={draft.schedulePreset}
								onChange={(event) =>
									onDraftChange({
										...draft,
										schedulePreset:
											event.target.value as AutoExportSettings["schedulePreset"],
									})
								}
							>
								<option value="hourly">Hourly</option>
								<option value="every-6-hours">Every 6 hours</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
							</select>
						</div>
					</label>

					<label className="editor-field">
						<span>Retention count</span>
						<input
							ref={retentionInputRef}
							type="number"
							min={1}
							max={100}
							value={draft.retentionCount}
							disabled={draft.mode !== "timestamped"}
							onChange={(event) =>
								onDraftChange({
									...draft,
									retentionCount: Number(event.target.value || 20),
								})
							}
						/>
					</label>
				</div>

				<div className="auto-export-status">
					<div className="auto-export-status__row">
						<span>Next export</span>
						<strong>
							{state.status.nextRunAt ? formatDateTime(state.status.nextRunAt) : "Not scheduled"}
						</strong>
					</div>
					<div className="auto-export-status__row">
						<span>Last successful export</span>
						<strong>
							{state.status.lastRunSucceededAt
								? formatDateTime(state.status.lastRunSucceededAt)
								: "Not yet"}
						</strong>
					</div>
					<div className="auto-export-status__row">
						<span>Latest error</span>
						<strong>{state.status.lastErrorMessage ?? "None"}</strong>
					</div>
				</div>

				{errorMessage ? <p className="dialog-card__error">{errorMessage}</p> : null}

				<div className="dialog-card__actions dialog-card__actions--split">
					<div className="dialog-card__actions-secondary">
						<button className="button" onClick={onClose}>
							Cancel
						</button>
						<button
							className="button"
							disabled={isSubmitting || !draft.destinationPath}
							onClick={() => void onRunNow()}
						>
							Export Now
						</button>
					</div>
					<button
						className="button button--primary"
						disabled={saveDisabled}
						onClick={() => void onSave()}
					>
						{isSubmitting ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
