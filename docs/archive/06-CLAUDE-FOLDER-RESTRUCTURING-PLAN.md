# 06. .claude 폴더 구조 개선

## 문서 정보
- **작성일**: 2025-01-20
- **버전**: v1.2.0
- **상태**: Implemented

---

## 1. 문제 정의

### 1.1 이전 구조 (이중 관리)

```
bkit-claude-code/
├── commands/           ← Plugin용 (루트)
├── skills/             ← Plugin용 (루트)
├── agents/             ← Plugin용 (루트)
...
└── .claude/            ← Manual 설치용 (중복 복사본)
    ├── commands/       ← 동일 내용 중복!
    ├── skills/         ← 동일 내용 중복!
    ├── agents/         ← 동일 내용 중복!
    ...
```

### 1.2 발생했던 문제들

| 문제 | 설명 |
|------|------|
| **이중 유지보수** | 모든 변경을 두 곳에 적용해야 함 |
| **동기화 누락** | 한 곳만 수정하면 불일치 발생 |
| **혼란** | Source of truth가 불명확 |
| **저장소 비대화** | 동일 파일이 두 번 저장됨 |

---

## 2. 구현된 해결책

### 2.1 핵심 변경

1. **원격 저장소에서 `.claude/` 제거** (`.gitignore`에 추가)
2. **로컬 `.claude/`는 심볼릭 링크로 유지** (개발 테스트용)
3. **루트 레벨 = Source of Truth**

### 2.2 현재 구조

#### 원격 저장소 (GitHub)

```
bkit-claude-code/
├── .claude-plugin/      # Plugin manifest
│   ├── plugin.json
│   └── marketplace.json
│
├── commands/            # ✓ Source of truth
├── skills/              # ✓ Source of truth
├── agents/              # ✓ Source of truth
├── templates/           # ✓ Source of truth
├── hooks/               # ✓ Source of truth
├── scripts/             # ✓ Source of truth
├── lib/                 # ✓ Source of truth
├── bkit.config.json     # ✓ Source of truth
│
├── .gitignore           # .claude/ 포함
└── (no .claude/)        # 원격에는 없음
```

#### 로컬 개발 환경

```
bkit-claude-code/
├── commands/            # Source of truth
├── skills/              # Source of truth
...
└── .claude/             # 로컬 전용 (gitignore)
    ├── agents -> ../agents           # 심볼릭 링크
    ├── commands -> ../commands       # 심볼릭 링크
    ├── skills -> ../skills           # 심볼릭 링크
    ├── templates -> ../templates     # 심볼릭 링크
    ├── hooks -> ../hooks             # 심볼릭 링크
    ├── scripts -> ../scripts         # 심볼릭 링크
    ├── lib -> ../lib                 # 심볼릭 링크
    ├── bkit.config.json -> ../bkit.config.json  # 심볼릭 링크
    │
    ├── docs/              # 유지 (Plugin 내부 문서)
    ├── sessions/          # 유지 (세션 데이터)
    ├── settings.json      # 유지 (Claude Code 설정)
    └── settings.local.json # 유지 (로컬 설정)
```

---

## 3. 개발 워크플로우

### 3.1 로컬 테스트 (Option A)

```bash
# bkit-claude-code 폴더에서 직접 Claude Code 실행
cd bkit-claude-code/
claude

# 루트의 commands/, skills/ 등이 바로 로드됨
# .claude/의 심볼릭 링크를 통해 세션 설정도 적용
```

**장점**: 배포 없이 즉시 테스트
**단점**: Plugin 설치 플로우는 테스트 못함

### 3.2 수정 시 주의사항

- **루트 레벨만 수정** (commands/, skills/ 등)
- `.claude/`는 심볼릭 링크이므로 자동 반영됨
- `.claude/` 내부 파일 직접 수정 금지 (루트를 수정할 것)

---

## 4. 사용자 설치 가이드

### 4.1 Plugin 설치 (권장)

```bash
/plugin marketplace add popup-studio-ai/bkit-claude-code
/plugin install bkit
```

### 4.2 커스터마이징 (선택)

커스터마이징이 필요한 경우, 수정할 파일만 프로젝트의 `.claude/`에 복사:

```bash
# Plugin 설치 위치 확인
ls ~/.claude/plugins/bkit/

# 수정할 파일만 복사
mkdir -p .claude/skills/starter
cp ~/.claude/plugins/bkit/skills/starter/SKILL.md .claude/skills/starter/

# 프로젝트에서 수정
# → 프로젝트 .claude/가 Plugin보다 우선순위 높음
```

**주의**: 커스터마이징한 파일은 Plugin 업데이트가 자동 반영되지 않습니다.

---

## 5. 구현 체크리스트

### Phase 1: 저장소 정리
- [x] `.claude/` 를 `.gitignore`에 추가
- [x] `git rm -r --cached .claude/` 로 원격에서 제거
- [x] 커밋 & 푸시

### Phase 2: 로컬 심볼릭 링크 설정
- [x] `.claude/commands/` → `../commands` 심볼릭 링크
- [x] `.claude/skills/` → `../skills` 심볼릭 링크
- [x] `.claude/agents/` → `../agents` 심볼릭 링크
- [x] `.claude/templates/` → `../templates` 심볼릭 링크
- [x] `.claude/hooks/` → `../hooks` 심볼릭 링크
- [x] `.claude/scripts/` → `../scripts` 심볼릭 링크
- [x] `.claude/lib/` → `../lib` 심볼릭 링크
- [x] `.claude/bkit.config.json` → `../bkit.config.json` 심볼릭 링크

### Phase 3: 문서 업데이트
- [x] 본 문서 (06-CLAUDE-FOLDER-RESTRUCTURING-PLAN.md) 업데이트
- [ ] `README.md` 설치 섹션 수정
- [ ] `CHANGELOG.md` 업데이트

---

## 6. 결과

| 항목 | Before | After |
|------|--------|-------|
| 유지보수 | 두 곳 수정 | **루트만 수정** |
| 원격 저장소 | .claude/ 포함 (~200개) | .claude/ 제외 (~100개) |
| Source of truth | 불명확 | **루트 = 정답** |
| 로컬 테스트 | 중복 파일 | **심볼릭 링크** |

---

## 7. 참고

- 관련 커밋: `b944b60` (chore: remove .claude from version control)
- [05-CLEAN-ARCHITECTURE-REFACTORING-PLAN.md](05-CLEAN-ARCHITECTURE-REFACTORING-PLAN.md)
