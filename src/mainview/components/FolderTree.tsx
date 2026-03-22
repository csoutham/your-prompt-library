import { FolderSimplePlus, PencilSimple, Trash } from "@phosphor-icons/react";
import type { FolderRecord } from "../../shared/prompt-store";

type FolderTreeProps = {
	folders: FolderRecord[];
	parentId: string | null;
	selectedFolderId: string | null;
	onSelect: (folderId: string) => void | Promise<void>;
	folderPromptCounts: Map<string, number>;
	onCreateChild: (folder: FolderRecord) => void;
	onRename: (folder: FolderRecord) => void;
	onDelete: (folder: FolderRecord) => void;
};

export function FolderTree({
	folders,
	parentId,
	selectedFolderId,
	onSelect,
	folderPromptCounts,
	onCreateChild,
	onRename,
	onDelete,
}: FolderTreeProps) {
	return folders
		.filter((folder) => folder.parentId === parentId)
		.map((folder) => (
			<div key={folder.id} className="folder-tree__branch">
				<div
					className={`folder-tree__row ${
						selectedFolderId === folder.id ? "folder-tree__row--active" : ""
					}`}
				>
					<button
						className={`folder-tree__item ${
							selectedFolderId === folder.id ? "folder-tree__item--active" : ""
						}`}
						onClick={() => void onSelect(folder.id)}
					>
						<span className="folder-tree__item-label">
							<span className="folder-tree__dot" />
							<span>{folder.name}</span>
						</span>
						<span className="folder-tree__item-meta">
							<span className="folder-tree__actions">
								{folder.parentId === null ? (
									<button
										className="folder-tree__action"
										aria-label={`Create subfolder in ${folder.name}`}
										title={`Create subfolder in ${folder.name}`}
										onClick={(event) => {
											event.stopPropagation();
											onCreateChild(folder);
										}}
									>
										<FolderSimplePlus
											className="button__icon-svg"
											aria-hidden="true"
										/>
									</button>
								) : null}
								<button
									className="folder-tree__action"
									aria-label={`Rename ${folder.name}`}
									title={`Rename ${folder.name}`}
									onClick={(event) => {
										event.stopPropagation();
										onRename(folder);
									}}
								>
									<PencilSimple className="button__icon-svg" aria-hidden="true" />
								</button>
								<button
									className="folder-tree__action folder-tree__action--danger"
									aria-label={`Delete ${folder.name}`}
									title={`Delete ${folder.name}`}
									onClick={(event) => {
										event.stopPropagation();
										onDelete(folder);
									}}
								>
									<Trash className="button__icon-svg" aria-hidden="true" />
								</button>
							</span>
							<span className="folder-tree__count">
								{folderPromptCounts.get(folder.id) ?? 0}
							</span>
						</span>
					</button>
				</div>
				<div className="folder-tree__children">
					<FolderTree
						folders={folders}
						parentId={folder.id}
						selectedFolderId={selectedFolderId}
						onSelect={onSelect}
						folderPromptCounts={folderPromptCounts}
						onCreateChild={onCreateChild}
						onRename={onRename}
						onDelete={onDelete}
					/>
				</div>
			</div>
		));
}
