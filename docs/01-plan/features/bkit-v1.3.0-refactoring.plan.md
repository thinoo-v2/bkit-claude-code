# bkit v1.3.0 Plugin Refactoring Plan

> **Summary**: bkit 플러그인 전체 기능 개선 및 리팩토링 - PDCA Check-Act 반복 기능 복구, 자동 트리거 시스템 개선, 크기 기반 PDCA 적용 규칙 정립
>
> **Project**: bkit-claude-code
> **Version**: 1.2.3 → 1.3.0
> **Author**: User
> **Date**: 2026-01-22
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

bkit 플러그인의 핵심 기능들이 버전업 과정에서 약화되거나 사라진 문제를 해결하고, 원래 설계 의도대로 복구합니다.

### 1.2 Background

#### 현재 문제점

1. **PDCA Check-Act 반복 루프 미작동**
   - pdca-iterator 에이전트가 자동으로 활성화되지 않음
   - Check 단계 후 Act 단계로 자동 연결되지 않음
   - Gap Analysis 후 자동 수정 루프가 작동하지 않음

2. **자동 트리거 시스템 미작동**
   - 사용자가 "검증", "개선" 등 키워드를 사용해도 에이전트 자동 활성화 안 됨
   - description의 "Triggers:" 키워드가 Claude에게 영향을 미치지 않음
   - SessionStart 훅 이후 대화에서 트리거가 작동하지 않음

3. **존재하지 않는 스킬 참조**
   - 여러 에이전트에서 삭제된 스킬을 참조 중
   - 에러는 발생하지 않지만 기능이 불완전함

4. **설계 사상과 구현의 불일치**
   - "크기 기반 PDCA 적용 규칙"이 제대로 구현되지 않음
   - "Automation First" 철학이 약화됨

### 1.3 Design Philosophy (복구 대상)

#### 1.3.1 PDCA 핵심 설계

```
┌─────────────────────────────────────────────────────────────────┐
│  PDCA = 크기 기반 적용 규칙 (강제 ❌, 일괄 가이드 ❌)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Quick Fix (< 10줄)    → PDCA 선택적                           │
│  Minor Change (< 50줄)  → PDCA 권장                            │
│  Feature (< 200줄)     → PDCA 필수                             │
│  Major Feature (>= 200줄) → PDCA + 분할 권장                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  핵심 원칙: "Automation First"                                  │
│  = 사용자가 명령어 몰라도 자연스럽게 PDCA를 채택하도록 유도     │
│  = "block"이 아닌 "제안"으로 자연스러운 흐름                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3.2 PDCA 사이클 흐름

```
  Plan   → 작업 계획 수립 (배경, 의도, 목적)
    ↓
  Design → 코드베이스 분석하여 설계서 작성 (작업 내용)
    ↓
  Do     → 설계서 기반 구현 (비개발 작업도 해당)
    ↓
  Check  → Plan(목적) + Design(내용)으로 코드베이스 Gap 분석
    │      → 문서 기반 구현 여부 판단
    ↓
  Act    → 미흡한 부분 추가 작업
    │
    └───────────────────────────────────────┐
                                            │
  ┌─────────────────────────────────────────┴───────┐
  │  Check ↔ Act 반복 (Match Rate >= 90% 도달까지)  │  ← pdca-iterator
  └─────────────────────────────────────────────────┘
```

#### 1.3.3 PDCA와 Pipeline의 관계

```
┌─────────────────────────────────────────────────────────────────┐
│  핵심 개념: "각 Pipeline Phase 안에서 PDCA 사이클 실행"         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pipeline Phase 4 (API) 예시:                                   │
│  ├── Plan: API 엔드포인트 정의                                  │
│  ├── Design: API 스펙 작성 (OpenAPI/REST)                      │
│  ├── Do: 엔드포인트 구현                                        │
│  ├── Check: Zero Script QA + Gap Analysis                      │
│  └── Act: 이슈 수정, 학습 사항 정리                             │
│                                                                 │
│  NOT: Pipeline 전체 = PDCA                                      │
│  YES: 각 Phase = 하나의 PDCA 사이클                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3.4 Level별 Pipeline Phase 적용

| Level | 적용 Phase | 비고 |
|-------|-----------|------|
| **Starter** | 1 → 2 → 3 → 6 → 9 | Phase 4,5,7,8 스킵 |
| **Dynamic** | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 | Phase 8 선택적 |
| **Enterprise** | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 | **모든 Phase 필수** |

### 1.4 Related Documents

