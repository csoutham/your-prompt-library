# Direct Distribution

This project can now be packaged for direct download outside the Mac App Store.

## Local packaging

If your `Developer ID Application` certificate is installed in Keychain, run:

```bash
bun install
bun run package:direct
```

This produces:

- `release/Your Prompt Library-<version>-arm64.dmg`
- `release/Your Prompt Library-<version>-arm64-mac.zip`

If the following environment variables are also set, the script will now notarise the app during build and then notarise and staple the final DMG automatically:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Without those variables, the build is still signed but notarisation and DMG stapling are skipped.

At the end of the script, it also runs the release checks that matter:

- `xcrun stapler validate` against the DMG
- `spctl -a -t exec -vv` against the built app bundle

## GitHub Actions automation

The workflow at [/Users/Chris/Work/Projects/Apps/PromptStore/macos/.github/workflows/direct-release.yml](/Users/Chris/Work/Projects/Apps/PromptStore/macos/.github/workflows/direct-release.yml) builds and uploads direct-download artefacts.

Trigger modes:

- version bumps in `package.json` pushed to `main`
- manual `workflow_dispatch`

For normal releases, the intended flow is:

1. bump `package.json` version
2. push `main`
3. GitHub Actions builds the signed and notarised direct artefacts
4. the workflow creates or updates GitHub Release tag `v<version>` and attaches the `.dmg`, `.zip`, and blockmaps

Required GitHub secrets:

- `APPLE_DEVELOPER_ID_APPLICATION_P12_BASE64`
- `APPLE_DEVELOPER_ID_APPLICATION_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

To populate those secrets quickly for the current GitHub repository, use:

```bash
export APPLE_DEVELOPER_ID_APPLICATION_P12_PATH="/absolute/path/to/DeveloperIDApplication.p12"
export APPLE_DEVELOPER_ID_APPLICATION_PASSWORD="<p12-password>"
export APPLE_ID="<your-apple-id-email>"
export APPLE_APP_SPECIFIC_PASSWORD="<app-specific-password>"
export APPLE_TEAM_ID="<your-apple-team-id>"

./scripts/setup-direct-release-secrets.sh
```

If you want to target a different repository:

```bash
./scripts/setup-direct-release-secrets.sh owner/repo
```

The workflow only publishes on pushes where the `version` value in `package.json` actually changes. Manual runs still force a build.

## Notes

- Direct distribution uses `Developer ID Application` signing, not the Mac App Store provisioning profile.
- Direct builds target `dmg` and `zip`.
- Mac App Store/TestFlight packaging remains unchanged and still uses `bun run package:testflight`.
