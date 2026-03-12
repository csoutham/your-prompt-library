const { execFileSync } = require("node:child_process");
const { existsSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");

const DEFAULT_APP_BUNDLE_ID = "com.cjsoutham.promptlibrary";
const DEFAULT_TEAM_ID = "EUGLUJ6T59";
const DEFAULT_DISTRIBUTION_IDENTITY =
	"Apple Distribution: Chris Southam (EUGLUJ6T59)";

module.exports = async function afterSign(context) {
	if (context.electronPlatformName !== "darwin") {
		return;
	}

	const targets = context.targets?.map((target) => target.name) ?? [];
	if (!targets.includes("mas")) {
		return;
	}

	const productFilename = context.packager.appInfo.productFilename;
	const appPath = join(context.appOutDir, `${productFilename}.app`);
	const helperPath = join(appPath, "Contents", "Resources", "native", "CloudKitBridge");

	if (!existsSync(helperPath)) {
		return;
	}

	const bundleId = process.env.APP_BUNDLE_ID || DEFAULT_APP_BUNDLE_ID;
	const teamId = process.env.APPLE_TEAM_ID || DEFAULT_TEAM_ID;
	const identity =
		process.env.APPLE_DISTRIBUTION_IDENTITY || DEFAULT_DISTRIBUTION_IDENTITY;
	const tempDir = mkdtempSync(join(tmpdir(), "promptlibrary-sign-"));
	const helperEntitlementsPath = join(tempDir, "cloudkit-helper-entitlements.plist");

	writeFileSync(
		helperEntitlementsPath,
		`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.application-identifier</key>
	<string>${teamId}.${bundleId}</string>
	<key>com.apple.developer.team-identifier</key>
	<string>${teamId}</string>
	<key>com.apple.developer.icloud-container-environment</key>
	<string>Production</string>
	<key>com.apple.developer.icloud-container-identifiers</key>
	<array>
		<string>iCloud.${bundleId}</string>
	</array>
	<key>com.apple.developer.icloud-services</key>
	<array>
		<string>CloudKit</string>
	</array>
	<key>com.apple.security.app-sandbox</key>
	<true/>
	<key>com.apple.security.inherit</key>
	<true/>
</dict>
</plist>`,
	);

	try {
		execFileSync(
			"codesign",
			[
				"--force",
				"--sign",
				identity,
				"--entitlements",
				helperEntitlementsPath,
				helperPath,
			],
			{ stdio: "inherit" },
		);

		execFileSync(
			"codesign",
			[
				"--force",
				"--sign",
				identity,
				"--entitlements",
				join(context.appDir, "config", "entitlements.mas.plist"),
				appPath,
			],
			{ stdio: "inherit" },
		);
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
};
