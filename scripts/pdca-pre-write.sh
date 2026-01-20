#!/bin/bash
# scripts/pdca-pre-write.sh
# DEPRECATED: Functionality merged into pre-write.sh
# Kept for backward compatibility - functionality now in lib/common.sh
# Original Purpose: Detect PDCA phase and provide guidance before Write/Edit

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
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

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

# Check for design document
DESIGN_DOC="docs/02-design/features/${FEATURE}.design.md"
DESIGN_DOC_ALT="docs/02-design/${FEATURE}.design.md"
PLAN_DOC="docs/01-plan/features/${FEATURE}.plan.md"
PLAN_DOC_ALT="docs/01-plan/${FEATURE}.plan.md"

# Check if design document exists
if [ -f "$DESIGN_DOC" ] || [ -f "$DESIGN_DOC_ALT" ]; then
    FOUND_DESIGN=$DESIGN_DOC
    [ -f "$DESIGN_DOC_ALT" ] && FOUND_DESIGN=$DESIGN_DOC_ALT

    cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "PDCA Notice: This file belongs to the '${FEATURE}' feature.\n\nDesign doc: ${FOUND_DESIGN}\n\nRefer to the design document during implementation. After completion, run /pdca-analyze ${FEATURE} for Gap Analysis."}}
EOF
elif [ -f "$PLAN_DOC" ] || [ -f "$PLAN_DOC_ALT" ]; then
    FOUND_PLAN=$PLAN_DOC
    [ -f "$PLAN_DOC_ALT" ] && FOUND_PLAN=$PLAN_DOC_ALT

    cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "PDCA Warning: Plan document exists for '${FEATURE}' but no design document found.\n\nRecommended: Run /pdca-design ${FEATURE} to create design document first."}}
EOF
else
    # No PDCA docs - allow but don't add context for quick fixes
    echo '{}'
fi
