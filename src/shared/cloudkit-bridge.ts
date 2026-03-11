export type CloudKitBridgeCommand =
	| "health"
	| "describeConfig"
	| "accountStatus";

export type CloudKitBridgeRequest = {
	id: string;
	command: CloudKitBridgeCommand;
	payload?: Record<string, string>;
};

export type CloudKitBridgeResponse = {
	id: string;
	ok: boolean;
	result?: Record<string, string>;
	error?: string;
};
