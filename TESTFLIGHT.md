# TestFlight Prep

This project is prepared for a macOS TestFlight submission path built from Electrobun.

## What is already configured

- Hidden native title bar with an in-app draggable header
- Stable release build script: `bun run build:stable`
- TestFlight-oriented signed build script: `bun run build:testflight`
- Signed installer packaging script: `bun run package:testflight`
- macOS app iconset at [assets/icon.iconset](/Users/Chris/Work/Projects/Apps/Prompt%20Store/macos/assets/icon.iconset)
- App Store-compatible sandbox entitlements for local storage and user-selected files

## Required environment variables

- `APP_BUNDLE_ID`
  Example: `com.cjsoutham.promptlibrary`
- `ELECTROBUN_DEVELOPER_ID`
  For this team:
  `3rd Party Mac Developer Application: Chris Southam (EUGLUJ6T59)`
- `APPLE_INSTALLER_IDENTITY`
  For this team:
  `3rd Party Mac Developer Installer: Chris Southam (EUGLUJ6T59)`

## Build the upload package

```bash
export APP_BUNDLE_ID="com.cjsoutham.promptlibrary"
export ELECTROBUN_DEVELOPER_ID="3rd Party Mac Developer Application: Chris Southam (EUGLUJ6T59)"
export APPLE_INSTALLER_IDENTITY="3rd Party Mac Developer Installer: Chris Southam (EUGLUJ6T59)"

bun install
bun run package:testflight
```

The resulting upload artifact is:

- `artifacts/YourPromptLibrary-TestFlight.pkg`

## Submission checklist

1. Create the macOS app in App Store Connect with the same `APP_BUNDLE_ID`.
2. Ensure the Apple Distribution and installer certificates for `Chris Southam (EUGLUJ6T59)` are installed in Keychain.
3. Run `bun run package:testflight`.
4. Validate the generated package locally:
   - `pkgutil --check-signature artifacts/YourPromptLibrary-TestFlight.pkg`
5. Upload the package with Transporter or Xcode Organizer.
6. Add TestFlight internal testers first, then external testers after App Review if needed.

## Notes

- The default bundle identifier in config is `com.cjsoutham.promptlibrary`. Override `APP_BUNDLE_ID` only if you need a different App Store Connect identifier.
- The Team ID for this release path is `EUGLUJ6T59`.
- The app uses the macOS app sandbox in TestFlight mode and allows read/write access only to user-selected files outside its app container.
- The packaging script automatically builds through a temporary symlink path when the project folder contains spaces, which works around an Electrobun signing bug with unquoted entitlement paths.
- If you need App Store-specific metadata next, the remaining work is App Store Connect setup rather than code changes.
