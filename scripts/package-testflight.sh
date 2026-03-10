#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd -L "$(dirname "$0")/.." && pwd -L)"
RELEASE_DIR="$ROOT_DIR/release"

if [[ -z "${APP_PROVISION_PROFILE:-}" ]]; then
	echo "APP_PROVISION_PROFILE is required for MAS packaging." >&2
	exit 1
fi

mkdir -p "$RELEASE_DIR"
rm -rf "$RELEASE_DIR/mas-arm64" "$RELEASE_DIR/mas-arm64-unpacked"

echo "Building Mac App Store package with Electron Builder..."
(
	cd "$ROOT_DIR"
	bun run build:testflight
)

PKG_PATH="$(find "$RELEASE_DIR" -maxdepth 1 -type f -name '*.pkg' | head -n 1)"

if [[ -z "$PKG_PATH" ]]; then
	echo "No MAS pkg found in $RELEASE_DIR" >&2
	exit 1
fi

echo "Created $PKG_PATH"
