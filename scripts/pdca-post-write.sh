#!/bin/bash
# scripts/pdca-post-write.sh
# Purpose: Guide next steps after Write operation
# Hook: PostToolUse (Write) for bkit-rules skill

set -e

# Load common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../lib"

if [ -f "${LIB_DIR}/common.sh" ]; then
    source "${LIB_DIR}/common.sh"
else
    # Fallback if common.sh not found
    is_source_file() { return 1; }
    extract_feature() { echo ""; }
fi

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Skip non-source files (using multi-language detection)
if ! is_source_file "$FILE_PATH"; then
    echo '{}'
    exit 0
fi

# Extract feature name (supports multiple project structures)
FEATURE=$(extract_feature "$FILE_PATH")

# Skip if no feature detected
if [ -z "$FEATURE" ]; then
    echo '{}'
    exit 0
fi

# Check if design doc exists for gap analysis suggestion
DESIGN_DOC="docs/02-design/features/${FEATURE}.design.md"
DESIGN_DOC_ALT="docs/02-design/${FEATURE}.design.md"

if [ -f "$DESIGN_DOC" ] || [ -f "$DESIGN_DOC_ALT" ]; then
    cat << EOF
{"hookSpecificOutput": {"additionalContext": "Write completed: ${FILE_PATH}\n\nWhen implementation is finished, run /pdca-analyze ${FEATURE} to verify design-implementation alignment."}}
EOF
else
    echo '{}'
fi
