#!/bin/bash
# lib/common.sh
# Purpose: Shared utility functions for bkit hooks
# Usage: source "$CLAUDE_PROJECT_DIR/lib/common.sh"

# ============================================================
# Configuration Loading
# ============================================================

# Find and load bkit config
BKIT_CONFIG=""
if [ -f "${CLAUDE_PROJECT_DIR:-}/bkit.config.json" ]; then
    BKIT_CONFIG="${CLAUDE_PROJECT_DIR}/bkit.config.json"
elif [ -f "bkit.config.json" ]; then
    BKIT_CONFIG="bkit.config.json"
fi

# Get config value using jq
# Usage: get_config ".pdca.thresholds.quickFix" "50"
get_config() {
    local path="$1"
    local default="$2"

    if [ -n "$BKIT_CONFIG" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r "$path // empty" "$BKIT_CONFIG" 2>/dev/null)
        [ -n "$value" ] && echo "$value" || echo "$default"
    else
        echo "$default"
    fi
}

# Get config array as space-separated string
# Usage: get_config_array ".sourceDirectories" "src lib app"
get_config_array() {
    local path="$1"
    local default="$2"

    if [ -n "$BKIT_CONFIG" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r "$path | if type == \"array\" then .[] else empty end" "$BKIT_CONFIG" 2>/dev/null | tr '\n' ' ')
        [ -n "$value" ] && echo "$value" || echo "$default"
    else
        echo "$default"
    fi
}

# ============================================================
# Source File Detection
# ============================================================

# Check if path is a source code file
# Usage: is_source_file "/path/to/file"
# Returns: 0 (true) or 1 (false)
is_source_file() {
    local file_path="$1"

    # Check if path starts with source directories
    [[ "$file_path" == src/* ]] || \
    [[ "$file_path" == lib/* ]] || \
    [[ "$file_path" == app/* ]] || \
    [[ "$file_path" == components/* ]] || \
    [[ "$file_path" == pages/* ]] || \
    [[ "$file_path" == features/* ]] || \
    [[ "$file_path" == services/* ]]
}

# Check if path is a code file by extension
# Usage: is_code_file "/path/to/file.ts"
# Returns: 0 (true) or 1 (false)
is_code_file() {
    local file_path="$1"

    [[ "$file_path" == *.ts ]] || \
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.js ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.py ]] || \
    [[ "$file_path" == *.go ]] || \
    [[ "$file_path" == *.rs ]] || \
    [[ "$file_path" == *.java ]]
}

# Check if path is an environment file
# Usage: is_env_file "/path/to/.env.local"
# Returns: 0 (true) or 1 (false)
is_env_file() {
    local file_path="$1"
    [[ "$file_path" == *.env* ]] || [[ "$file_path" == .env* ]]
}

# ============================================================
# Feature Detection
# ============================================================

# Extract feature name from file path
# Usage: extract_feature "/src/features/auth/login.ts"
# Output: "auth"
extract_feature() {
    local file_path="$1"
    local feature=""

    # Try to extract from features/ directory
    if [[ "$file_path" == *features/* ]]; then
        feature=$(echo "$file_path" | sed -n 's/.*features\/\([^\/]*\).*/\1/p')
    elif [[ "$file_path" == *modules/* ]]; then
        feature=$(echo "$file_path" | sed -n 's/.*modules\/\([^\/]*\).*/\1/p')
    else
        # Fall back to parent directory name
        feature=$(echo "$file_path" | sed -n 's/.*\/\([^\/]*\)\/[^\/]*$/\1/p')
        [ -z "$feature" ] && feature=$(basename "$(dirname "$file_path")")
    fi

    # Filter out generic directory names
    case "$feature" in
        src|lib|app|components|pages|utils|hooks|types|".")
            echo ""
            ;;
        *)
            echo "$feature"
            ;;
    esac
}

# ============================================================
# PDCA Document Detection
# ============================================================

# Find design document for a feature
# Usage: find_design_doc "auth"
# Output: path to design doc or empty string
find_design_doc() {
    local feature="$1"

    # Check various locations
    local paths=(
        "docs/02-design/features/${feature}.design.md"
        "docs/02-design/${feature}.design.md"
        "docs/design/${feature}.md"
    )

    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    echo ""
}

# Find plan document for a feature
# Usage: find_plan_doc "auth"
# Output: path to plan doc or empty string
find_plan_doc() {
    local feature="$1"

    local paths=(
        "docs/01-plan/features/${feature}.plan.md"
        "docs/01-plan/${feature}.plan.md"
        "docs/plan/${feature}.md"
    )

    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    echo ""
}

# ============================================================
# Task Classification
# ============================================================

# Classify task by content size
# Usage: classify_task "content string"
# Output: "quick_fix" | "minor_change" | "feature" | "major_feature"
classify_task() {
    local content="$1"
    local length=${#content}

    # Get thresholds from config or use defaults
    local quick_fix_threshold=$(get_config ".taskClassification.thresholds.quickFix" "50")
    local minor_change_threshold=$(get_config ".taskClassification.thresholds.minorChange" "200")
    local feature_threshold=$(get_config ".taskClassification.thresholds.feature" "1000")

    if [ "$length" -lt "$quick_fix_threshold" ]; then
        echo "quick_fix"
    elif [ "$length" -lt "$minor_change_threshold" ]; then
        echo "minor_change"
    elif [ "$length" -lt "$feature_threshold" ]; then
        echo "feature"
    else
        echo "major_feature"
    fi
}

# Get PDCA guidance for task classification
# Usage: get_pdca_guidance "feature"
# Output: guidance text
get_pdca_guidance() {
    local classification="$1"

    case "$classification" in
        quick_fix)
            echo "Task: Quick Fix. No PDCA documentation required."
            ;;
        minor_change)
            echo "Task: Minor Change. Check /pdca-status if needed."
            ;;
        feature)
            echo "Task: Feature. Design documentation recommended. Run /pdca-plan or /pdca-design."
            ;;
        major_feature)
            echo "Task: Major Feature. PDCA documentation essential. Start with /pdca-plan."
            ;;
    esac
}

