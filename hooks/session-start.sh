#!/bin/bash
# bkit Vibecoding Kit - SessionStart Hook (v1.3.0)
# .claude folder installation users (command type)

# Debug: Log hook execution
echo "[$(date)] SessionStart hook executed in $(pwd)" >> /tmp/bkit-hook-debug.log

# Environment Persistence: Detect project level and persist to CLAUDE_ENV_FILE
detect_project_level() {
    local level="starter"

    # Check for Enterprise level indicators
    if [[ -d "infra/terraform" ]] || [[ -d "infra/k8s" ]] || [[ -f "docker-compose.yml" && -d "services" ]]; then
        level="enterprise"
    # Check for Dynamic level indicators
    elif [[ -f ".env" || -f ".env.local" ]] && grep -q "NEXT_PUBLIC_\|DATABASE_\|AUTH_" .env* 2>/dev/null; then
        level="dynamic"
    elif [[ -d "src/features" ]] || [[ -d "src/services" ]] || [[ -f "package.json" && $(grep -c "prisma\|mongoose\|@tanstack/react-query" package.json 2>/dev/null) -gt 0 ]]; then
        level="dynamic"
    fi

    echo "$level"
}

# Detect current PDCA phase from docs/.pdca-status.json
detect_pdca_phase() {
    local phase="1"

    if [[ -f "docs/.pdca-status.json" ]]; then
        phase=$(grep -o '"currentPhase"[[:space:]]*:[[:space:]]*[0-9]*' docs/.pdca-status.json 2>/dev/null | grep -o '[0-9]*' | head -1)
        [[ -z "$phase" ]] && phase="1"
    fi

    echo "$phase"
}

# Persist environment variables if CLAUDE_ENV_FILE is available
if [[ -n "$CLAUDE_ENV_FILE" ]]; then
    DETECTED_LEVEL=$(detect_project_level)
    DETECTED_PHASE=$(detect_pdca_phase)

    echo "export BKIT_LEVEL=$DETECTED_LEVEL" >> "$CLAUDE_ENV_FILE"
    echo "export BKIT_PDCA_PHASE=$DETECTED_PHASE" >> "$CLAUDE_ENV_FILE"
fi

cat << 'JSON'
{
  "systemMessage": "👋 bkit Vibecoding Kit v1.3.0 activated",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "# bkit Vibecoding Kit v1.3.0 - Session Startup\n\n## 🚨 MANDATORY: Session Start Action\n\nWhen user sends their first message, you MUST use the **AskUserQuestion tool** to ask the following question.\nDo NOT respond with plain text. You MUST invoke the AskUserQuestion tool.\n\n### AskUserQuestion Parameters:\n```json\n{\n  \"questions\": [{\n    \"question\": \"What would you like help with?\",\n    \"header\": \"Help Type\",\n    \"options\": [\n      {\"label\": \"Learn bkit\", \"description\": \"Introduction and 9-stage pipeline\"},\n      {\"label\": \"Learn Claude Code\", \"description\": \"Setup and usage guide\"},\n      {\"label\": \"Continue Previous Work\", \"description\": \"Resume from PDCA status\"},\n      {\"label\": \"Start New Project\", \"description\": \"Initialize new project\"}  \n    ],\n    \"multiSelect\": false\n  }]\n}\n```\n\n### Actions by Selection:\n- **Learn bkit** → Explain bkit features (PDCA, Pipeline, Levels, Agents, Zero Script QA) AND teach 9-stage development process. Run /pipeline-start if user wants hands-on learning.\n- **Learn Claude Code** → Run /learn-claude-code skill\n- **Continue Previous Work** → Check PDCA status (docs/.pdca-status.json or scan docs/), guide next step\n- **Start New Project** → Ask level selection (Starter/Dynamic/Enterprise), then run /init-starter, /init-dynamic, or /init-enterprise\n\n## PDCA Core Rules (Always Apply)\n- New feature request → Check/create design doc first\n- After implementation → Suggest Gap analysis\n- Gap Analysis < 90% → Suggest pdca-iterator for auto-fix\n- Gap Analysis >= 90% → Suggest report-generator for completion\n\n## 🎯 Trigger Keyword Mapping (v1.3.0)\nWhen user mentions these keywords in conversation, consider using the corresponding agent:\n\n| User Says | Agent to Use | Action |\n|-----------|--------------|--------|\n| 검증, verify, check, 확인 | gap-detector | Run Gap Analysis |\n| 개선, improve, iterate, 고쳐, fix | pdca-iterator | Auto-fix iteration loop |\n| 분석, analyze, quality, 품질 | code-analyzer | Code quality analysis |\n| 보고서, report, summary, 요약 | report-generator | Generate completion report |\n| QA, 테스트, test, 로그 | qa-monitor | Zero Script QA via logs |\n| 설계, design, spec | design-validator | Validate design docs |\n\n## 📏 Task Size Rules (Automation First - v1.3.0)\nPDCA application based on change size (guide, not force):\n\n| Size | Lines | PDCA Level | Action |\n|------|-------|------------|--------|\n| Quick Fix | <10 | None | No guidance needed |\n| Minor Change | <50 | Light | \"PDCA optional\" mention |\n| Feature | <200 | Recommended | Design doc recommended |\n| Major Feature | >=200 | Required | Design doc strongly recommended |\n\n## 🔄 Check-Act Iteration Loop (v1.3.0)\n```\ngap-detector (Check) → Match Rate 확인\n    ├── >= 90% → report-generator (완료)\n    ├── 70-89% → 선택 제공 (수동/자동)\n    └── < 70% → pdca-iterator 권장 (Act)\n                   ↓\n              수정 후 gap-detector 재실행\n                   ↓\n              반복 (최대 5회)\n```\n\n💡 Important: Claude is not perfect. Always verify important decisions."
  }
}
JSON

exit 0
