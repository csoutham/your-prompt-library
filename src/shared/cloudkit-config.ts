export const CLOUDKIT_CONTAINER_ID = "iCloud.com.cjsoutham.promptlibrary";
export const CLOUDKIT_DATABASE_SCOPE = "private";
export const CLOUDKIT_ZONE_NAME = "prompt-library";

export const CLOUDKIT_DEFAULTS = {
	containerId: CLOUDKIT_CONTAINER_ID,
	databaseScope: CLOUDKIT_DATABASE_SCOPE,
	zoneName: CLOUDKIT_ZONE_NAME,
} as const;
