# Path Portability Fix Plan

> **Version**: 2.0 (Major Revision)
> **Created**: 2026-01-20
> **Updated**: 2026-01-20
> **Author**: Claude Code Analysis
> **Branch**: fix/hooks-issue

---

## 1. Executive Summary

### 1.1 Critical Discovery

bkit 플러그인에서 **두 가지 심각한 문제**가 발견되었습니다:

1. **환경변수 오용**: `CLAUDE_PROJECT_DIR`과 `CLAUDE_PLUGIN_ROOT`를 잘못 사용
2. **폴더 구조 하드코딩**: 특정 프로젝트 구조(Next.js `src/`, `app/` 등)를 강제

### 1.2 Official Environment Variables (Claude Code v2.1.x)

| Variable | Description | Scope | Example |
|----------|-------------|-------|---------|
| `CLAUDE_PLUGIN_ROOT` | 플러그인 설치 디렉토리 | Plugin hooks only | `~/.claude/plugins/cache/.../bkit/` |
| `CLAUDE_PROJECT_DIR` | 사용자 프로젝트 디렉토리 | All hooks | `/Users/user/my-nextjs-app/` |
| `CLAUDE_ENV_FILE` | 환경변수 지속용 파일 경로 | SessionStart only | `/tmp/claude-env-xxx` |
| `CLAUDE_CODE_REMOTE` | 원격 실행 여부 | All hooks | `"true"` or empty |

