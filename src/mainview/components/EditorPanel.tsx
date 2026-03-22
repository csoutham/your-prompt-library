import { Check, Copy, FolderSimpleDashed, Trash } from "@phosphor-icons/react";
import type { FolderRecord, PromptRecord } from "../../shared/prompt-store";
import { folderNameFor, formatDateTime } from "../promptLibrary";

type EditorPanelProps = {
	selectedPrompt: PromptRecord | null;
	selectedFolderId: string | null;
	folders: FolderRecord[];
	draftTitle: string;
	draftBody: string;
	copiedPromptId: string | null;
	onDraftTitleChange: (title: string) => void;
	onDraftBodyChange: (body: string) => void;
	onTitleFocus: () => void;
	onTitleBlur: () => void;
	onCopyPrompt: () => void | Promise<void>;
	onMovePrompt: () => void;
	onDeletePrompt: () => void;
	onCreatePrompt: () => void | Promise<void>;
};

export function EditorPanel({
	selectedPrompt,
	selectedFolderId,
	folders,
	draftTitle,
	draftBody,
	copiedPromptId,
	onDraftTitleChange,
	onDraftBodyChange,
	onTitleFocus,
	onTitleBlur,
	onCopyPrompt,
	onMovePrompt,
	onDeletePrompt,
	onCreatePrompt,
}: EditorPanelProps) {
	return (
		<section className="editor-panel">
			<div className="panel-header">
				<div>
					<p className="eyebrow">Editor</p>
					<h2>{selectedPrompt?.title ?? "Select a prompt"}</h2>
				</div>
				<div className="editor-actions">
					<button
						className="button button--icon"
						disabled={!selectedPrompt}
						aria-label="Move prompt"
						title={selectedPrompt ? `Move "${selectedPrompt.title}"` : "Move prompt"}
						onClick={onMovePrompt}
					>
						<FolderSimpleDashed className="button__icon-svg" aria-hidden="true" />
					</button>
					<button
						className={`button button--icon ${
							copiedPromptId === selectedPrompt?.id ? "button--success" : ""
						}`}
						disabled={!selectedPrompt}
						aria-label={copiedPromptId === selectedPrompt?.id ? "Copied" : "Copy prompt"}
						title={
							copiedPromptId === selectedPrompt?.id
								? "Copied"
								: selectedPrompt
									? `Copy "${selectedPrompt.title}"`
									: "Copy prompt"
						}
						onClick={() => void onCopyPrompt()}
					>
						{copiedPromptId === selectedPrompt?.id ? (
							<Check className="button__icon-svg" aria-hidden="true" weight="bold" />
						) : (
							<Copy className="button__icon-svg" aria-hidden="true" />
						)}
					</button>
					<button
						className="button button--icon button--danger"
						disabled={!selectedPrompt}
						aria-label="Delete prompt"
						title={selectedPrompt ? `Delete "${selectedPrompt.title}"` : "Delete prompt"}
						onClick={onDeletePrompt}
					>
						<Trash className="button__icon-svg" aria-hidden="true" />
					</button>
				</div>
			</div>

			{selectedPrompt ? (
				<div className="editor-pane">
					<label className="editor-field">
						<span>Title</span>
						<input
							value={draftTitle}
							onChange={(event) => onDraftTitleChange(event.target.value)}
							onFocus={onTitleFocus}
							onBlur={onTitleBlur}
						/>
					</label>
					<label className="editor-field editor-field--body">
						<span>Contents</span>
						<textarea
							value={draftBody}
							onChange={(event) => onDraftBodyChange(event.target.value)}
							placeholder="# Prompt title&#10;&#10;Write the reusable instructions here."
						/>
					</label>
					<div className="editor-ribbon editor-ribbon--footer">
						<span className="editor-ribbon__label">Stats</span>
						<span className="editor-ribbon__value">
							{draftBody.trim()
								? `${draftBody.trim().split(/\s+/).length} words`
								: "Empty draft"}
						</span>
					</div>
					<div className="editor-meta">
						<div>
							<span className="editor-meta__label">Folder</span>
							<strong>{folderNameFor(selectedPrompt.folderId, folders)}</strong>
						</div>
						<div>
							<span className="editor-meta__label">Created</span>
							<strong>{formatDateTime(selectedPrompt.createdAt)}</strong>
						</div>
						<div>
							<span className="editor-meta__label">Updated</span>
							<strong>{formatDateTime(selectedPrompt.updatedAt)}</strong>
						</div>
					</div>
				</div>
			) : (
				<div className="empty-state empty-state--editor">
					<p>Choose a prompt or create a new one.</p>
					<span>Markdown autosaves after you pause typing.</span>
					<button
						className="button button--primary"
						disabled={!selectedFolderId}
						onClick={() => void onCreatePrompt()}
					>
						New Prompt
					</button>
				</div>
			)}
		</section>
	);
}
