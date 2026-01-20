# Documentation Structure Reorganization Plan

> **목적**: docs/와 bkit-system/ 폴더 역할 명확화 및 문서 구조 정리
>
> **작성일**: 2026-01-20
> **상태**: Complete (Match Rate: 98%)
> **관련 브랜치**: fix/remove-standalone-claude-refs

---

## 1. 현재 상태 분석

### 1.1 docs/ 폴더 현황

```
docs/
├── 00-ARCHITECTURE.md              # 설계 배경 (outdated)
├── 01-AI-NATIVE-TRANSFORMATION.md  # 비즈니스 가치 분석 (outdated)
├── 02-BKIT-PLUGIN-DESIGN.md        # 플러그인 설계 (partially updated)
├── 03-BKIT-FEATURES.md             # 기능 가이드 (outdated)
├── 04-HOOKS-AND-COMPONENTS-GUIDE.md # 구현 가이드 (latest)
├── 01-plan/                        # PDCA Plan 문서들
│   ├── 01~09 plan 문서들
│   └── features/
├── 02-design/                      # PDCA Design 문서들
│   └── features/
└── 03-analysis/                    # PDCA Analysis 문서들
```

### 1.2 bkit-system/ 폴더 현황

```
bkit-system/
├── README.md                       # 시스템 개요
├── _GRAPH-INDEX.md                 # Obsidian 그래프 허브
├── components/
│   ├── skills/_skills-overview.md
│   ├── agents/_agents-overview.md
│   ├── hooks/_hooks-overview.md
│   └── scripts/_scripts-overview.md
├── triggers/
│   ├── trigger-matrix.md
│   └── priority-rules.md
├── scenarios/                      # 사용자 시나리오
└── testing/                        # 테스트 체크리스트
```

### 1.3 문제점

| 문제 | 설명 |
|------|------|
| **역할 혼재** | docs/에 설계 배경 + PDCA 작업 문서 혼재 |
| **중복 정보** | 00-ARCHITECTURE.md와 bkit-system/README.md 내용 중복 |
| **업데이트 누락** | docs/00~04 문서들이 v1.2.0/v1.2.1 변경사항 미반영 |
| **참조 오류** | README.md가 outdated 문서 참조 |

---

## 2. 목표 구조 (Option A)

### 2.1 폴더 역할 정의

