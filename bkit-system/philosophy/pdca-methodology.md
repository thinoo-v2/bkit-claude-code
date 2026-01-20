# PDCA Methodology in bkit

> PDCA 사이클과 9단계 파이프라인의 관계

## PDCA Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      PDCA Cycle                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Plan ──────► Design ──────► Do ──────► Check ──────► Act     │
│     │                                                    │      │
│     └────────────────── Improvement Cycle ◄──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Document Location | Command | Purpose |
|-------|-------------------|---------|---------|
| **Plan** | `docs/01-plan/` | `/pdca-plan` | 목표, 범위, 성공 기준 정의 |
| **Design** | `docs/02-design/` | `/pdca-design` | 아키텍처, 데이터 모델, API 스펙 |
| **Do** | Code | - | 설계 기반 구현 |
| **Check** | `docs/03-analysis/` | `/pdca-analyze` | 설계-구현 Gap 분석 |
| **Act** | `docs/04-report/` | `/pdca-report` | 완료 보고서, 학습 사항 정리 |

---

## 9-Stage Development Pipeline

전체 프로젝트 개발을 위한 9단계 파이프라인:

```
Phase 1: Schema       → Data modeling, terminology
Phase 2: Convention   → Coding conventions
Phase 3: Mockup       → UI/UX mockups
Phase 4: API          → API design and implementation
Phase 5: Design System → Build design system
Phase 6: UI           → UI component integration
Phase 7: SEO/Security → SEO and security checks
Phase 8: Review       → Code review
Phase 9: Deployment   → Production deployment
```

### Level-specific Flow

| Level | Phases | Notes |
|-------|--------|-------|
| **Starter** | 1 → 2 → 3 → 6 → 9 | Phase 4, 5, 7, 8 skip |
| **Dynamic** | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 | Phase 8 optional |
| **Enterprise** | All phases | All phases required |

---

## PDCA vs Pipeline: The Key Relationship

### Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "Run PDCA cycle WITHIN each Pipeline Phase"                   │
│                                                                 │
│   NOT: Pipeline as a whole = PDCA                               │
│   YES: Each Phase = One PDCA cycle                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Example: Phase 4 (API)

```
Phase 4: API Implementation

├── Plan: Define API endpoints and requirements
├── Design: Write API spec (OpenAPI/REST)
├── Do: Implement endpoints
├── Check: Zero Script QA + Gap analysis
└── Act: Document learnings, fix issues
```

---

## Auto-Apply Rules

`bkit-rules` skill이 자동으로 PDCA 적용:

### 1. Task Classification

```
코드 변경 시 자동 분류:

Quick Fix      (< 10 lines)   → PDCA 선택적
Minor Change   (< 50 lines)   → PDCA 권장
Feature        (< 200 lines)  → PDCA 필수
Major Feature  (>= 200 lines) → PDCA + 분할 권장
```

### 2. Design Document Check

```
Write/Edit 시 (PreToolUse hook):

1. 해당 기능의 design doc 존재 확인
2. 없으면 → "설계 먼저 작성할까요?" 제안
3. 있으면 → 설계 참조하여 구현
```

### 3. Gap Analysis Suggestion

```
구현 완료 후 (PostToolUse hook):

1. 변경 파일 감지
2. Feature 크기 분석
3. "Gap Analysis 실행할까요?" 제안
```

---

## Document Templates

| Template | Purpose | Key Sections |
|----------|---------|--------------|
| `plan.template.md` | 계획 문서 | Goals, Scope, Success Criteria, Schedule |
| `design.template.md` | 설계 문서 | Architecture, Data Model, API Spec, Test Plan |
| `design-starter.template.md` | Starter용 간소화 설계 | Goals, User Flow, Components |
| `design-enterprise.template.md` | Enterprise용 상세 설계 | Service Architecture, Infrastructure |
| `analysis.template.md` | Gap 분석 문서 | Match Rate, Missing/Added/Changed, Recommendations |
| `report.template.md` | 완료 보고서 | Completed Items, Learnings, Improvements |

---

## Archive Rules

PDCA 사이클 완료 후 archive로 이동:

### Archive Trigger

| Condition | Action |
|-----------|--------|
| Gap Analysis >= 90% match | Archive 가능 |
| Report 생성 완료 | Archive 권장 |
| 사용자 명시적 완료 선언 | Archive 실행 |

### Archive Process

```
1. 완료 조건 확인
   └── docs/03-analysis/{feature}.analysis.md 존재
   └── match rate >= 90% 또는 사용자 승인

2. Archive 폴더 생성
   └── docs/archive/YYYY-MM/{feature}/

3. 관련 문서 이동
   ├── docs/pdca/01-plan/features/{feature}.plan.md → archive
   ├── docs/pdca/02-design/features/{feature}.design.md → archive
   └── docs/pdca/03-analysis/{feature}.analysis.md → archive

4. 인덱스 업데이트
   └── docs/archive/YYYY-MM/_INDEX.md에 추가
```

---

## Zero Script QA

전통적인 테스트 스크립트 없이 QA를 수행하는 방법론:

### Traditional vs Zero Script

| Aspect | Traditional QA | Zero Script QA |
|--------|---------------|----------------|
| Setup | Write test scripts | Build log infrastructure (one-time) |
| Execution | Run scripts | Manual UX testing |
| Analysis | Check results | AI real-time log analysis |
| Maintenance | Update scripts per change | No maintenance needed |

### Core Principles

```
1. Log everything (including 200 OK)
2. Structured JSON logs
3. Track entire flow with Request ID
4. AI monitors real-time and documents issues
```

---

## Commands Reference

### PDCA Workflow

| Command | Function |
|---------|----------|
| `/pdca-status` | Current PDCA progress dashboard |
| `/pdca-plan [feature]` | Write plan document |
| `/pdca-design [feature]` | Write design document |
| `/pdca-analyze [feature]` | Gap analysis (design vs implementation) |
| `/pdca-iterate [feature]` | Auto-fix with Evaluator-Optimizer pattern |
| `/pdca-report` | Generate completion report |
| `/pdca-next` | Suggest next action |

### Pipeline Management

| Command | Function |
|---------|----------|
| `/pipeline-start` | Start full development pipeline |
| `/pipeline-status` | Check pipeline status |
| `/pipeline-next` | Next pipeline phase |

---

## Related Documents

- [[core-mission]] - 핵심 사명과 철학
- [[ai-native-principles]] - AI-Native 원칙
- [[../components/skills/_skills-overview]] - Skill 상세
- [[../scenarios/scenario-new-feature]] - 새 기능 시나리오
- [[../../skills/development-pipeline/SKILL]] - 파이프라인 skill
