import { contextBridge, ipcRenderer } from "electron";
import type { PromptStoreApi } from "../shared/prompt-store";

const channels = [
	"bootstrap",
	"listFolders",
	"listPrompts",
	"getPrompt",
	"createFolder",
	"renameFolder",
	"deleteFolder",
	"createPrompt",
	"savePrompt",
	"movePrompt",
	"renamePrompt",
	"deletePrompt",
	"searchPrompts",
	"copyPrompt",
	"exportLibrary",
	"importLibrary",
	"getAutoExportSettings",
	"saveAutoExportSettings",
	"chooseAutoExportFolder",
	"runAutoExportNow",
] as const;

type Channel = (typeof channels)[number];

const promptStore = Object.fromEntries(
	channels.map((channel) => [
		channel,
		(...args: unknown[]) => ipcRenderer.invoke(`prompt-store:${channel}`, ...args),
	]),
) as unknown as PromptStoreApi & Record<Channel, (...args: unknown[]) => Promise<unknown>>;

contextBridge.exposeInMainWorld("promptStore", promptStore);
