#!/bin/bash
# scripts/pre-write.sh
# Purpose: Unified PreToolUse hook for Write|Edit operations (v1.3.0)
# Combines: PDCA check, task classification (line-based), convention hints
# Hook: PreToolUse (Write|Edit) - Global hook in hooks.json
# Philosophy: Automation First - Guide, don't block

set -e

# Load common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../lib"

if [ -f "${LIB_DIR}/common.sh" ]; then
    source "${LIB_DIR}/common.sh"
else
    # Fallback functions if common.sh not found
    output_empty() { echo '{}'; }
    is_source_file() { return 1; }
    classify_task_by_lines() { echo "quick_fix"; }
    get_pdca_level() { echo "none"; }
    get_pdca_guidance_by_level() { echo ""; }
fi

# Read input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    output_empty
    exit 0
fi

# ============================================================
# Collect context messages
# ============================================================
CONTEXT_PARTS=()

# ------------------------------------------------------------
# 1. Task Classification (v1.3.0 - Line-based, Automation First)
# ------------------------------------------------------------
CLASSIFICATION="quick_fix"
PDCA_LEVEL="none"
LINE_COUNT=0

if [ -n "$CONTENT" ]; then
    LINE_COUNT=$(echo "$CONTENT" | wc -l | tr -d ' ')
    CLASSIFICATION=$(classify_task_by_lines "$CONTENT")
    PDCA_LEVEL=$(get_pdca_level "$CLASSIFICATION")
fi

# ------------------------------------------------------------
# 2. PDCA Document Check (for source files)
# ------------------------------------------------------------
FEATURE=""
DESIGN_DOC=""
PLAN_DOC=""

if is_source_file "$FILE_PATH"; then
    FEATURE=$(extract_feature "$FILE_PATH")

    if [ -n "$FEATURE" ]; then
        DESIGN_DOC=$(find_design_doc "$FEATURE")
        PLAN_DOC=$(find_plan_doc "$FEATURE")
    fi
fi

# ------------------------------------------------------------
# 3. Generate PDCA Guidance (v1.3.0 - No blocking, guide only)
# ------------------------------------------------------------
case "$PDCA_LEVEL" in
    "none")
        # Quick Fix - no guidance needed
        ;;
    "light")
        # Minor Change - light mention
        CONTEXT_PARTS+=("Minor change (${LINE_COUNT} lines). PDCA optional.")
        ;;
    "recommended")
        # Feature - recommend design doc
        if [ -n "$DESIGN_DOC" ]; then
            CONTEXT_PARTS+=("Feature (${LINE_COUNT} lines). Design doc exists: ${DESIGN_DOC}")
        elif [ -n "$FEATURE" ]; then
            CONTEXT_PARTS+=("Feature (${LINE_COUNT} lines). Design doc recommended for '${FEATURE}'. Consider /pdca-design ${FEATURE}")
        else
            CONTEXT_PARTS+=("Feature-level change (${LINE_COUNT} lines). Design doc recommended.")
        fi
        ;;
    "required")
        # Major Feature - strongly recommend (but don't block)
        if [ -n "$DESIGN_DOC" ]; then
            CONTEXT_PARTS+=("Major feature (${LINE_COUNT} lines). Design doc exists: ${DESIGN_DOC}. Refer during implementation.")
        elif [ -n "$FEATURE" ]; then
            CONTEXT_PARTS+=("⚠️ Major feature (${LINE_COUNT} lines) without design doc. Strongly recommend /pdca-design ${FEATURE} first.")
        else
            CONTEXT_PARTS+=("⚠️ Major feature (${LINE_COUNT} lines). Design doc strongly recommended before implementation.")
        fi
        ;;
esac

# Add reference to existing PDCA docs if not already mentioned
if [ -n "$PLAN_DOC" ] && [ -z "$DESIGN_DOC" ] && [ "$PDCA_LEVEL" != "none" ] && [ "$PDCA_LEVEL" != "light" ]; then
    CONTEXT_PARTS+=("Plan exists at ${PLAN_DOC}. Design doc not yet created.")
fi

# ------------------------------------------------------------
# 4. Convention Hints (for code files)
# ------------------------------------------------------------
if is_code_file "$FILE_PATH"; then
    # Only add convention hints for larger changes
    if [ "$PDCA_LEVEL" = "recommended" ] || [ "$PDCA_LEVEL" = "required" ]; then
        CONTEXT_PARTS+=("Conventions: Components=PascalCase, Functions=camelCase, Constants=UPPER_SNAKE_CASE")
    fi
elif is_env_file "$FILE_PATH"; then
    CONTEXT_PARTS+=("Env naming: NEXT_PUBLIC_* (client), DB_* (database), API_* (external), AUTH_* (auth)")
fi

# ============================================================
# Output combined context
# ============================================================
if [ ${#CONTEXT_PARTS[@]} -gt 0 ]; then
    # Join context parts with newlines
    COMBINED_CONTEXT=$(IFS=$'\n'; echo "${CONTEXT_PARTS[*]}")

    # Escape for JSON
    COMBINED_CONTEXT=$(echo "$COMBINED_CONTEXT" | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/ $//')

    cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$COMBINED_CONTEXT"}}
EOF
else
    output_empty
fi
