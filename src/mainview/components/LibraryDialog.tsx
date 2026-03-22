import { CaretDown } from "@phosphor-icons/react";
import type { Ref } from "react";
import type { FolderRecord } from "../../shared/prompt-store";
import type { DialogState } from "../dialogState";
import { folderPathLabel } from "../promptLibrary";

type LibraryDialogProps = {
	dialog: Exclude<DialogState, null>;
	dialogValue: string;
	isSubmittingDialog: boolean;
	folders: FolderRecord[];
	dialogInputRef: Ref<HTMLInputElement>;
	onDialogValueChange: (value: string) => void;
	onClose: () => void;
	onSubmit: () => void | Promise<void>;
};

export function LibraryDialog({
	dialog,
	dialogValue,
	isSubmittingDialog,
	folders,
	dialogInputRef,
	onDialogValueChange,
	onClose,
	onSubmit,
}: LibraryDialogProps) {
	return (
		<div className="dialog-scrim" onClick={onClose}>
			<div className="dialog-card" onClick={(event) => event.stopPropagation()}>
				<p className="eyebrow">{dialog.title}</p>
				<h3>{dialog.title}</h3>
				<p className="dialog-card__description">{dialog.description}</p>

				{"initialValue" in dialog ? (
					<label className="editor-field">
						<span>Name</span>
						<input
							ref={dialogInputRef}
							value={dialogValue}
							onChange={(event) => onDialogValueChange(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									void onSubmit();
								}
							}}
						/>
					</label>
				) : null}

				{dialog.type === "move-prompt" ? (
					<label className="editor-field">
						<span>Destination folder</span>
						<div className="select-shell">
							<select
								value={dialogValue}
								onChange={(event) => onDialogValueChange(event.target.value)}
							>
								{folders.map((folder) => (
									<option key={folder.id} value={folder.id}>
										{folderPathLabel(folder, folders)}
									</option>
								))}
							</select>
							<CaretDown className="select-shell__icon" aria-hidden="true" weight="bold" />
						</div>
					</label>
				) : null}

				{dialog.type === "shortcuts" ? (
					<div className="shortcut-list">
						<div className="shortcut-card__row">
							<span>Search</span>
							<kbd>Cmd F</kbd>
						</div>
						<div className="shortcut-card__row">
							<span>New prompt</span>
							<kbd>Cmd N</kbd>
						</div>
						<div className="shortcut-card__row">
							<span>New folder</span>
							<kbd>Cmd Shift N</kbd>
						</div>
						<div className="shortcut-card__row">
							<span>Save</span>
							<kbd>Cmd S</kbd>
						</div>
						<div className="shortcut-card__row">
							<span>Dismiss dialog</span>
							<kbd>Esc</kbd>
						</div>
					</div>
				) : null}

				<div className="dialog-card__actions">
					<button className="button" onClick={onClose}>
						Cancel
					</button>
					<button
						className={`button ${
							dialog.type.includes("delete") ? "button--danger" : "button--primary"
						}`}
						disabled={
							isSubmittingDialog ||
							(("initialValue" in dialog && dialogValue.trim().length === 0) ||
								(dialog.type === "move-prompt" && dialogValue.trim().length === 0))
						}
						onClick={() => void onSubmit()}
					>
						{isSubmittingDialog ? "Working…" : dialog.submitLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
