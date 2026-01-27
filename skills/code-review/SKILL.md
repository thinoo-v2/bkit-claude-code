---
name: code-review
description: |
  Code review skill for analyzing code quality, detecting bugs, and ensuring best practices.
  Provides comprehensive code review with actionable feedback.

  Use proactively when user requests code review, quality check, or bug detection.

  Triggers: code review, review code, check code, analyze code, bug detection,
  코드 리뷰, 코드 검토, 버그 검사, コードレビュー, バグ検出, 代码审查, 代码检查

  Do NOT use for: design document creation, deployment tasks, or gap analysis (use phase-8-review).
argument-hint: "[file|directory|pr]"
user-invocable: true
agent: code-analyzer
allowed-tools:
  - Read
  - Glob
  - Grep
  - LSP
  - Task
  - Bash
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-8-review.template.md
next-skill: null
pdca-phase: check
task-template: "[Code-Review] {feature}"
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
---

# Code Review Skill

> 코드 품질 분석 및 리뷰를 수행하는 Skill

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `[file]` | 특정 파일 리뷰 | `/code-review src/lib/auth.ts` |
| `[directory]` | 디렉토리 전체 리뷰 | `/code-review src/features/` |
| `[pr]` | PR 리뷰 (PR 번호) | `/code-review pr 123` |

## Review Categories

### 1. Code Quality
- 중복 코드 탐지
- 함수/파일 복잡도 분석
- 네이밍 컨벤션 검사
- 타입 안전성 확인

### 2. Bug Detection
- 잠재적 버그 패턴 탐지
- Null/undefined 처리 확인
- 에러 핸들링 검사
- 경계 조건 확인

### 3. Security
- XSS/CSRF 취약점 검사
- SQL Injection 패턴 탐지
- 민감 정보 노출 확인
- 인증/인가 로직 검토

### 4. Performance
- N+1 쿼리 패턴 탐지
- 불필요한 리렌더링 확인
- 메모리 누수 패턴 탐지
- 최적화 기회 식별

## Review Output Format

```
## Code Review Report

### Summary
- Files reviewed: N
- Issues found: N (Critical: N, Major: N, Minor: N)
- Score: N/100

### Critical Issues
1. [FILE:LINE] Issue description
   Suggestion: ...

### Major Issues
...

### Minor Issues
...

### Recommendations
- ...
```

## Agent Integration

이 Skill은 `code-analyzer` Agent를 호출하여 심층 코드 분석을 수행합니다.

| Agent | Role |
|-------|------|
| code-analyzer | 코드 품질, 보안, 성능 분석 |

## Usage Examples

```bash
# 특정 파일 리뷰
/code-review src/lib/auth.ts

# 디렉토리 전체 리뷰
/code-review src/features/user/

# PR 리뷰
/code-review pr 42

# 현재 변경사항 리뷰
/code-review staged
```

## Confidence-Based Filtering

code-analyzer Agent는 신뢰도 기반 필터링을 사용합니다:

| Confidence | 표시 여부 | 설명 |
|------------|----------|------|
| High (90%+) | 항상 표시 | 확실한 문제 |
| Medium (70-89%) | 선택적 표시 | 가능한 문제 |
| Low (<70%) | 숨김 | 불확실한 제안 |

## PDCA Integration

- **Phase**: Check (품질 검증)
- **Trigger**: 구현 완료 후 자동 제안
- **Output**: docs/03-analysis/code-review-{date}.md
