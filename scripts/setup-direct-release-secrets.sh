#!/bin/zsh

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
	echo "GitHub CLI is required. Install gh first." >&2
	exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
	echo "GitHub CLI is not authenticated. Run 'gh auth login' first." >&2
	exit 1
fi

required_env_vars=(
	APPLE_DEVELOPER_ID_APPLICATION_P12_PATH
	APPLE_DEVELOPER_ID_APPLICATION_PASSWORD
	APPLE_ID
	APPLE_APP_SPECIFIC_PASSWORD
	APPLE_TEAM_ID
)

for variable_name in "${required_env_vars[@]}"; do
	if [[ -z "${(P)variable_name:-}" ]]; then
		echo "$variable_name is required." >&2
		exit 1
	fi
done

if [[ ! -f "$APPLE_DEVELOPER_ID_APPLICATION_P12_PATH" ]]; then
	echo "P12 file not found at $APPLE_DEVELOPER_ID_APPLICATION_P12_PATH" >&2
	exit 1
fi

repository="${1:-csoutham/prompt-library}"

temp_base64_file="$(mktemp)"
trap 'rm -f "$temp_base64_file"' EXIT

base64 < "$APPLE_DEVELOPER_ID_APPLICATION_P12_PATH" | tr -d '\n' > "$temp_base64_file"

echo "Setting GitHub Actions secrets for $repository..."

gh secret set APPLE_DEVELOPER_ID_APPLICATION_P12_BASE64 --repo "$repository" < "$temp_base64_file"
printf '%s' "$APPLE_DEVELOPER_ID_APPLICATION_PASSWORD" | gh secret set APPLE_DEVELOPER_ID_APPLICATION_PASSWORD --repo "$repository"
printf '%s' "$APPLE_ID" | gh secret set APPLE_ID --repo "$repository"
printf '%s' "$APPLE_APP_SPECIFIC_PASSWORD" | gh secret set APPLE_APP_SPECIFIC_PASSWORD --repo "$repository"
printf '%s' "$APPLE_TEAM_ID" | gh secret set APPLE_TEAM_ID --repo "$repository"

echo "Done. GitHub release automation is configured for $repository."
