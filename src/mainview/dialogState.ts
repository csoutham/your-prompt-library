export type DialogState =
	| {
			type: "create-folder";
			title: string;
			description: string;
			submitLabel: string;
			initialValue: string;
			parentId: string | null;
	  }
	| {
			type: "rename-folder";
			title: string;
			description: string;
			submitLabel: string;
			initialValue: string;
			folderId: string;
	  }
	| {
			type: "delete-folder";
			title: string;
			description: string;
			submitLabel: string;
			folderId: string;
	  }
	| {
			type: "delete-prompt";
			title: string;
			description: string;
			submitLabel: string;
			promptId: string;
	  }
	| {
			type: "move-prompt";
			title: string;
			description: string;
			submitLabel: string;
			promptId: string;
			initialFolderId: string;
	  }
	| {
			type: "import-library";
			title: string;
			description: string;
			submitLabel: string;
	  }
	| {
			type: "shortcuts";
			title: string;
			description: string;
			submitLabel: string;
	  }
	| null;
