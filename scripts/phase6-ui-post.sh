#!/bin/bash
# scripts/phase6-ui-post.sh
# Purpose: Verify layer separation after UI implementation
# Hook: PostToolUse (Write) for phase-6-ui-integration skill

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

# Check if file is in UI layer (framework-agnostic by extension + common patterns)
if is_ui_file "$FILE_PATH" || [[ "$FILE_PATH" == *"/pages/"* ]] || [[ "$FILE_PATH" == *"/components/"* ]] || [[ "$FILE_PATH" == *"/features/"* ]]; then
    cat << 'EOF'
{"hookSpecificOutput": {"additionalContext": "🔍 UI Layer Check:\n- Components should use hooks, not direct fetch\n- Follow: Components → hooks → services → apiClient\n- No business logic in UI components"}}
EOF
elif [[ "$FILE_PATH" == *"/services/"* ]] || [[ "$FILE_PATH" == *"/api/"* ]] || [[ "$FILE_PATH" == *"/lib/"* ]]; then
    cat << 'EOF'
{"hookSpecificOutput": {"additionalContext": "🔍 Service Layer Check:\n- Services should only call apiClient\n- No direct DOM manipulation\n- Keep domain logic isolated"}}
EOF
else
    echo '{}'
fi
