# Archive Index

> 완료된 PDCA 문서 및 레거시 문서 보관소

## Archive 규칙

- **읽기 전용**: Archive 문서는 수정하지 않음
- **참조 용도**: 과거 설계 결정 히스토리 조회, 유사 기능 개발 시 참고
- **새 작업 금지**: 새 작업 문서는 `docs/pdca/`에 생성

## Folder Structure

```
docs/archive/
├── _INDEX.md           # This file
├── legacy/             # 구버전 설계 문서 (v1.2.1 이전)
└── *.md                # 완료된 PDCA 문서들
```

---

## Completed PDCA Documents

### Documentation Structure (00)

| File | Type | Status |
|------|------|--------|
| [[00-DOCUMENTATION-STRUCTURE-PLAN]] | Plan | Completed (98%) |
| [[00-DOCUMENTATION-STRUCTURE.analysis]] | Analysis | Completed |
| [[00-CLAUDE-CODE-HOOKS-ANALYSIS]] | Analysis | Completed |

### Hooks Refactoring (01)

| File | Type | Status |
|------|------|--------|
| [[01-HOOKS-REFACTOR-PLAN]] | Plan | Completed |
| [[01-HOOKS-FIX-PLAN-2026-01-19]] | Plan | Completed |
| [[01-hooks-simplification.design]] | Design | Completed |

### Automation Improvement (02)

| File | Type | Status |
|------|------|--------|
| [[02-BKIT-AUTOMATION-IMPROVEMENT-PLAN]] | Plan | Completed |
| [[02-bkit-automation-improvement.design]] | Design | Completed |
| [[02-bkit-automation-improvement.analysis]] | Analysis | Completed |

### Template & Architecture (03-06)

| File | Type | Status |
|------|------|--------|
| [[03-TEMPLATE-IMPROVEMENT-PLAN]] | Plan | Completed |
| [[04-codebase-comprehensive-gap-analysis]] | Analysis | Completed |
| [[05-CLEAN-ARCHITECTURE-REFACTORING-PLAN]] | Plan | Completed |
| [[05-clean-architecture-refactoring-analysis]] | Analysis | Completed |
| [[06-CLAUDE-FOLDER-RESTRUCTURING-PLAN]] | Plan | Completed |

### Path & Comprehensive Improvement (07-08)

| File | Type | Status |
|------|------|--------|
| [[07-PATH-PORTABILITY-FIX-PLAN]] | Plan | Completed |
| [[07-PATH-PORTABILITY-FIX.design]] | Design | Completed |
| [[08-COMPREHENSIVE-IMPROVEMENT-PLAN]] | Plan | Completed |
| [[08-COMPREHENSIVE-IMPROVEMENT.design]] | Design | Completed |

### Language Tier System (09)

| File | Type | Status |
|------|------|--------|
| [[09-LANGUAGE-TIER-SYSTEM-PLAN]] | Plan | Completed |
| [[09-LANGUAGE-TIER-SYSTEM.design]] | Design | Completed |

### Feature Designs

| File | Type | Status |
|------|------|--------|
| [[adaptive-pdca-guidance.design]] | Design | Completed |
| [[pdca-enforcement-improvement.plan]] | Plan | Completed |
| [[pdca-status-tracking.design]] | Design | Completed |
| [[smart-onboarding.design]] | Design | Completed |
| [[task-classification.design]] | Design | Completed |

---

## Legacy Documents

| File | Description | Status |
|------|-------------|--------|
| [[legacy/00-ARCHITECTURE]] | 설계 배경 및 철학 | bkit-system/philosophy/로 통합됨 |
| [[legacy/01-AI-NATIVE-TRANSFORMATION]] | AI-Native 비즈니스 가치 분석 | bkit-system/philosophy/로 통합됨 |
| [[legacy/02-BKIT-PLUGIN-DESIGN]] | 플러그인 구조 설계 | bkit-system/components/에 반영됨 |
| [[legacy/03-BKIT-FEATURES]] | 기능 가이드 | bkit-system/philosophy/pdca-methodology에 반영됨 |
| [[legacy/04-HOOKS-AND-COMPONENTS-GUIDE]] | 구현 가이드 | bkit-system/components/hooks/에 반영됨 |

---

## Related Documents

- [[../pdca/_INDEX]] - 활성 PDCA 문서
- [[../../bkit-system/philosophy/core-mission]] - 현재 철학 문서
- [[../../bkit-system/_GRAPH-INDEX]] - 시스템 인덱스
