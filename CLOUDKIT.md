# CloudKit Direction

This app is being prepared for CloudKit sync with these defaults:

- Container: `iCloud.com.cjsoutham.promptlibrary`
- Database scope: `private`
- Zone: `prompt-library`

## Product intent

- Sync should follow the signed-in user's iCloud account
- Data should stay private to that user across their Macs
- The app should stay local-first, with CloudKit layered on top rather than replacing the local file store

## Build behavior

- The same sync model should be used across local, TestFlight, and App Store builds
- In practice, CloudKit uses separate development and production environments
- Local development normally targets the development environment
- TestFlight and App Store builds use the production environment after the schema is deployed

## Current code state

- File-backed storage is isolated in [filePromptRepository.ts](/Users/Chris/Work/Projects/Apps/PromptStore/macos/src/bun/filePromptRepository.ts)
- Sync cursors and timestamps are isolated in [syncStateStore.ts](/Users/Chris/Work/Projects/Apps/PromptStore/macos/src/bun/syncStateStore.ts)
- Record mapping and sync plan types live in [cloudkit.ts](/Users/Chris/Work/Projects/Apps/PromptStore/macos/src/shared/cloudkit.ts)
- The selected container and scope live in [cloudkit-config.ts](/Users/Chris/Work/Projects/Apps/PromptStore/macos/src/shared/cloudkit-config.ts)

## Native bridge

This repo now includes a native Swift helper at [native/CloudKitBridge](/Users/Chris/Work/Projects/Apps/PromptStore/macos/native/CloudKitBridge) and an Electron-side client at [cloudKitBridge.ts](/Users/Chris/Work/Projects/Apps/PromptStore/macos/src/electron/cloudKitBridge.ts).

Current bridge commands:

- `health`
- `describeConfig`
- `accountStatus`

Build it with:

```bash
bun run build:cloudkit-bridge
```

## Important implementation note

Electron does not give this app direct access to Apple's native CloudKit framework by itself. The remaining implementation work in the bridge is adding commands that can:

- check iCloud account status
- fetch changes from the private database
- push save and delete operations
- return change tokens for incremental sync
