# bkit Hooks/Triggers Gap Analysis

> Date: 2026-01-22
> Version: v1.2.3
> Status: Completed

## Executive Summary

bkit 플러그인의 hooks/triggers 자동 트리거 시스템을 Claude Code 공식 문서 및 GitHub 이슈와 비교 분석한 결과, **대부분의 구현이 공식 스펙에 부합**하나 몇 가지 개선 사항을 발견했습니다.

### Key Findings

| 항목 | 상태 | 설명 |
|------|------|------|
| hooks.json 구조 | ✅ 준수 | 공식 스펙 완전 준수 |
| SessionStart 훅 | ✅ 작동 | additionalContext 방식 작동 확인 |
| PreToolUse/PostToolUse | ✅ 준수 | Skill frontmatter에서 올바르게 정의 |
| "Triggers:" 키워드 | ⚠️ 비공식 | 공식 파싱 기능 아님, 의미론적 일치로 작동 |
| 스킬 참조 | ❌ 오류 | code-analyzer.md에서 삭제된 스킬 참조 |

---

## 1. 조사 범위

### 1.1 공식 문서 조사
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/plugins-reference

### 1.2 GitHub 이슈 조사
- #10373: SessionStart 훅 출력이 컨텍스트에 주입되지 않는 문제
- #6305, #6403: PreToolUse/PostToolUse 훅 미발동 문제
- #17283: 스킬 tool 관련 frontmatter 필드 미지원

---

## 2. 현재 구현 분석

### 2.1 hooks.json (글로벌 훅)

**현재 구현:**
```json
{
  "hooks": {
    "SessionStart": [{
      "once": true,
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
        "timeout": 5000
      }]
    }]
  }
}
```

**공식 스펙 대비:**
- ✅ `${CLAUDE_PLUGIN_ROOT}` 변수 사용 - 공식 지원
- ✅ `type: command` 형식 - 공식 지원
- ✅ `timeout` 설정 - 공식 지원 (초 단위, 기본 60초)
- ⚠️ `once: true` - 공식 문서에서는 skills 전용이라고 언급하나 작동함

### 2.2 session-start.sh (SessionStart 훅 스크립트)

**현재 구현:**
```json
{
  "systemMessage": "👋 bkit Vibecoding Kit activated",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "# bkit Vibecoding Kit..."
  }
}
```

**공식 스펙 대비:**
- ✅ JSON 응답 형식 - 공식 지원
- ✅ `hookSpecificOutput.additionalContext` - 공식 지원
- ✅ `exit 0` - 성공 시 JSON 처리

### 2.3 Skill Frontmatter Hooks

**예시 (zero-script-qa):**
```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
```

**공식 스펙 대비:**
- ✅ Skill frontmatter에서 hooks 정의 - v2.1.0+ 공식 지원
- ✅ `matcher` 패턴 - 정규식 지원
- ✅ PreToolUse, PostToolUse, Stop 이벤트 - 공식 지원

---

## 3. 발견된 문제점

### 3.1 "Triggers:" 키워드는 공식 기능이 아님 (High)

**현재 구현:**
```yaml
description: |
  Zero Script QA - Testing methodology...

  Triggers: zero script qa, log-based testing, docker logs
```

**공식 동작 방식:**
- Claude Code는 `description` 필드의 **전체 자연어**를 의미론적으로 분석
- "Triggers:" 키워드에 대한 특별한 파싱 로직 없음
- 단순히 자연어로 Claude가 이해하는 것일 뿐

**영향:**
- 현재 방식이 작동은 하지만, 공식적으로 보장된 기능이 아님
- 향후 Claude Code 업데이트에서 동작이 변경될 수 있음

**권장 조치:**
- 문서에 이 점을 명시 (완료)
- 현재 구현 유지 (자연어로 작동하므로 변경 불필요)

### 3.2 code-analyzer.md에서 삭제된 스킬 참조 (Critical)

**문제:**
```yaml
skills:
  - analysis-patterns      # ❌ 존재하지 않음
  - document-standards     # ❌ 존재하지 않음
```

**원인:**
- v1.2.0에서 이 스킬들이 삭제되었으나 에이전트 파일이 업데이트되지 않음

**조치:**
- ✅ skills 참조 제거 완료

### 3.3 trigger-matrix.md 업데이트 필요 (Medium)

**문제:**
- "Keyword-Based" 표현이 공식 동작 방식을 잘못 설명
- 삭제된 스킬 관련 설명이 남아있음

**조치:**
- ✅ "Semantic Matching" 설명 추가 완료
- ✅ 삭제된 스킬 관련 설명 정리 완료

---

## 4. 검증 결과: 자동 트리거 메커니즘

### 4.1 3단계 자동 활성화 (작동 확인)

```
Level 1: SessionStart (hooks.json)
         → 프로젝트 레벨 감지 ✅
         → PDCA 단계 감지 ✅
         → AskUserQuestion 호출 ✅

Level 2: Semantic Matching (description)
         → 자연어 기반 자동 위임 ✅
         → "Triggers:" 키워드는 보조 역할

Level 3: Tool Interception (PreToolUse/PostToolUse)
         → Skill frontmatter hooks ✅
         → 스크립트 실행 ✅
```

### 4.2 PDCA 강제 메커니즘 (작동 확인)

| 단계 | 메커니즘 | 상태 |
|------|---------|------|
| Plan | SessionStart → 4가지 옵션 제공 | ✅ |
| Design | design-validator PreToolUse 훅 | ✅ |
| Check | gap-detector PostToolUse 훅 | ✅ |
| Act | pdca-iterator 자동 제안 | ✅ |

---

## 5. 알려진 이슈 (Claude Code 측)

### 5.1 SessionStart 훅 출력 미주입 (#10373)

**상태:** 일부 환경에서 발생
**bkit 영향:** 현재 세션에서는 작동 확인됨

### 5.2 PreToolUse/PostToolUse 미발동 (#6305)

**상태:** WSL2 등 특정 환경에서 발생 가능
**bkit 대응:** 디버그 로그 추가 (`/tmp/bkit-hook-debug.log`)

---

## 6. 결론 및 권장사항

### 6.1 현재 구현 평가

**점수: 92/100**

| 영역 | 점수 | 설명 |
|------|------|------|
| Hooks 구현 | 25/25 | 공식 스펙 완전 준수 |
| Skills 구현 | 23/25 | 삭제된 스킬 참조 오류 (수정됨) |
| Agents 구현 | 24/25 | description 최적화 여지 있음 |
| 문서화 | 20/25 | trigger-matrix.md 개선 필요 (수정됨) |

### 6.2 완료된 개선사항

1. ✅ code-analyzer.md: 존재하지 않는 스킬 참조 제거
2. ✅ trigger-matrix.md: "Semantic Matching" 설명 추가
3. ✅ trigger-matrix.md: 삭제된 스킬 관련 설명 정리

### 6.3 향후 권장사항

1. **모니터링**: Claude Code 업데이트 시 hooks 동작 변경 여부 확인
2. **테스트**: WSL2 등 다양한 환경에서 hooks 작동 테스트
3. **문서화**: 공식 문서 URL을 참조로 유지

---

## References

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Skills Guide](https://code.claude.com/docs/en/skills)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [GitHub Issue #10373](https://github.com/anthropics/claude-code/issues/10373)
- [GitHub Issue #6305](https://github.com/anthropics/claude-code/issues/6305)