**Source**: [Claude Code Official Hooks Documentation](https://code.claude.com/docs/en/hooks)

### 1.3 Key Insight

```
CLAUDE_PLUGIN_ROOT = bkit 플러그인이 설치된 경로 (플러그인 파일 참조용)
CLAUDE_PROJECT_DIR = 사용자가 작업 중인 프로젝트 경로 (사용자 파일 참조용)
```

**bkit의 스크립트, 템플릿, lib 파일들은 플러그인의 일부이므로 반드시 `CLAUDE_PLUGIN_ROOT`를 사용해야 합니다!**

---

## 2. Problem Analysis

### 2.1 CRITICAL: Environment Variable Misuse

#### 현재 bkit의 잘못된 사용 패턴

| File | Current (Wrong) | Should Be (Correct) |
|------|-----------------|---------------------|
| `skills/bkit-rules/SKILL.md` | `$CLAUDE_PROJECT_DIR/scripts/pre-write.sh` | `${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh` |
| `skills/bkit-templates/SKILL.md` | `$CLAUDE_PROJECT_DIR/templates/*.md` | `${CLAUDE_PLUGIN_ROOT}/templates/*.md` |
| `skills/phase-8-review/SKILL.md` | `$CLAUDE_PROJECT_DIR/scripts/phase8-review-stop.sh` | `${CLAUDE_PLUGIN_ROOT}/scripts/phase8-review-stop.sh` |
| `skills/zero-script-qa/SKILL.md` | `$CLAUDE_PROJECT_DIR/scripts/qa-*.sh` | `${CLAUDE_PLUGIN_ROOT}/scripts/qa-*.sh` |
| `agents/qa-monitor.md` | `$CLAUDE_PROJECT_DIR/scripts/qa-monitor-post.sh` | `${CLAUDE_PLUGIN_ROOT}/scripts/qa-monitor-post.sh` |
| `agents/design-validator.md` | `$CLAUDE_PROJECT_DIR/scripts/design-validator-pre.sh` | `${CLAUDE_PLUGIN_ROOT}/scripts/design-validator-pre.sh` |
| `lib/common.sh` (comment) | `source "$CLAUDE_PROJECT_DIR/lib/common.sh"` | `source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"` |

#### 올바르게 사용 중인 파일

| File | Usage | Status |
|------|-------|--------|
| `hooks/hooks.json` | `${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh` | ✅ Correct |
| `hooks/hooks.json` | `${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh` | ✅ Correct |
| `hooks/hooks.json` | `${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh` | ✅ Correct |

#### 왜 문제인가?

```
사용자 A가 bkit 플러그인을 설치하면:
- CLAUDE_PLUGIN_ROOT = ~/.claude/plugins/cache/bkit-1.2.0/
- CLAUDE_PROJECT_DIR = /Users/A/my-project/

skills/*.md에서 $CLAUDE_PROJECT_DIR/scripts/pre-write.sh 참조 시:
→ /Users/A/my-project/scripts/pre-write.sh (존재하지 않음!)
→ 스크립트 실행 실패!

올바른 참조: ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh
→ ~/.claude/plugins/cache/bkit-1.2.0/scripts/pre-write.sh (존재함!)
→ 정상 동작!
```

---

### 2.2 ISSUE: Hardcoded Project Structure

#### 2.2.1 lib/common.sh - `is_source_file()` 함수

**위치**: `lib/common.sh:53-64`

```bash
# 현재 코드 (문제)
is_source_file() {
    local file_path="$1"
    [[ "$file_path" == src/* ]] || \
    [[ "$file_path" == lib/* ]] || \
    [[ "$file_path" == app/* ]] || \
    [[ "$file_path" == components/* ]] || \
    [[ "$file_path" == pages/* ]] || \
    [[ "$file_path" == features/* ]] || \
    [[ "$file_path" == services/* ]]
}
```

**영향**:
- Python 프로젝트 (`myproject/`, `tests/`, `src/` 없음) → 동작 안 함
- Go 프로젝트 (`cmd/`, `internal/`, `pkg/`) → 동작 안 함
- Ruby on Rails (`app/models/`, `app/controllers/`) → 부분 동작
- Monorepo (`packages/*/src/`) → 동작 안 함

#### 2.2.2 lib/common.sh - `extract_feature()` 함수

**위치**: `lib/common.sh:97-121`

```bash
# 현재 코드 (문제)
if [[ "$file_path" == *features/* ]]; then
    feature=$(echo "$file_path" | sed -n 's/.*features\/\([^\/]*\).*/\1/p')
elif [[ "$file_path" == *modules/* ]]; then
    feature=$(echo "$file_path" | sed -n 's/.*modules\/\([^\/]*\).*/\1/p')
```

#### 2.2.3 scripts/ 중복 하드코딩

| File | Lines | Issue |
|------|-------|-------|
| `scripts/pdca-post-write.sh` | 12-16 | `src/*`, `lib/*`, `app/*` 등 하드코딩 |
| `scripts/pdca-pre-write.sh` | 14-18 | 동일 (deprecated) |
| `scripts/phase5-design-post.sh` | 13 | `/components/`, `/ui/` 하드코딩 |
| `scripts/phase6-ui-post.sh` | 12 | `/pages/`, `/components/` 하드코딩 |

---

### 2.3 Reference: Known Claude Code Issues

| Issue | Status | Description |
|-------|--------|-------------|
| [#9447](https://github.com/anthropics/claude-code/issues/9447) | ✅ Fixed (v2.0.45) | `CLAUDE_PROJECT_DIR` not propagated in plugin hooks |
| [#9354](https://github.com/anthropics/claude-code/issues/9354) | Open | `${CLAUDE_PLUGIN_ROOT}` doesn't work in command markdown files |

**Note**: Issue #9354 indicates that `${CLAUDE_PLUGIN_ROOT}` only works in JSON configurations (hooks, MCP), not in command markdown files. This affects our skills/*.md files that use YAML frontmatter hooks.

---

## 3. Solution Design

### 3.1 Environment Variable Strategy

#### When to Use Each Variable

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE_PLUGIN_ROOT                           │
│  Use for: Plugin's own files                                    │
│  - scripts/ (pre-write.sh, pdca-post-write.sh, etc.)            │
│  - lib/ (common.sh)                                             │
│  - templates/ (plan.template.md, etc.)                          │
│  - hooks/ (session-start.sh)                                    │
│  - agents/, commands/, skills/ configurations                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE_PROJECT_DIR                           │
│  Use for: User's project files                                  │
│  - User's source code (src/, app/, etc.)                        │
│  - User's configuration (package.json, CLAUDE.md)               │
│  - User's PDCA documents (docs/01-plan/, docs/02-design/)       │
│  - bkit.config.json (user's bkit settings)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Handling Diverse Project Structures

#### Strategy: Negative Pattern + Extension-Based Detection

기존 접근법(특정 폴더 하드코딩)을 **제외 패턴** + **확장자 기반** 접근으로 변경:

```bash
# 개선된 is_source_file() 함수
is_source_file() {
    local file_path="$1"

    # 1. 제외 패턴 (절대 소스가 아닌 것)
    local exclude_patterns="node_modules .git dist build .next __pycache__ .venv venv coverage .pytest_cache"
    for pattern in $exclude_patterns; do
        [[ "$file_path" == *"$pattern"* ]] && return 1
    done

    # 2. 문서/설정 파일 제외
    [[ "$file_path" == docs/* ]] && return 1
    [[ "$file_path" == *.md ]] && return 1
    [[ "$file_path" == *.json ]] && return 1
    [[ "$file_path" == *.yaml ]] && return 1
    [[ "$file_path" == *.yml ]] && return 1

    # 3. 코드 파일 확장자 확인
    is_code_file "$file_path"
}

# 확장자 기반 코드 파일 판단 (이미 존재)
is_code_file() {
    local file_path="$1"
    [[ "$file_path" == *.ts ]] || \
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.js ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.py ]] || \
    [[ "$file_path" == *.go ]] || \
    [[ "$file_path" == *.rs ]] || \
    [[ "$file_path" == *.java ]] || \
    [[ "$file_path" == *.rb ]] || \
    [[ "$file_path" == *.php ]] || \
    [[ "$file_path" == *.swift ]] || \
    [[ "$file_path" == *.kt ]] || \
    [[ "$file_path" == *.c ]] || \
    [[ "$file_path" == *.cpp ]] || \
    [[ "$file_path" == *.h ]]
}
```

#### Optional: Configuration-Based Override

`bkit.config.json`에서 사용자 정의 가능:

```json
{
  "sourcePatterns": {
    "include": ["myproject", "custom_src"],
    "exclude": ["vendor", "third_party"],
    "featurePatterns": ["features/*", "modules/*", "packages/*"]
  }
}
```

### 3.3 Language Detection Enhancement

Claude Code의 언어 감지 방식 참고:

| Language | Detection Patterns |
|----------|-------------------|
| JavaScript/TypeScript | `package.json`, `*.js`, `*.ts`, `function`, `const`, `=>` |
| Python | `requirements.txt`, `pyproject.toml`, `*.py`, `def`, `import` |
| Go | `go.mod`, `go.sum`, `*.go`, `func`, `package` |
| Rust | `Cargo.toml`, `*.rs`, `fn`, `impl` |
| Ruby | `Gemfile`, `*.rb`, `def`, `class` |
| Java | `pom.xml`, `build.gradle`, `*.java` |

**Source**: [Claude Code Language Support](https://milvus.io/ai-quick-reference/what-programming-languages-does-claude-code-support)

---

## 4. Implementation Plan

### Phase 0: Environment Variable Fix (HIGHEST PRIORITY)

> **이 Phase가 완료되어야 bkit 플러그인이 제대로 동작합니다!**

| Task | File | Change |
|------|------|--------|
| 0.1 | `skills/bkit-rules/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.2 | `skills/bkit-templates/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.3 | `skills/phase-8-review/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.4 | `skills/zero-script-qa/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.5 | `skills/phase-4-api/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.6 | `skills/phase-5-design-system/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.7 | `skills/phase-6-ui-integration/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.8 | `skills/phase-9-deployment/SKILL.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.9 | `agents/qa-monitor.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.10 | `agents/design-validator.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.11 | `agents/gap-detector.md` | `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` |
| 0.12 | `lib/common.sh` (comment) | 사용 설명 업데이트 |
| 0.13 | `scripts/select-template.sh` | 경로 참조 수정 |
| 0.14 | Documentation | 모든 문서의 잘못된 경로 참조 수정 |

### Phase 1: lib/common.sh Refactoring (High Priority)

| Task | Description |
|------|-------------|
| 1.1 | `is_source_file()` 함수를 제외 패턴 + 확장자 기반으로 리팩토링 |
| 1.2 | `extract_feature()` 함수 폴백 로직 강화 |
| 1.3 | 제외 패턴 목록 확장 (Python, Go, Ruby 등 지원) |
| 1.4 | 선택적 `bkit.config.json` 설정 지원 추가 |

### Phase 2: scripts/ Refactoring (Medium Priority)

| Task | File | Description |
|------|------|-------------|
| 2.1 | `scripts/pdca-post-write.sh` | `is_source_file()` 함수 사용으로 변경 |
| 2.2 | `scripts/pdca-pre-write.sh` | 삭제 (deprecated) 또는 `is_source_file()` 사용 |
| 2.3 | `scripts/phase5-design-post.sh` | 확장자 기반 UI 파일 감지 |
| 2.4 | `scripts/phase6-ui-post.sh` | 확장자 기반 UI 파일 감지 |

### Phase 3: Testing (Required)

| Test Case | Project Type | Expected Result |
|-----------|--------------|-----------------|
| 3.1 | Next.js App Router (`app/`) | ✅ Works |
| 3.2 | Next.js Pages Router (`pages/`) | ✅ Works |
| 3.3 | Python Django (`myapp/`, `tests/`) | ✅ Works |
| 3.4 | Python FastAPI (flat structure) | ✅ Works |
| 3.5 | Go standard (`cmd/`, `internal/`, `pkg/`) | ✅ Works |
| 3.6 | Rust Cargo (`src/`) | ✅ Works |
| 3.7 | Monorepo (`packages/*/src/`) | ✅ Works |
| 3.8 | Ruby on Rails (`app/models/`) | ✅ Works |

---

## 5. Affected Files Summary

### 5.1 Phase 0: Environment Variable Fixes (CRITICAL)

| Category | Count | Files |
|----------|-------|-------|
| Skills (YAML hooks) | 8 | bkit-rules, bkit-templates, phase-4-api, phase-5-design-system, phase-6-ui-integration, phase-8-review, phase-9-deployment, zero-script-qa |
| Agents (YAML hooks) | 3 | qa-monitor, design-validator, gap-detector |
| Scripts | 1 | select-template.sh |
| Lib | 1 | common.sh (comment only) |
| Documentation | 10+ | docs/01-plan/, docs/02-design/, docs/03-analysis/ |

### 5.2 Phase 1-2: Hardcoded Structure Fixes

| File | Lines | Issue |
|------|-------|-------|
| `lib/common.sh` | 53-64 | `is_source_file()` 하드코딩 |
| `lib/common.sh` | 97-121 | `extract_feature()` 하드코딩 |
| `scripts/pdca-post-write.sh` | 12-16 | 중복 하드코딩 |
| `scripts/pdca-pre-write.sh` | 14-18 | 중복 (deprecated) |
| `scripts/phase5-design-post.sh` | 13 | UI 패턴 하드코딩 |
| `scripts/phase6-ui-post.sh` | 12 | UI 패턴 하드코딩 |

### 5.3 No Fix Needed

| Category | Reason |
|----------|--------|
| `hooks/hooks.json` | ✅ Already uses `${CLAUDE_PLUGIN_ROOT}` correctly |
| `hooks/session-start.sh` | Level detection (reference only) |
| `templates/*.md` | User-customizable templates |
| Skills/Agents content | Examples and recommendations |

---

## 6. Risk Assessment

### 6.1 Breaking Changes

| Risk | Impact | Mitigation |
|------|--------|------------|
| 환경변수 변경으로 기존 설치 영향 | High | 플러그인 업데이트 시 자동 반영 |
| 소스 파일 감지 로직 변경 | Medium | 기본 확장자 목록 충분히 포함 |
| 설정 파일 호환성 | Low | 선택적 설정, 기본값 제공 |

### 6.2 Known Limitations

| Limitation | Description | Workaround |
|------------|-------------|------------|
| Issue #9354 | `${CLAUDE_PLUGIN_ROOT}` in command markdown | Use hooks.json instead |
| Mixed projects | JS+Python in same repo | Extension-based detection handles this |

---

## 7. Acceptance Criteria

### Phase 0 Completion
- [ ] 모든 skills/*.md의 `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` 변경
- [ ] 모든 agents/*.md의 `$CLAUDE_PROJECT_DIR` → `${CLAUDE_PLUGIN_ROOT}` 변경
- [ ] 플러그인 설치 후 hooks 정상 동작 확인

### Phase 1-2 Completion
- [ ] `is_source_file()` 함수가 Python, Go, Ruby 프로젝트에서 정상 동작
- [ ] `extract_feature()` 함수가 다양한 디렉토리 구조에서 동작
- [ ] scripts/ 폴더의 중복 코드 제거

### Phase 3 Completion
- [ ] 8가지 테스트 케이스 모두 통과
- [ ] 기존 Next.js 프로젝트 하위 호환성 유지

---

## 8. References

### Official Documentation
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

### Related Issues
- [#9447: CLAUDE_PROJECT_DIR not propagated in plugin hooks](https://github.com/anthropics/claude-code/issues/9447) - ✅ Fixed in v2.0.45
- [#9354: CLAUDE_PLUGIN_ROOT in command markdown](https://github.com/anthropics/claude-code/issues/9354) - Open

### Community Resources
- [Claude Code Guide](https://github.com/zebbern/claude-code-guide)
- [Claude Code Showcase](https://github.com/ChrisWiles/claude-code-showcase)
- [Claude Code Language Support](https://milvus.io/ai-quick-reference/what-programming-languages-does-claude-code-support)