| 폴더 | 역할 | 특징 |
|------|------|------|
| **bkit-system/** | "현재 무엇인가" (What IS) | 항상 최신 구현 상태 반영, Obsidian 최적화 |
| **docs/pdca/** | "무엇을 하고 있는가" (What WE DO) | 활성 PDCA 작업 문서 |
| **docs/archive/** | "무엇을 했는가" (What WE DID) | 완료된 PDCA + 히스토리 |

### 2.2 목표 폴더 구조

```
bkit-claude-code/
├── bkit-system/                    # 현재 구현 참조 (Obsidian knowledge base)
│   ├── README.md                   # 시스템 개요 + 철학
│   ├── _GRAPH-INDEX.md             # Obsidian 그래프 허브
│   ├── philosophy/                 # [NEW] 설계 철학/배경
│   │   ├── core-mission.md         # 00-ARCHITECTURE 핵심 추출
│   │   ├── ai-native-principles.md # 01-AI-NATIVE 핵심 추출
│   │   └── pdca-methodology.md     # PDCA 방법론 설명
│   ├── components/                 # 컴포넌트 상세
│   ├── triggers/                   # 트리거 매트릭스
│   ├── scenarios/                  # 사용자 시나리오
│   └── testing/                    # 테스트 체크리스트
│
├── docs/
│   ├── pdca/                       # [RENAMED] 활성 PDCA 작업
│   │   ├── 01-plan/
│   │   ├── 02-design/
│   │   └── 03-analysis/
│   └── archive/                    # [NEW] 완료된 문서
│       ├── 2026-01/                # 날짜별 정리
│       │   ├── 01-HOOKS-REFACTOR-PLAN.md
│       │   └── ...
│       └── legacy/                 # 구버전 설계 문서 (읽기 전용)
│           ├── 00-ARCHITECTURE.md
│           ├── 01-AI-NATIVE-TRANSFORMATION.md
│           └── ...
│
└── README.md                       # 업데이트된 참조 링크
```

---

## 3. 마이그레이션 계획

### 3.1 Phase 1: bkit-system/ 철학 문서 추가

**목표**: docs/00~04 문서의 핵심 내용을 bkit-system/philosophy/에 통합

| 원본 문서 | 추출할 내용 | 대상 |
|-----------|------------|------|
| 00-ARCHITECTURE.md | Core Mission, 3 Philosophies, User Journey | philosophy/core-mission.md |
| 01-AI-NATIVE-TRANSFORMATION.md | As-Is/To-Be, ROI, 3 Core Competencies | philosophy/ai-native-principles.md |
| 02-BKIT-PLUGIN-DESIGN.md | 구현 참조로 이미 반영됨 | (skip - bkit-system/에 반영됨) |
| 03-BKIT-FEATURES.md | PDCA vs Pipeline 차이, Level 설명 | philosophy/pdca-methodology.md |
| 04-HOOKS-AND-COMPONENTS-GUIDE.md | 최신 상태, hooks 상세 참조 | components/hooks/_hooks-overview.md 업데이트 |

### 3.2 Phase 2: docs/ 구조 변경

```bash
# Step 1: pdca/ 폴더 생성 및 이동
mkdir -p docs/pdca
mv docs/01-plan docs/pdca/
mv docs/02-design docs/pdca/
mv docs/03-analysis docs/pdca/

# Step 2: archive/ 폴더 생성
mkdir -p docs/archive/legacy

# Step 3: 구버전 설계 문서 이동
mv docs/00-ARCHITECTURE.md docs/archive/legacy/
mv docs/01-AI-NATIVE-TRANSFORMATION.md docs/archive/legacy/
mv docs/02-BKIT-PLUGIN-DESIGN.md docs/archive/legacy/
mv docs/03-BKIT-FEATURES.md docs/archive/legacy/
mv docs/04-HOOKS-AND-COMPONENTS-GUIDE.md docs/archive/legacy/
```

### 3.3 Phase 3: README.md 및 참조 업데이트

**업데이트할 파일**:
- README.md: Documentation 섹션 링크 수정
- CLAUDE.md template: 문서 구조 규칙 추가
- bkit-system/README.md: 철학 문서 링크 추가

---

## 4. PDCA 완료 후 Archive 규칙

### 4.1 Archive 트리거 조건

| 조건 | 설명 |
|------|------|
| **Gap Analysis 완료** | match rate >= 90% 달성 |
| **Report 생성 완료** | /pdca-report로 완료 보고서 작성됨 |
| **명시적 완료 선언** | 사용자가 "이 기능 완료" 선언 |

### 4.2 Archive 프로세스

```
1. PDCA 완료 확인
   └── docs/pdca/03-analysis/{feature}.analysis.md 존재
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

### 4.3 Archive 자동화 (향후)

```bash
# scripts/archive-pdca.sh (향후 구현)
#!/bin/bash
# 사용법: ./scripts/archive-pdca.sh {feature-name}
# 1. 완료 조건 확인
# 2. archive 폴더로 이동
# 3. 인덱스 업데이트
```

---

## 5. 문서 운영 규칙

### 5.1 bkit-system/ 운영 규칙

```markdown
## bkit-system/ 규칙

### 업데이트 시점
- 코드 변경 시 반드시 함께 업데이트
- 스크립트/스킬/에이전트 추가/제거 시
- 버전 릴리즈 시

### 금지 사항
- PDCA 작업 문서 배치 금지 (→ docs/pdca/)
- 임시 파일/실험 문서 금지

### 필수 사항
- 모든 문서에 Obsidian wikilinks 사용
- _GRAPH-INDEX.md에 새 문서 등록
- 변경 시 관련 overview 문서 업데이트
```

### 5.2 docs/pdca/ 운영 규칙

```markdown
## docs/pdca/ 규칙

### 파일 명명 규칙
- Plan: {feature}.plan.md
- Design: {feature}.design.md
- Analysis: {feature}.analysis.md

### 위치 규칙
- 기능별: pdca/0X-{phase}/features/{feature}.{phase}.md
- 시스템: pdca/0X-{phase}/{번호}-{제목}.md

### Archive 시점
- Gap analysis 완료 (match rate >= 90%)
- 또는 사용자 명시적 완료 선언
```

### 5.3 docs/archive/ 운영 규칙

```markdown
## docs/archive/ 규칙

### 구조
- archive/YYYY-MM/{feature}/ : 완료된 PDCA 세트
- archive/legacy/ : 구버전 설계 문서 (읽기 전용)

### 금지 사항
- Archive 문서 수정 금지 (읽기 전용)
- 새 작업 문서 생성 금지 (→ docs/pdca/)

### 참조 용도
- 과거 설계 결정 히스토리 조회
- 유사 기능 개발 시 참고
```

---

## 6. CLAUDE.md 추가 규칙

```markdown
## 문서 구조 규칙

### bkit-system/ (현재 구현 참조)
- 코드 변경 시 반드시 함께 업데이트
- 항상 "현재 코드베이스 상태" 반영
- 구현 참조 시 이 폴더 사용

### docs/pdca/ (활성 작업)
- 진행 중인 PDCA 문서
- 완료 후 docs/archive/로 이동

### docs/archive/ (이력)
- 완료된 계획/설계 문서
- 읽기 전용 (수정 금지)

### Archive 트리거
Gap analysis 완료 (match rate >= 90%) 또는 사용자 명시적 완료 시 archive로 이동
```

---

## 7. 구현 작업 목록

### Phase 1: bkit-system/philosophy/ 생성 ✅

- [x] `bkit-system/philosophy/` 폴더 생성
- [x] `core-mission.md` 작성 (00-ARCHITECTURE 핵심 + 현재 구현 상태)
- [x] `ai-native-principles.md` 작성 (01-AI-NATIVE 핵심 + 현재 구현 상태)
- [x] `pdca-methodology.md` 작성 (03-BKIT-FEATURES 핵심 + 현재 구현 상태)
- [x] `_GRAPH-INDEX.md` 업데이트 (Philosophy 섹션 추가)

### Phase 2: docs/ 구조 변경 ✅

- [x] `docs/pdca/` 폴더 생성
- [x] `docs/01-plan/`, `02-design/`, `03-analysis/` 이동
- [x] `docs/archive/legacy/` 폴더 생성
- [x] 구버전 설계 문서 이동 (00~04)
- [x] `docs/pdca/_INDEX.md` 생성
- [x] `docs/archive/_INDEX.md` 생성
- [x] `docs/archive/legacy/_INDEX.md` 생성

### Phase 3: 참조 업데이트 ✅

- [x] `README.md` Documentation 섹션 수정
- [x] `README.md` 버전 배지 1.2.1로 업데이트
- [x] `README.md` Skills 수 18로 수정
- [x] `templates/CLAUDE.template.md` 규칙 추가
- [x] `bkit-system/README.md` 업데이트 (philosophy 링크 추가)

### Phase 4: 검증 ✅

- [x] 모든 내부 링크 검증 (30+ broken links 수정 완료)
- [x] Gap 분석 실행 (98% match rate)
- [ ] 커밋 및 푸시 (사용자 요청 시)

---

## 8. 일정

| Phase | 작업 | 예상 |
|-------|------|------|
| 1 | philosophy/ 문서 작성 | - |
| 2 | docs/ 구조 변경 | - |
| 3 | 참조 업데이트 | - |
| 4 | 검증 및 커밋 | - |

---

## 9. 성공 기준

- [ ] bkit-system/은 항상 현재 구현 상태 반영
- [ ] docs/pdca/에서만 활성 PDCA 작업 진행
- [ ] 완료된 PDCA 문서는 archive로 이동
- [ ] README.md의 모든 링크가 유효
- [ ] Obsidian 그래프 뷰에서 관계 명확히 표시

---

## 관련 문서

- [[../../archive/legacy/00-ARCHITECTURE]] - 원본 설계 배경
- [[../../archive/legacy/01-AI-NATIVE-TRANSFORMATION]] - 원본 AI Native 분석
- [[../../../bkit-system/README]] - 현재 시스템 개요
- [[../../../bkit-system/_GRAPH-INDEX]] - Obsidian 허브
- [[../../../bkit-system/philosophy/core-mission]] - 현재 철학 문서 (NEW)