# ============================================================
# JSON Output Helpers
# ============================================================

# Output allow decision with context
# Usage: output_allow "Additional context message"
output_allow() {
    local context="$1"

    if [ -n "$context" ]; then
        cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$context"}}
EOF
    else
        echo '{}'
    fi
}

# Output block decision with reason
# Usage: output_block "Block reason"
output_block() {
    local reason="$1"
    cat << EOF
{"decision": "block", "hookSpecificOutput": {"reason": "$reason"}}
EOF
}

# Output empty response (allow without context)
output_empty() {
    echo '{}'
}

# ============================================================
# Level Detection
# ============================================================

# Detect project level from CLAUDE.md or structure
# Usage: detect_level
# Output: "Starter" | "Dynamic" | "Enterprise"
detect_level() {
    # 1. Check CLAUDE.md for explicit level
    if [ -f "CLAUDE.md" ]; then
        local level=$(grep -i "^level:" CLAUDE.md | head -1 | awk '{print $2}')
        [ -n "$level" ] && echo "$level" && return
    fi

    # 2. Check for Enterprise indicators
    if [ -d "kubernetes" ] || [ -d "terraform" ] || [ -d "k8s" ] || [ -d "infra" ]; then
        echo "Enterprise"
        return
    fi

    # 3. Check for Dynamic indicators
    if [ -f ".mcp.json" ] || [ -d "lib/bkend" ] || [ -d "supabase" ]; then
        if grep -q "bkend" .mcp.json 2>/dev/null; then
            echo "Dynamic"
            return
        fi
    fi

    if [ -f "docker-compose.yml" ] || [ -d "api" ] || [ -d "backend" ]; then
        echo "Dynamic"
        return
    fi

    # 4. Default to Starter
    echo "Starter"
}
