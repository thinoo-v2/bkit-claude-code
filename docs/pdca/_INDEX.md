# PDCA Documents

> 활성 PDCA 작업 문서

## Structure

```
docs/pdca/
├── _INDEX.md           # This file
├── 01-plan/            # Plan 문서
│   ├── {번호}-{제목}.md    # 시스템 계획
│   └── features/       # 기능별 계획
├── 02-design/          # Design 문서
│   ├── {번호}-{제목}.md    # 시스템 설계
│   └── features/       # 기능별 설계
└── 03-analysis/        # Analysis 문서
    └── {번호}-{제목}.md    # Gap 분석
```

## Naming Convention

| Phase | Pattern | Example |
|-------|---------|---------|
| Plan | `{feature}.plan.md` | `login.plan.md` |
| Design | `{feature}.design.md` | `login.design.md` |
| Analysis | `{feature}.analysis.md` | `login.analysis.md` |

## Current Documents

### Plan (01-plan/)

_현재 진행 중인 계획 문서 없음_

### Design (02-design/)

_현재 진행 중인 설계 문서 없음_

### Analysis (03-analysis/)

| File | Status |
|------|--------|
| [[03-analysis/10-software-engineering-perspective-analysis]] | Active |

## Archive Rules

완료 조건:
- Gap Analysis match rate >= 90%
- `/pdca-report`로 보고서 생성됨
- 사용자 명시적 완료 선언

→ `docs/archive/`로 이동

---

## Related Documents

- [[../archive/_INDEX]] - 완료된 문서 archive
- [[../../bkit-system/philosophy/pdca-methodology]] - PDCA 방법론
