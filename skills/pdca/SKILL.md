---
name: pdca
description: |
  PDCA 사이클 전체를 관리하는 통합 skill.
  "계획", "설계", "분석", "보고서", "상태" 키워드로 자동 호출.
  기존 /pdca-* 명령어를 대체.

  Use proactively when user mentions PDCA cycle, planning, design documents,
  gap analysis, iteration, or completion reports.

  Triggers: pdca, 계획, 설계, 분석, 검증, 보고서, 반복, 개선, plan, design, analyze,
  check, report, status, next, iterate, gap, 計画, 設計, 分析, 検証, 報告,
  计划, 设计, 分析, 验证, 报告, planificar, diseño, analizar, verificar

  Do NOT use for: simple queries without PDCA context, code-only tasks.
argument-hint: "[action] [feature]"
user-invocable: true
agents:
  analyze: gap-detector
  iterate: pdca-iterator
  report: report-generator
  default: null
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - AskUserQuestion
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
  - ${PLUGIN_ROOT}/templates/design.template.md
  - ${PLUGIN_ROOT}/templates/do.template.md
  - ${PLUGIN_ROOT}/templates/analysis.template.md
  - ${PLUGIN_ROOT}/templates/report.template.md
  - ${PLUGIN_ROOT}/templates/iteration-report.template.md
next-skill: null
pdca-phase: null
task-template: "[PDCA] {feature}"
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
---

# PDCA Skill

> PDCA 사이클을 관리하는 통합 Skill. Plan → Design → Do → Check → Act 전체 흐름을 지원합니다.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `plan [feature]` | Plan 문서 생성 | `/pdca plan user-auth` |
| `design [feature]` | Design 문서 생성 | `/pdca design user-auth` |
| `do [feature]` | Do 단계 가이드 (구현 시작) | `/pdca do user-auth` |
| `analyze [feature]` | Gap 분석 실행 (Check 단계) | `/pdca analyze user-auth` |
| `iterate [feature]` | 자동 개선 반복 (Act 단계) | `/pdca iterate user-auth` |
| `report [feature]` | 완료 보고서 생성 | `/pdca report user-auth` |
| `archive [feature]` | 완료된 PDCA 문서 아카이브 | `/pdca archive user-auth` |
| `status` | 현재 PDCA 상태 표시 | `/pdca status` |
| `next` | 다음 단계 가이드 | `/pdca next` |

## Action별 동작

### plan (Plan 단계)

1. `docs/01-plan/features/{feature}.plan.md` 존재 여부 확인
2. 없으면 `plan.template.md` 기반으로 생성
3. 있으면 내용 표시 및 수정 제안
4. Task 생성: `[Plan] {feature}`
5. .bkit-memory.json 업데이트: phase = "plan"

**출력 경로**: `docs/01-plan/features/{feature}.plan.md`

### design (Design 단계)

1. Plan 문서 존재 확인 (필수 - 없으면 plan 먼저 실행 안내)
2. `docs/02-design/features/{feature}.design.md` 생성
3. `design.template.md` 기반 구조 + Plan 내용 참조
4. Task 생성: `[Design] {feature}` (blockedBy: Plan task)
5. .bkit-memory.json 업데이트: phase = "design"

**출력 경로**: `docs/02-design/features/{feature}.design.md`

### do (Do 단계)

1. Design 문서 존재 확인 (필수)
2. `do.template.md` 기반 구현 가이드 제공
3. Design 문서의 구현 순서 참조
4. Task 생성: `[Do] {feature}` (blockedBy: Design task)
5. .bkit-memory.json 업데이트: phase = "do"

**가이드 제공**:
- 구현 순서 체크리스트
- 주요 파일/컴포넌트 목록
- 의존성 설치 명령어

### analyze (Check 단계)

1. Do 완료 상태 확인 (구현 코드 존재)
2. **gap-detector Agent 호출**
3. Design 문서 vs 구현 코드 비교
4. Match Rate 계산 및 Gap 목록 생성
5. Task 생성: `[Check] {feature}` (blockedBy: Do task)
6. .bkit-memory.json 업데이트: phase = "check", matchRate

**출력 경로**: `docs/03-analysis/{feature}.analysis.md`

### iterate (Act 단계)

1. Check 결과 확인 (matchRate < 90% 시)
2. **pdca-iterator Agent 호출**
3. Gap 목록 기반 자동 코드 수정
4. 수정 후 자동으로 Check 재실행
5. Task 생성: `[Act-N] {feature}` (N = 반복 횟수)
6. 90% 이상 도달 또는 최대 반복(5회) 시 종료

**반복 규칙**:
- 최대 반복: 5회 (bkit.config.json으로 조정 가능)
- 종료 조건: matchRate >= 90% 또는 maxIterations 도달

### report (완료 보고서)

1. Check >= 90% 확인 (미달 시 경고)
2. **report-generator Agent 호출**
3. Plan, Design, Implementation, Analysis 통합 보고서
4. Task 생성: `[Report] {feature}`
5. .bkit-memory.json 업데이트: phase = "completed"

**출력 경로**: `docs/04-report/{feature}.report.md`