- `docs/01-plan/features/auto-trigger-debugging.plan.md` (자동 트리거 분석)
- `docs/03-analysis/13-hooks-triggers-gap-analysis.md` (Gap Analysis)
- `bkit-system/triggers/trigger-matrix.md` (트리거 매트릭스)
- `bkit-system/philosophy/pdca-methodology.md` (PDCA 방법론)
- `bkit-system/philosophy/core-mission.md` (핵심 사명)

---

## 2. Scope

### 2.1 In Scope

- [ ] PDCA Check-Act 반복 루프 복구 (pdca-iterator)
- [ ] 자동 트리거 시스템 개선 (Automation First)
- [ ] 크기 기반 PDCA 적용 규칙 구현
- [ ] 존재하지 않는 스킬 참조 정리
- [ ] Task Classification 로직 구현
- [ ] Archive Rules 구현
- [ ] 문서 업데이트

### 2.2 Out of Scope

- Claude Code 자체 버그 수정 (외부 의존성)
- 완전히 새로운 기능 추가
- UI/UX 변경 (CLI 기반 유지)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | pdca-iterator의 Check-Act 반복 루프 정상 작동 | Critical | Pending |
| FR-02 | gap-detector → pdca-iterator 자동 연결 | Critical | Pending |
| FR-03 | Task Classification 자동 분류 (Quick Fix/Minor/Feature/Major) | Critical | Pending |
| FR-04 | 크기 기반 PDCA 적용 규칙 구현 | Critical | Pending |
| FR-05 | 트리거 키워드 시 관련 에이전트 자동 활성화 | High | Pending |
| FR-06 | 존재하지 않는 스킬 참조 제거/대체 | High | Partial |
| FR-07 | Archive Rules (Match Rate >= 90% 시) | Medium | Pending |
| FR-08 | Zero Script QA와 PDCA 통합 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 자동화 | Automation First - 자연스러운 PDCA 채택 유도 | 사용자 테스트 |
| 유연성 | 크기에 따른 적절한 PDCA 적용 | Task Classification 정확도 |
| 신뢰성 | 트리거가 80% 이상 정확하게 작동 | 키워드 테스트 |
| 완결성 | Check-Act 반복으로 90% Match Rate 달성 | Gap Analysis 결과 |

---

## 4. Analysis Results (현재 상태)

### 4.1 존재하지 않는 스킬 참조

| Agent | 참조 스킬 | 상태 | 조치 |
|-------|----------|------|------|
| gap-detector | analysis-patterns | ❌ 없음 | 제거 완료 |
| gap-detector | pdca-methodology | ❌ 없음 | 제거 완료 |
| pdca-iterator | evaluator-optimizer | ❌ 없음 | 제거됨 (복구 필요) |
| pdca-iterator | analysis-patterns | ❌ 없음 | 제거됨 |
| pdca-iterator | pdca-methodology | ❌ 없음 | 제거됨 |
| report-generator | document-standards | ❌ 없음 | bkit-templates로 대체 |
| report-generator | pdca-methodology | ❌ 없음 | 제거됨 |
| code-analyzer | analysis-patterns | ❌ 없음 | 제거 완료 |
| code-analyzer | document-standards | ❌ 없음 | 제거 완료 |

### 4.2 자동 트리거 실패 원인

1. **Claude Code의 자동 위임 한계**
   - description 필드만으로는 자동 위임 결정이 불충분
   - "Triggers:" 키워드는 공식 파싱 기능이 아님 (의미론적 매칭)

2. **스킬/에이전트 활성화 필요**
   - frontmatter의 hooks는 스킬/에이전트가 활성화되어야만 작동
   - 활성화되지 않으면 hooks도 무력화

3. **글로벌 훅 부족**
   - SessionStart만 글로벌 훅으로 정의
   - PreToolUse/PostToolUse가 스킬 frontmatter에만 있어서 활성화 없이는 작동 안 함

### 4.3 pdca-iterator 기능 분석

**원래 설계:**
```
pdca-iterator는 Evaluator-Optimizer 패턴 구현
├── gap-detector로 설계-구현 평가 (Check)
├── 수정 작업 수행 (Act)
├── 재평가 (Check again)
└── Match Rate >= 90% 도달까지 반복

Check-Act 반복 흐름:
1. 평가 (Check) → Match Rate 산출
2. < 90% 시 → 수정 (Act)
3. 재평가 → 반복
4. >= 90% 시 → 완료 보고서 (report-generator)
```

**현재 문제:**
- skills 참조가 존재하지 않는 스킬을 가리킴
- 자동 활성화가 안 되어 Check 후 Act로 연결 안 됨
- 반복 루프 로직이 에이전트 description에만 있고 실제 구현이 없음

---

## 5. Improvement Plan

### 5.1 Phase 1: 기반 정리

