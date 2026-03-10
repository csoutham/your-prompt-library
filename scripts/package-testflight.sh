#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd -L "$(dirname "$0")" && pwd -L)"
ROOT_DIR="$(cd -L "$SCRIPT_DIR/.." && pwd -L)"
APP_NAME="Your Prompt Library.app"
BUILD_DIR="$ROOT_DIR/build/stable-macos-arm64"
APP_BUNDLE="$BUILD_DIR/$APP_NAME"
APP_CONTENTS="$APP_BUNDLE/Contents"
INFO_PLIST="$APP_CONTENTS/Info.plist"
ENTITLEMENTS_PLIST="$BUILD_DIR/entitlements.plist"
ARTIFACT_DIR="$ROOT_DIR/artifacts"
PKG_PATH="$ARTIFACT_DIR/YourPromptLibrary-TestFlight.pkg"
BUILD_ROOT="$ROOT_DIR"
TEMP_LINK_ROOT=""

if [[ -z "${APP_BUNDLE_ID:-}" ]]; then
	echo "APP_BUNDLE_ID is required for the TestFlight build." >&2
	exit 1
fi

if [[ -z "${ELECTROBUN_DEVELOPER_ID:-}" ]]; then
	echo "ELECTROBUN_DEVELOPER_ID is required for the signed app build." >&2
	exit 1
fi

if [[ -z "${APPLE_INSTALLER_IDENTITY:-}" ]]; then
	echo "APPLE_INSTALLER_IDENTITY is required for the signed installer package." >&2
	exit 1
fi

APP_PROVISION_PROFILE="${APP_PROVISION_PROFILE:-}"

mkdir -p "$ARTIFACT_DIR"

cleanup() {
	if [[ -n "$TEMP_LINK_ROOT" && -L "$TEMP_LINK_ROOT" ]]; then
		rm -f "$TEMP_LINK_ROOT"
	fi
}

trap cleanup EXIT

if [[ "$ROOT_DIR" == *" "* ]]; then
	TEMP_LINK_ROOT="/tmp/your-prompt-library-build"
	rm -f "$TEMP_LINK_ROOT"
	ln -s "$ROOT_DIR" "$TEMP_LINK_ROOT"
	BUILD_ROOT="$TEMP_LINK_ROOT"
	echo "Using temporary no-space build path: $BUILD_ROOT"
fi

echo "Building signed stable app bundle..."
(
	cd "$BUILD_ROOT"
	bun run build:testflight
)

if [[ ! -d "$APP_BUNDLE" ]]; then
	echo "Expected app bundle not found at $APP_BUNDLE" >&2
	exit 1
fi

if [[ ! -f "$INFO_PLIST" ]]; then
	echo "Expected Info.plist not found at $INFO_PLIST" >&2
	exit 1
fi

APP_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$INFO_PLIST")"

if /usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST" >/dev/null 2>&1; then
	/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$INFO_PLIST"
else
	/usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $APP_VERSION" "$INFO_PLIST"
fi

if [[ -z "$APP_PROVISION_PROFILE" ]]; then
	for candidate in "$HOME"/Library/MobileDevice/Provisioning\ Profiles/*.provisionprofile; do
		[[ -f "$candidate" ]] || continue
		if security cms -D -i "$candidate" 2>/dev/null | grep -q "<string>${APP_BUNDLE_ID}</string>"; then
			APP_PROVISION_PROFILE="$candidate"
			break
		fi
	done
fi

if [[ -n "$APP_PROVISION_PROFILE" ]]; then
	echo "Embedding provisioning profile: $APP_PROVISION_PROFILE"
	cp "$APP_PROVISION_PROFILE" "$APP_CONTENTS/embedded.provisionprofile"
else
	echo "No provisioning profile detected automatically. Continuing without embedding one."
fi

echo "Removing quarantine attributes from app bundle contents..."
xattr -cr "$APP_BUNDLE" || true

echo "Re-signing app bundle after Info.plist/provisioning updates..."
codesign \
	--force \
	--deep \
	--verbose \
	--timestamp \
	--sign "$ELECTROBUN_DEVELOPER_ID" \
	--entitlements "$ENTITLEMENTS_PLIST" \
	"$APP_BUNDLE"

echo "Packaging installer for App Store Connect upload..."
productbuild \
	--component "$APP_BUNDLE" /Applications \
	--sign "$APPLE_INSTALLER_IDENTITY" \
	"$PKG_PATH"

echo "Removing quarantine attributes from final installer package..."
xattr -d com.apple.quarantine "$PKG_PATH" 2>/dev/null || true

echo "Created $PKG_PATH"