### archive (아카이브 단계)

1. Report 완료 상태 확인 (phase = "completed" 또는 matchRate >= 90%)
2. PDCA 문서 존재 확인 (plan, design, analysis, report)
3. `docs/archive/YYYY-MM/{feature}/` 폴더 생성
4. 문서 이동 (원본 위치에서 삭제)
5. Archive Index 업데이트 (`docs/archive/YYYY-MM/_INDEX.md`)
6. .pdca-status.json 업데이트: phase = "archived", archivedTo 경로 기록
7. activeFeatures에서 해당 feature 제거

**출력 경로**: `docs/archive/YYYY-MM/{feature}/`

**아카이브 대상 문서**:
- `docs/01-plan/features/{feature}.plan.md`
- `docs/02-design/features/{feature}.design.md`
- `docs/03-analysis/{feature}.analysis.md`
- `docs/04-report/features/{feature}.report.md`

**주의사항**:
- Report 완료 전에는 archive 불가
- 문서가 이동되면 원본은 삭제됨 (복원 불가)
- feature 이름은 정확히 일치해야 함

### status (상태 확인)

1. `.bkit-memory.json` 읽기
2. 현재 기능, PDCA 단계, Task 상태 표시
3. 진행률 시각화

**출력 예시**:
```
📊 PDCA 현황
─────────────────────────────
기능: user-authentication
단계: Check (Gap Analysis)
매치율: 85%
반복: 2/5
─────────────────────────────
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 🔄 → [Act] ⏳
```

### next (다음 단계)

1. 현재 PDCA 단계 확인
2. 다음 단계 가이드 및 명령어 제안
3. AskUserQuestion으로 사용자 확인

**단계별 가이드**:
| 현재 | 다음 | 제안 |
|------|------|------|
| 없음 | plan | `/pdca plan [feature]` |
| plan | design | `/pdca design [feature]` |
| design | do | 구현 시작 가이드 |
| do | check | `/pdca analyze [feature]` |
| check (<90%) | act | `/pdca iterate [feature]` |
| check (>=90%) | report | `/pdca report [feature]` |
| report | archive | `/pdca archive [feature]` |

## Template References

각 action 실행 시 imports에서 로드된 템플릿 활용:

| Action | Template | 용도 |
|--------|----------|------|
| plan | `plan.template.md` | Plan 문서 구조 |
| design | `design.template.md` | Design 문서 구조 |
| do | `do.template.md` | 구현 가이드 구조 |
| analyze | `analysis.template.md` | 분석 보고서 구조 |
| report | `report.template.md` | 완료 보고서 구조 |

## Task Integration

PDCA 각 단계는 Task System과 자동 연동됩니다:

```
Task 생성 패턴:
┌────────────────────────────────────────┐
│ [Plan] {feature}                       │
│   ↓ (blockedBy)                        │
│ [Design] {feature}                     │
│   ↓ (blockedBy)                        │
│ [Do] {feature}                         │
│   ↓ (blockedBy)                        │
│ [Check] {feature}                      │
│   ↓ (blockedBy, Check < 90%)           │
│ [Act-1] {feature}                      │
│   ↓ (반복 시)                          │
│ [Act-N] {feature}                      │
│   ↓ (Check >= 90%)                     │
│ [Report] {feature}                     │
│   ↓ (Report 완료 후)                   │
│ [Archive] {feature}                    │
└────────────────────────────────────────┘
```

## Agent Integration

| Action | Agent | 역할 |
|--------|-------|------|
| analyze | gap-detector | Design vs Implementation 비교 |
| iterate | pdca-iterator | 자동 코드 수정 및 재검증 |
| report | report-generator | 완료 보고서 생성 |

## 사용 예시

```bash
# 새 기능 시작
/pdca plan user-authentication

# 설계 문서 작성
/pdca design user-authentication

# 구현 가이드
/pdca do user-authentication

# 구현 후 Gap 분석
/pdca analyze user-authentication

# 자동 개선 (필요시)
/pdca iterate user-authentication

# 완료 보고서
/pdca report user-authentication

# 현재 상태 확인
/pdca status

# 다음 단계 가이드
/pdca next
```

## 기존 Commands 매핑

| 기존 Command | PDCA Skill |
|--------------|------------|
| `/pdca-plan` | `/pdca plan` |
| `/pdca-design` | `/pdca design` |
| `/pdca-analyze` | `/pdca analyze` |
| `/pdca-iterate` | `/pdca iterate` |
| `/pdca-report` | `/pdca report` |
| `/pdca-status` | `/pdca status` |
| `/pdca-next` | `/pdca next` |
| `/archive` | `/pdca archive` |

## 자동 트리거

다음 키워드 감지 시 자동으로 관련 action 제안:

| 키워드 | 제안 Action |
|--------|-------------|
| "계획", "plan", "기획" | plan |
| "설계", "design", "아키텍처" | design |
| "구현", "implement", "개발" | do |
| "검증", "verify", "분석" | analyze |
| "개선", "improve", "반복" | iterate |
| "완료", "report", "보고서" | report |
| "아카이브", "archive", "정리", "보관" | archive |
