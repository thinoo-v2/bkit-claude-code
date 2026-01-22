#!/bin/bash
# scripts/iterator-stop.sh
# Purpose: Guide next iteration or completion after pdca-iterator (v1.3.0)
# Hook: Stop for pdca-iterator agent
# Core component of Check-Act iteration loop

set -e

INPUT=$(cat)

# Check for completion markers in the output
# Look for: "완료", "Complete", ">= 90%", "매치율 9X%", "passed", "성공"
COMPLETION_PATTERN='(완료|Complete|Completed|>= 90%|매치율.*9[0-9]%|Match Rate.*9[0-9]%|passed|성공|Successfully)'
ITERATION_COUNT_PATTERN='(Iteration|반복)[^0-9]*([0-9]+)'

# Check if completed successfully
if echo "$INPUT" | grep -qiE "$COMPLETION_PATTERN"; then
    GUIDANCE="✅ pdca-iterator 완료!

설계-구현 일치도가 목표(90%)에 도달했습니다.

다음 단계:
1. **/pdca-report** 로 완료 보고서 생성
2. 변경사항 리뷰 후 커밋
3. Archive 진행 (선택)

🎉 Check-Act 반복 성공!"

# Check if max iterations reached
elif echo "$INPUT" | grep -qiE '(max.*iteration|최대.*반복|5/5|limit reached)'; then
    GUIDANCE="⚠️ pdca-iterator: 최대 반복 횟수 도달

자동 개선이 5회 반복되었지만 목표에 도달하지 못했습니다.

권장 조치:
1. 수동으로 남은 차이점 수정
2. 또는 설계 문서를 현재 구현에 맞게 업데이트
3. /pdca-analyze 로 현재 상태 재확인

💡 복잡한 차이는 수동 개입이 필요할 수 있습니다."

# Check if improvement was made but not complete
elif echo "$INPUT" | grep -qiE '(improved|개선|수정.*완료|fixed)'; then
    GUIDANCE="🔄 pdca-iterator 진행 중

수정이 완료되었습니다. 재평가가 필요합니다.

다음 단계:
1. **/pdca-analyze** {feature} 로 재평가 실행
2. 매치율 확인 후 필요시 반복

💡 90% 이상 도달까지 Check-Act를 반복하세요."

else
    # Default: suggest re-evaluation
    GUIDANCE="🔄 pdca-iterator 작업 완료

수정 작업이 완료되었습니다.

다음 단계:
1. **/pdca-analyze** 로 재평가하여 매치율 확인
2. 90% 미만이면 /pdca-iterate 재실행
3. 90% 이상이면 /pdca-report 로 완료 보고서 생성"
fi

# Escape for JSON
ESCAPED_GUIDANCE=$(printf '%s' "$GUIDANCE" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$ESCAPED_GUIDANCE"}}
EOF
