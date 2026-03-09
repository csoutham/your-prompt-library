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
  Example: `com.yourcompany.yourpromptlibrary`
- `ELECTROBUN_DEVELOPER_ID`
  Use your Apple Distribution signing identity name
- `APPLE_INSTALLER_IDENTITY`
  Use your Mac Installer Distribution identity name

## Build the upload package

```bash
export APP_BUNDLE_ID="com.yourcompany.yourpromptlibrary"
export ELECTROBUN_DEVELOPER_ID="Apple Distribution: Your Company, Inc. (TEAMID)"
export APPLE_INSTALLER_IDENTITY="3rd Party Mac Developer Installer: Your Company, Inc. (TEAMID)"

bun install
bun run package:testflight
```

The resulting upload artifact is:

- `artifacts/YourPromptLibrary-TestFlight.pkg`

## Submission checklist

1. Create the macOS app in App Store Connect with the same `APP_BUNDLE_ID`.
2. Ensure the Apple Distribution and installer certificates are installed in Keychain.
3. Run `bun run package:testflight`.
4. Validate the generated package locally:
   - `pkgutil --check-signature artifacts/YourPromptLibrary-TestFlight.pkg`
5. Upload the package with Transporter or Xcode Organizer.
6. Add TestFlight internal testers first, then external testers after App Review if needed.

## Notes

- The default development bundle identifier remains a local fallback only. Use `APP_BUNDLE_ID` for any real TestFlight build.
- The app uses the macOS app sandbox in TestFlight mode and allows read/write access only to user-selected files outside its app container.
- If you need App Store-specific metadata next, the remaining work is App Store Connect setup rather than code changes.
