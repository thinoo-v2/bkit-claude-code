#!/bin/bash
# scripts/phase5-design-post.sh
# Purpose: Verify design token consistency after component write
# Hook: PostToolUse (Write) for phase-5-design-system skill

set -e

# Load common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../lib"

if [ -f "${LIB_DIR}/common.sh" ]; then
    source "${LIB_DIR}/common.sh"
else
    # Fallback if common.sh not found
    is_ui_file() {
        local file_path="$1"
        [[ "$file_path" == *.tsx ]] || [[ "$file_path" == *.jsx ]] || \
        [[ "$file_path" == *.vue ]] || [[ "$file_path" == *.svelte ]]
    }
fi

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // ""')

# Check if file is a UI component (framework-agnostic by extension)
if is_ui_file "$FILE_PATH"; then
    # Check for hardcoded colors (common anti-pattern)
    if echo "$CONTENT" | grep -qE '#[0-9a-fA-F]{3,6}|rgb\(|rgba\('; then
        cat << 'EOF'
{"hookSpecificOutput": {"additionalContext": "⚠️ Design Token Check:\nHardcoded colors detected!\n\nUse CSS variables instead:\n- var(--primary)\n- var(--background)\n- var(--foreground)\n\nSee globals.css for available tokens"}}
EOF
    else
        cat << 'EOF'
{"hookSpecificOutput": {"additionalContext": "✅ Design Token Check: Component uses design tokens correctly"}}
EOF
    fi
else
    echo '{}'
fi
