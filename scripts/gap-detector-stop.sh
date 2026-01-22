#!/bin/bash
# scripts/gap-detector-stop.sh
# Purpose: Parse gap analysis result and guide next steps (v1.3.0)
# Hook: Stop for gap-detector agent
# Core component of Check-Act iteration loop

set -e

# Get the conversation context from stdin
INPUT=$(cat)

# Try to extract match rate from the agent's output
# Patterns: "Overall Match Rate: XX%", "매치율: XX%", "Match Rate: XX%", "일치율: XX%"
MATCH_RATE=$(echo "$INPUT" | grep -oiE '(Overall|Match Rate|매치율|일치율|Design Match)[^0-9]*([0-9]+)' | grep -oE '[0-9]+' | head -1)

# Default to 0 if not found
MATCH_RATE=${MATCH_RATE:-0}

# Generate guidance based on match rate thresholds
# >= 90%: Complete, suggest report
# 70-89%: Partial match, offer choices
# < 70%: Significant gap, strongly recommend iteration

if [ "$MATCH_RATE" -ge 90 ]; then
    GUIDANCE="✅ Gap Analysis 완료: ${MATCH_RATE}% 매치

설계-구현이 잘 일치합니다.

다음 단계:
1. /pdca-report 로 완료 보고서 생성
2. Archive 진행 가능 (docs/archive/로 이동)

🎉 PDCA Check 단계 통과!"

elif [ "$MATCH_RATE" -ge 70 ]; then
    GUIDANCE="⚠️ Gap Analysis 완료: ${MATCH_RATE}% 매치

일부 차이가 있습니다. 선택하세요:

1. **수동 수정**: 직접 차이점 수정
2. **/pdca-iterate**: 자동 개선 실행 (권장)
3. **설계 업데이트**: 구현에 맞게 설계 문서 수정
4. **의도적 차이**: 차이를 기록으로 남김

💡 90% 이상 도달 시 완료 보고서 생성 가능"

else
    GUIDANCE="🔴 Gap Analysis 완료: ${MATCH_RATE}% 매치

설계-구현 차이가 큽니다.

권장 조치:
1. **/pdca-iterate** 실행하여 자동 개선 (강력 권장)
2. 또는 설계 문서를 현재 구현에 맞게 전면 업데이트

⚠️ Check-Act 반복이 필요합니다. 90% 이상 도달까지 반복하세요."
fi

# Escape for JSON (handle newlines and quotes)
ESCAPED_GUIDANCE=$(printf '%s' "$GUIDANCE" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$ESCAPED_GUIDANCE"}}
EOF
