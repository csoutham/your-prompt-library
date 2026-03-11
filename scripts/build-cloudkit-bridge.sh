#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/native/CloudKitBridge"
OUTPUT_DIR="$ROOT_DIR/build/native"
OUTPUT_BIN="$OUTPUT_DIR/CloudKitBridge"

mkdir -p "$OUTPUT_DIR"

swift build \
	--package-path "$PACKAGE_DIR" \
	-c release

cp "$PACKAGE_DIR/.build/release/CloudKitBridge" "$OUTPUT_BIN"
chmod +x "$OUTPUT_BIN"

echo "Built CloudKitBridge at $OUTPUT_BIN"
