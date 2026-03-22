import { ArrowBendUpRight, CaretDown } from "@phosphor-icons/react";
import type { Ref } from "react";
import type { FolderRecord, PromptSummary } from "../../shared/prompt-store";
import { folderNameFor, formatTimestamp, type SortMode } from "../promptLibrary";

type PromptListPanelProps = {
	searchQuery: string;
	selectedFolderName: string;
	sortMode: SortMode;
	searchInputRef: Ref<HTMLInputElement>;
	selectedFolderId: string | null;
	selectedPromptId: string | null;
	visiblePrompts: PromptSummary[];
	folders: FolderRecord[];
	onSortModeChange: (mode: SortMode) => void;
	onSearchChange: (query: string) => void;
	onCreatePrompt: () => void | Promise<void>;
	onSelectPrompt: (promptId: string) => void | Promise<void>;
};

export function PromptListPanel({
	searchQuery,
	selectedFolderName,
	sortMode,
	searchInputRef,
	selectedFolderId,
	selectedPromptId,
	visiblePrompts,
	folders,
	onSortModeChange,
	onSearchChange,
	onCreatePrompt,
	onSelectPrompt,
}: PromptListPanelProps) {
	return (
		<section className="prompt-list-panel">
			<div className="panel-header">
				<h2>{searchQuery ? "Search Results" : selectedFolderName}</h2>
				<button
					className="button button--primary"
					disabled={!selectedFolderId}
					onClick={() => void onCreatePrompt()}
				>
					New Prompt
				</button>
			</div>

			<div className="prompt-list-toolbar">
				<label className="sort-field">
					<span>Sort</span>
					<div className="select-shell">
						<select
							value={sortMode}
							onChange={(event) =>
								onSortModeChange(event.target.value as SortMode)
							}
						>
							<option value="updated">Recently updated</option>
							<option value="created">Recently created</option>
							<option value="title">Title</option>
						</select>
						<CaretDown className="select-shell__icon" aria-hidden="true" weight="bold" />
					</div>
				</label>
				<label className="search-field">
					<span>Search</span>
					<input
						ref={searchInputRef}
						value={searchQuery}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Search titles and Markdown"
					/>
				</label>
			</div>

			<div className="prompt-list">
				{visiblePrompts.length === 0 ? (
					<div className="empty-state">
						<p>No prompts yet.</p>
						<span>Create one in this folder to start your library.</span>
						<button
							className="button button--primary"
							disabled={!selectedFolderId}
							onClick={() => void onCreatePrompt()}
						>
							Create First Prompt
						</button>
					</div>
				) : (
					visiblePrompts.map((prompt) => (
						<button
							key={prompt.id}
							className={`prompt-card ${
								selectedPromptId === prompt.id ? "prompt-card--active" : ""
							}`}
							onClick={() => void onSelectPrompt(prompt.id)}
						>
							<div className="prompt-card__header">
								<div className="prompt-card__title">{prompt.title}</div>
								<ArrowBendUpRight
									className="prompt-card__chevron"
									aria-hidden="true"
									weight="bold"
								/>
							</div>
							<div className="prompt-card__excerpt">
								{prompt.excerpt || "Empty prompt"}
							</div>
							<div className="prompt-card__meta">
								<span>{folderNameFor(prompt.folderId, folders)}</span>
								<span>{formatTimestamp(prompt.updatedAt)}</span>
							</div>
						</button>
					))
				)}
			</div>
		</section>
	);
}