1. **존재하지 않는 스킬 참조 완전 정리**
   - 모든 에이전트의 skills 필드 검토
   - 없는 스킬은 제거 또는 존재하는 스킬로 대체

2. **글로벌 훅 강화 (Automation First)**
   - hooks.json에 PreToolUse/PostToolUse 추가
   - "block"이 아닌 "additionalContext"로 자연스러운 제안
   - Task Classification 로직 포함

### 5.2 Phase 2: PDCA 핵심 기능 복구

1. **Task Classification 구현**
   ```
   코드 변경량 기반 자동 분류:
   Quick Fix (< 10줄)    → PDCA 선택적 (제안 안 함)
   Minor Change (< 50줄)  → PDCA 권장 (가볍게 제안)
   Feature (< 200줄)     → PDCA 필수 (설계서 확인)
   Major Feature (>= 200줄) → PDCA + 분할 권장
   ```

2. **Check-Act 반복 루프 구현**
   ```
   gap-detector (Check)
       ↓ Match Rate 확인
       ├── >= 90% → report-generator (완료 보고서)
       └── < 90%  → pdca-iterator 제안
                        ↓
                   수정 (Act)
                        ↓
                   gap-detector (Check again)
                        ↓
                   반복... (최대 5회)
   ```

3. **pdca-iterator 에이전트 복구**
   - Check-Act 반복 로직 구현
   - gap-detector 결과 기반 수정 작업
   - 반복 횟수 제한 (최대 5회)

### 5.3 Phase 3: 자동 트리거 개선

1. **SessionStart 훅 개선**
   - 컨텍스트에 트리거 키워드 매핑 정보 주입
   - Claude가 키워드 인식 시 에이전트 사용하도록 안내

2. **글로벌 훅에서 키워드 감지**
   - UserPromptSubmit 훅 추가 검토
   - 특정 키워드 감지 시 관련 에이전트 제안

### 5.4 Phase 4: 추가 기능 구현

1. **Archive Rules**
   - Match Rate >= 90% 시 Archive 가능
   - Report 생성 완료 시 Archive 권장
   - docs/archive/YYYY-MM/{feature}/ 구조

2. **Zero Script QA 통합**
   - Phase 4 (API) 완료 후 Zero Script QA 제안
   - Check 단계에서 QA 결과 활용

### 5.5 Phase 5: 문서 정리

1. **설계 사상과 구현 동기화**
   - 모든 문서에서 일관된 용어 사용
   - "크기 기반 적용 규칙" 명확히

2. **PDCA-Pipeline 관계 명확화**
   - "각 Phase 안에서 PDCA" 개념 문서화
   - Level별 Phase 적용 규칙 문서화

---

## 6. Risk and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude Code 자동 위임이 근본적으로 불안정 | High | High | 글로벌 훅으로 보완, 명시적 명령어 제공 |
| Check-Act 반복이 무한 루프 | Medium | Low | 최대 반복 횟수 제한 (5회) |
| Task Classification 정확도 낮음 | Medium | Medium | 사용자 확인 단계 추가 |
| 크기 기반 규칙이 모든 상황에 맞지 않음 | Low | Medium | 사용자 오버라이드 허용 |

---

## 7. Success Criteria

### 7.1 Definition of Done

- [ ] 모든 에이전트의 skills 참조가 존재하는 스킬만 가리킴
- [ ] Task Classification이 정확하게 작동함
- [ ] Check-Act 반복 루프가 작동함 (수동 테스트 통과)
- [ ] 트리거 키워드 5개 이상 테스트 통과
- [ ] 설계 사상과 구현이 일치함

### 7.2 Quality Criteria

- [ ] pdca-iterator가 gap-detector 후 자동 제안됨
- [ ] Match Rate < 90% 시 Check-Act 반복 실행됨
- [ ] Match Rate >= 90% 시 report-generator 호출됨
- [ ] 글로벌 훅이 "block"이 아닌 "제안"으로 작동함
- [ ] Quick Fix 시 PDCA 제안하지 않음

---

## 8. Next Steps

1. [x] 이 Plan 문서 검토 및 승인
2. [ ] Design 문서 작성 - 코드베이스 분석 및 상세 설계
3. [ ] Do - 설계서 기반 구현
4. [ ] Check - Gap Analysis
5. [ ] Act - 미흡한 부분 수정 (Check-Act 반복)
6. [ ] 완료 보고서 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-22 | Initial draft | User |
| 0.2 | 2026-01-22 | 설계 사상에 맞게 전면 수정 - 크기 기반 적용 규칙, PDCA-Pipeline 관계, Check-Act 반복 핵심화 | User |
