#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd -L "$(dirname "$0")" && pwd -L)"
ROOT_DIR="$(cd -L "$SCRIPT_DIR/.." && pwd -L)"
APP_NAME="Your Prompt Library.app"
BUILD_DIR="$ROOT_DIR/build/stable-macos-arm64"
APP_BUNDLE="$BUILD_DIR/$APP_NAME"
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

echo "Packaging installer for App Store Connect upload..."
productbuild \
	--component "$APP_BUNDLE" /Applications \
	--sign "$APPLE_INSTALLER_IDENTITY" \
	"$PKG_PATH"

echo "Created $PKG_PATH"
