# Scenario: Write Code

> 사용자가 코드를 작성/수정할 때 bkit이 어떻게 동작하는지 (v1.2.1)

## 시나리오 개요

```
사용자: "login.ts 파일을 수정해줘"
→ Claude가 Write/Edit 도구 사용
→ 여러 Hooks 발동
→ 사용자에게 안내 제공
```

## 발동 순서 (Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 사용자 요청: "login.ts 수정"                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Claude가 Write/Edit 도구 호출 준비                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. PreToolUse Hooks 실행 (Unified Hook v1.2.0)                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [[../components/skills/bkit-rules]] → pre-write.sh      │   │
│  │ (통합 hook: PDCA + Task Classification + Convention)    │   │
│  │                                                          │   │
│  │ 1. 소스 파일 감지 (is_source_file - 확장자 기반 v1.2.1)  │   │
│  │    • 20+ 언어 지원 (.ts, .py, .go, .rs, .rb 등)          │   │
│  │    • 제외 패턴: node_modules, __pycache__, .git 등       │   │
│  │                                                          │   │
│  │ 2. feature 이름 추출 (extract_feature - 다중 언어 지원)  │   │
│  │    • Next.js: features/, modules/                        │   │
│  │    • Go: internal/, cmd/                                 │   │
│  │    • Python: routers/, views/                            │   │
│  │                                                          │   │
│  │ 3. design doc 존재 확인                                   │   │
│  │    • 있으면: "design doc 참조" 안내                      │   │
│  │    • 없으면: 빈 출력                                     │   │
│  │                                                          │   │
│  │ 4. Task Classification (통합)                            │   │
│  │    • < 50자: Quick Fix                                   │   │
│  │    • < 200자: Minor Change                               │   │
│  │    • < 1000자: Feature (PDCA 권장)                       │   │
│  │    • >= 1000자: Major Feature (PDCA 필수)                │   │
│  │                                                          │   │
│  │ 5. Convention Hints (통합)                               │   │
│  │    • 파일 타입별 코딩 컨벤션 안내                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. 실제 Write/Edit 실행                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. PostToolUse Hooks 실행                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [[../components/skills/bkit-rules]] → pdca-post-write.sh │   │
│  │ • design doc 있으면: "/pdca-analyze 권장" 안내           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ (UI 파일인 경우 - 확장자 기반 v1.2.1)                     │   │
│  │ 감지: .tsx, .jsx, .vue, .svelte (is_ui_file)             │   │
│  │                                                          │   │
│  │ [[../components/skills/phase-5-design-system]]           │   │
│  │ → phase5-design-post.sh                                  │   │
│  │ • 하드코딩 색상 검사                                     │   │
│  │ • 디자인 토큰 사용 권장                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ (UI 파일 또는 pages/components/features 경로)            │   │
│  │ [[../components/skills/phase-6-ui-integration]]          │   │
│  │ → phase6-ui-post.sh                                      │   │
│  │ • UI 레이어 분리 검증                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Claude가 additionalContext 종합하여 사용자에게 안내         │
└─────────────────────────────────────────────────────────────────┘
```

## 예시: src/features/auth/login.ts 수정

### 입력

```
파일: src/features/auth/login.ts
변경 내용: 50줄 추가 (약 1500 chars)
design doc: docs/02-design/features/auth.design.md 존재
```

### PreToolUse 결과

**bkit-rules (pre-write.sh - Unified Hook v1.2.0)**:
```
PDCA Notice: This file belongs to the 'auth' feature.

Design doc: docs/02-design/features/auth.design.md

Refer to the design document during implementation.
After completion, run /pdca-analyze auth for Gap Analysis.

---
Task Classification: Major Feature (1500 chars).
PDCA documentation is essential.

---
📏 Convention Check:
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case or PascalCase
```

> **Note (v1.2.0)**: 이전 버전의 3개 hook (pdca-pre-write, task-classify, phase2-convention-pre)이
> pre-write.sh로 통합되었습니다.

### PostToolUse 결과

**bkit-rules (pdca-post-write.sh)**:
```
Write completed: src/features/auth/login.ts

When implementation is finished, run /pdca-analyze auth to verify
design-implementation alignment.
```

**phase-6-ui-integration (phase6-ui-post.sh)**:
```
🔍 UI Layer Check:
- Components should use hooks, not direct fetch
- Follow: Components → hooks → services → apiClient
- No business logic in UI components
```

---

## 파일별 발동 차이 (v1.2.1)

### 확장자 기반 감지 (Extension-Based Detection)

| 파일 확장자 | 발동되는 Hooks |
|------------|---------------|
| `.tsx`, `.jsx` | pre-write (unified), pdca-post-write, phase-5-design, phase-6-ui |
| `.vue`, `.svelte` | pre-write (unified), pdca-post-write, phase-5-design, phase-6-ui |
| `.ts`, `.js` | pre-write (unified), pdca-post-write |
| `.py`, `.go`, `.rs` | pre-write (unified), pdca-post-write |
| `.md` | design-validator (설계 문서인 경우) |

### 경로 기반 감지 (Path-Based Detection)

| 파일 경로 | 추가 발동 |
|----------|----------|
| `pages/`, `components/`, `features/` | phase-6-ui (레이어 검증) |
| `services/`, `api/`, `lib/` | phase-6-ui (서비스 레이어 검증) |

### 제외 패턴 (Exclude Patterns)

> 환경변수 `BKIT_EXCLUDE_PATTERNS`로 커스터마이징 가능

| 패턴 | 설명 |
|-----|------|
| `node_modules` | npm 패키지 |
| `__pycache__`, `.venv` | Python 캐시/가상환경 |
| `.git`, `dist`, `build` | 빌드/버전관리 |
| `target`, `.cargo` | Rust 빌드 |
| `vendor` | Go/Ruby 의존성 |

---

## 테스트 체크리스트

- [ ] 소스 파일 수정 시 PreToolUse (pre-write.sh) 발동 확인
- [ ] design doc 있을 때 PDCA 안내 메시지 확인
- [ ] design doc 없을 때 빈 출력 확인
- [ ] 50자 미만 수정 시 "Quick Fix" 분류 확인
- [ ] 1000자 이상 수정 시 "Major Feature" 분류 확인
- [ ] .tsx/.jsx/.vue/.svelte 파일 수정 후 디자인 토큰 검증 확인
- [ ] UI 파일 수정 후 레이어 분리 검증 확인
- [ ] .py/.go/.rs 파일 수정 시 소스 파일로 감지 확인
- [ ] node_modules/, __pycache__/ 내 파일은 무시 확인

---

## 관련 문서

- [[../triggers/trigger-matrix]] - 전체 트리거 매트릭스
- [[../components/scripts/_scripts-overview]] - 스크립트 상세
- [[scenario-new-feature]] - 새 기능 요청 시나리오
