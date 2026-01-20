# Path Portability Fix - Detailed Design Document

> **Summary**: bkit 플러그인의 환경변수 오용 및 하드코딩된 프로젝트 구조 문제 해결을 위한 상세 설계서
>
> **Author**: Claude Code Analysis
> **Created**: 2026-01-20
> **Last Modified**: 2026-01-20
> **Status**: Draft
> **Related Plan**: [07-PATH-PORTABILITY-FIX-PLAN.md](../01-plan/07-PATH-PORTABILITY-FIX-PLAN.md)

---

## 1. Design Overview

### 1.1 Problem Statement

bkit 플러그인에서 발견된 두 가지 심각한 문제:

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **환경변수 오용** | Critical | 플러그인 설치 후 hooks 실행 실패 |
| 2 | **프로젝트 구조 하드코딩** | High | Python, Go, Ruby 등 비-Next.js 프로젝트 미지원 |

### 1.2 Root Cause Analysis

#### Root Cause 1: Design Document Error

`docs/02-BKIT-PLUGIN-DESIGN.md` 섹션 3.4에 잘못된 지침이 있었습니다:

```markdown
> ⚠️ **CRITICAL**: Always use `$CLAUDE_PROJECT_DIR` for file references within plugins.
```

**올바른 지침**:
```markdown
> ⚠️ **CRITICAL**:
> - 플러그인 자체 파일 참조: `${CLAUDE_PLUGIN_ROOT}` 사용
> - 사용자 프로젝트 파일 참조: `$CLAUDE_PROJECT_DIR` 사용
```

#### Root Cause 2: Next.js 중심 설계

bkit 초기 개발 시 Next.js 프로젝트 구조만 고려하여 `src/`, `app/`, `pages/` 등의 폴더를 하드코딩.

### 1.3 Design Principles

bkit의 핵심 설계 철학 (docs/00-03 기반)을 유지하면서 수정:

| Principle | Current | After Fix |
|-----------|---------|-----------|
| **Automation First** | ✅ 유지 | ✅ 다양한 프로젝트에서도 자동화 동작 |
| **No Guessing** | ✅ 유지 | ✅ 알 수 없는 구조도 확장자 기반으로 판단 |
| **Docs = Code** | ✅ 유지 | ✅ PDCA 문서 경로는 사용자 프로젝트 기준 |

---

## 2. Phase 0: Environment Variable Fix (CRITICAL)

### 2.1 Environment Variable Reference

| Variable | Purpose | Scope | Example |
|----------|---------|-------|---------|
| `CLAUDE_PLUGIN_ROOT` | 플러그인 설치 디렉토리 | Plugin hooks, skills, agents | `~/.claude/plugins/cache/bkit/` |
| `CLAUDE_PROJECT_DIR` | 사용자 프로젝트 디렉토리 | 사용자 파일 참조 | `/Users/user/my-app/` |

### 2.2 Usage Guidelines

```
┌─────────────────────────────────────────────────────────────────┐
│                    ${CLAUDE_PLUGIN_ROOT}                         │
│  플러그인의 자체 파일을 참조할 때 사용                              │
│                                                                 │
│  Examples:                                                      │
│  - ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh                   │
│  - ${CLAUDE_PLUGIN_ROOT}/lib/common.sh                          │
│  - ${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    $CLAUDE_PROJECT_DIR                           │
│  사용자 프로젝트의 파일을 참조할 때 사용                            │
│                                                                 │
│  Examples:                                                      │
│  - $CLAUDE_PROJECT_DIR/docs/02-design/                          │
│  - $CLAUDE_PROJECT_DIR/CLAUDE.md                                │
│  - $CLAUDE_PROJECT_DIR/bkit.config.json                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Files Requiring Changes

#### 2.3.1 Skills (8 files)

**File: `skills/bkit-rules/SKILL.md`**

```yaml
# BEFORE (lines 17-23)
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/pre-write.sh"
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/pdca-post-write.sh"

# AFTER
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh"
```

```markdown
<!-- BEFORE (lines 46-49) -->
| Plan | `$CLAUDE_PROJECT_DIR/templates/plan.template.md` |
| Design | `$CLAUDE_PROJECT_DIR/templates/design.template.md` |
| Analysis | `$CLAUDE_PROJECT_DIR/templates/analysis.template.md` |
| Report | `$CLAUDE_PROJECT_DIR/templates/report.template.md` |

<!-- AFTER -->
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` |
```

**File: `skills/bkit-templates/SKILL.md`**

```markdown
<!-- BEFORE (lines 23-28) -->
| Plan | `$CLAUDE_PROJECT_DIR/templates/plan.template.md` | Feature planning |
| Design | `$CLAUDE_PROJECT_DIR/templates/design.template.md` | Technical design |
| Analysis | `$CLAUDE_PROJECT_DIR/templates/analysis.template.md` | Gap analysis |
| Report | `$CLAUDE_PROJECT_DIR/templates/report.template.md` | Completion report |
| Index | `$CLAUDE_PROJECT_DIR/templates/_INDEX.template.md` | Document index |
| CLAUDE | `$CLAUDE_PROJECT_DIR/templates/CLAUDE.template.md` | CLAUDE.md template |

<!-- AFTER -->
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` | Feature planning |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` | Technical design |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` | Gap analysis |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` | Completion report |
| Index | `${CLAUDE_PLUGIN_ROOT}/templates/_INDEX.template.md` | Document index |
| CLAUDE | `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` | CLAUDE.md template |
```

```markdown
<!-- BEFORE (line 103) -->
- `$CLAUDE_PROJECT_DIR/templates/pipeline/` directory

<!-- AFTER -->
- `${CLAUDE_PLUGIN_ROOT}/templates/pipeline/` directory
```

**File: `skills/phase-4-api/SKILL.md`**

```yaml
# BEFORE (line 16)
hooks:
  Stop:
    - hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/phase4-api-stop.sh"

# AFTER
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase4-api-stop.sh"
```

**File: `skills/phase-5-design-system/SKILL.md`**

```yaml
# BEFORE (line 17)
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/phase5-design-post.sh"

# AFTER
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase5-design-post.sh"
```

**File: `skills/phase-6-ui-integration/SKILL.md`**

```yaml
# BEFORE (line 17)
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/phase6-ui-post.sh"

# AFTER
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase6-ui-post.sh"
```

**File: `skills/phase-8-review/SKILL.md`**

```yaml
# BEFORE (line 18)
hooks:
  Stop:
    - hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/phase8-review-stop.sh"

# AFTER
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase8-review-stop.sh"
```

**File: `skills/phase-9-deployment/SKILL.md`**

```yaml
# BEFORE (line 17)
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/phase9-deploy-pre.sh"

# AFTER
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase9-deploy-pre.sh"
```

**File: `skills/zero-script-qa/SKILL.md`**

```yaml
# BEFORE (lines 19, 23)
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/qa-pre-bash.sh"
  Stop:
    - hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/qa-stop.sh"

# AFTER
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
```

#### 2.3.2 Agents (3 files)

**File: `agents/qa-monitor.md`**

```yaml
# BEFORE (line 21)
hooks:
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/qa-monitor-post.sh"

# AFTER
hooks:
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-monitor-post.sh"
```

**File: `agents/design-validator.md`**

```yaml
# BEFORE (line 25)
hooks:
  PreToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/design-validator-pre.sh"

# AFTER
hooks:
  PreToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/design-validator-pre.sh"
```

**File: `agents/gap-detector.md`**

```yaml
# BEFORE (line 34)
hooks:
  PostToolUse:
    - matcher: "Read"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/gap-detector-post.sh"

# AFTER
hooks:
  PostToolUse:
    - matcher: "Read"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-post.sh"
```

#### 2.3.3 Library (1 file)

**File: `lib/common.sh`**

```bash
# BEFORE (line 4)
# Usage: source "$CLAUDE_PROJECT_DIR/lib/common.sh"

# AFTER
# Usage: source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"
```

#### 2.3.4 Documentation (1 file - design doc)

**File: `docs/02-BKIT-PLUGIN-DESIGN.md`**

```markdown
<!-- BEFORE (section 3.4, lines ~329-342) -->
### 3.4 Path Portability

> ⚠️ **CRITICAL**: Always use `$CLAUDE_PROJECT_DIR` for file references within plugins.

```bash
# ✅ Correct
$CLAUDE_PROJECT_DIR/scripts/setup.sh
$CLAUDE_PROJECT_DIR/references/guide.md

# ❌ Incorrect - will break after installation
/Users/kay/plugins/bkit/scripts/setup.sh
```

<!-- AFTER -->
### 3.4 Path Portability

> ⚠️ **CRITICAL**: Use the correct environment variable based on context.

#### For Plugin's Own Files (scripts, templates, lib)
```bash
# ✅ Correct - Plugin files
${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh
${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md
${CLAUDE_PLUGIN_ROOT}/lib/common.sh

# ❌ Incorrect - will not find plugin files
$CLAUDE_PROJECT_DIR/scripts/pre-write.sh
```

#### For User's Project Files (docs, config, source code)
```bash
# ✅ Correct - User project files
$CLAUDE_PROJECT_DIR/docs/02-design/
$CLAUDE_PROJECT_DIR/CLAUDE.md
$CLAUDE_PROJECT_DIR/bkit.config.json

# ❌ Incorrect - plugin doesn't contain user's docs
${CLAUDE_PLUGIN_ROOT}/docs/02-design/
```
```

---

## 3. Phase 1: lib/common.sh Refactoring

### 3.1 is_source_file() Function Redesign

#### Current Implementation (Problem)

```bash
# lib/common.sh:53-64
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

**Issues:**
- Next.js 폴더 구조만 지원
- Python (`myproject/`, `tests/`), Go (`cmd/`, `internal/`, `pkg/`), Ruby 미지원
- Monorepo (`packages/*/src/`) 미지원

#### New Implementation (Solution)

```bash
# lib/common.sh - Redesigned is_source_file()
# Strategy: Negative pattern (exclusion) + Extension-based detection

# Configurable exclude patterns
BKIT_EXCLUDE_PATTERNS="${BKIT_EXCLUDE_PATTERNS:-node_modules .git dist build .next __pycache__ .venv venv coverage .pytest_cache target .cargo vendor}"

# Check if path is a source code file
# Usage: is_source_file "/path/to/file"
# Returns: 0 (true) or 1 (false)
is_source_file() {
    local file_path="$1"

    # 1. Check against exclude patterns (known non-source directories)
    for pattern in $BKIT_EXCLUDE_PATTERNS; do
        [[ "$file_path" == *"$pattern"* ]] && return 1
    done

    # 2. Exclude documentation and configuration files
    [[ "$file_path" == docs/* ]] && return 1
    [[ "$file_path" == *.md ]] && return 1
    [[ "$file_path" == *.json ]] && return 1
    [[ "$file_path" == *.yaml ]] && return 1
    [[ "$file_path" == *.yml ]] && return 1
    [[ "$file_path" == *.toml ]] && return 1
    [[ "$file_path" == *.lock ]] && return 1
    [[ "$file_path" == *.txt ]] && return 1

    # 3. Exclude hidden files and directories (except specific ones)
    [[ "$file_path" == .* ]] && return 1
    [[ "$file_path" == */.* ]] && return 1

    # 4. Check if it's a recognized code file extension
    is_code_file "$file_path"
}

# Enhanced is_code_file() with broader language support
is_code_file() {
    local file_path="$1"

    # JavaScript/TypeScript
    [[ "$file_path" == *.ts ]] || \
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.js ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.mjs ]] || \
    [[ "$file_path" == *.cjs ]] || \
    # Python
    [[ "$file_path" == *.py ]] || \
    [[ "$file_path" == *.pyx ]] || \
    [[ "$file_path" == *.pyi ]] || \
    # Go
    [[ "$file_path" == *.go ]] || \
    # Rust
    [[ "$file_path" == *.rs ]] || \
    # Java/Kotlin
    [[ "$file_path" == *.java ]] || \
    [[ "$file_path" == *.kt ]] || \
    [[ "$file_path" == *.kts ]] || \
    # Ruby
    [[ "$file_path" == *.rb ]] || \
    [[ "$file_path" == *.erb ]] || \
    # PHP
    [[ "$file_path" == *.php ]] || \
    # Swift
    [[ "$file_path" == *.swift ]] || \
    # C/C++
    [[ "$file_path" == *.c ]] || \
    [[ "$file_path" == *.cpp ]] || \
    [[ "$file_path" == *.cc ]] || \
    [[ "$file_path" == *.h ]] || \
    [[ "$file_path" == *.hpp ]] || \
    # C#
    [[ "$file_path" == *.cs ]] || \
    # Scala
    [[ "$file_path" == *.scala ]] || \
    # Elixir
    [[ "$file_path" == *.ex ]] || \
    [[ "$file_path" == *.exs ]] || \
    # Shell
    [[ "$file_path" == *.sh ]] || \
    [[ "$file_path" == *.bash ]] || \
    # Vue/Svelte
    [[ "$file_path" == *.vue ]] || \
    [[ "$file_path" == *.svelte ]]
}
```

### 3.2 extract_feature() Function Enhancement

#### Current Implementation (Problem)

```bash
# lib/common.sh:97-121
extract_feature() {
    local file_path="$1"
    local feature=""

    # Only handles features/ and modules/
    if [[ "$file_path" == *features/* ]]; then
        feature=$(echo "$file_path" | sed -n 's/.*features\/\([^\/]*\).*/\1/p')
    elif [[ "$file_path" == *modules/* ]]; then
        feature=$(echo "$file_path" | sed -n 's/.*modules\/\([^\/]*\).*/\1/p')
    else
        # Fallback is too generic
        feature=$(echo "$file_path" | sed -n 's/.*\/\([^\/]*\)\/[^\/]*$/\1/p')
    fi
    ...
}
```

#### New Implementation (Solution)

```bash
# lib/common.sh - Enhanced extract_feature()
# Supports multiple project structures: Next.js, Python, Go, Ruby, Monorepo

# Configurable feature directory patterns
BKIT_FEATURE_PATTERNS="${BKIT_FEATURE_PATTERNS:-features modules packages apps services domains}"

extract_feature() {
    local file_path="$1"
    local feature=""

    # 1. Try configured feature patterns first
    for pattern in $BKIT_FEATURE_PATTERNS; do
        if [[ "$file_path" == *"$pattern"/* ]]; then
            feature=$(echo "$file_path" | sed -n "s/.*$pattern\/\([^\/]*\).*/\1/p")
            [ -n "$feature" ] && break
        fi
    done

    # 2. Try common directory structures
    if [ -z "$feature" ]; then
        # Python: app/routers/auth.py → auth
        if [[ "$file_path" == */routers/* ]] || [[ "$file_path" == */views/* ]] || [[ "$file_path" == */controllers/* ]]; then
            feature=$(basename "$file_path" | sed 's/\.[^.]*$//')
        # Go: internal/auth/handler.go → auth
        elif [[ "$file_path" == */internal/* ]]; then
            feature=$(echo "$file_path" | sed -n 's/.*internal\/\([^\/]*\).*/\1/p')
        # Go: cmd/server/main.go → server
        elif [[ "$file_path" == */cmd/* ]]; then
            feature=$(echo "$file_path" | sed -n 's/.*cmd\/\([^\/]*\).*/\1/p')
        # Ruby: app/models/user.rb → models (or user)
        elif [[ "$file_path" == */models/* ]] || [[ "$file_path" == */controllers/* ]]; then
            feature=$(basename "$file_path" | sed 's/\.[^.]*$//')
        fi
    fi

    # 3. Fallback: use parent directory name
    if [ -z "$feature" ]; then
        feature=$(echo "$file_path" | sed -n 's/.*\/\([^\/]*\)\/[^\/]*$/\1/p')
        [ -z "$feature" ] && feature=$(basename "$(dirname "$file_path")")
    fi

    # 4. Filter out generic directory names
    case "$feature" in
        src|lib|app|components|pages|utils|hooks|types|".")
            echo ""
            ;;
        internal|cmd|pkg|models|views|routers|controllers|services)
            echo ""
            ;;
        *)
            echo "$feature"
            ;;
    esac
}
```

### 3.3 Configuration Support via bkit.config.json

```json
// bkit.config.json - User can customize patterns
{
  "sourcePatterns": {
    "exclude": [
      "node_modules",
      ".git",
      "vendor",
      "third_party",
      "my_custom_exclude"
    ],
    "featurePatterns": [
      "features",
      "modules",
      "packages",
      "my_custom_features"
    ],
    "codeExtensions": [
      ".ts", ".tsx", ".js", ".jsx",
      ".py", ".go", ".rs",
      ".custom_extension"
    ]
  }
}
```

---

## 4. Phase 2: Scripts Refactoring

### 4.1 scripts/pre-write.sh Updates

**Current Issue**: Duplicate source file checking logic

```bash
# scripts/pre-write.sh - Update lib source path
# BEFORE (line 10)
source "${LIB_DIR}/common.sh"

# This already correctly uses LIB_DIR relative to script
# No change needed here, but verify LIB_DIR calculation
```

### 4.2 scripts/pdca-post-write.sh Updates

Verify it uses `is_source_file()` from `lib/common.sh` instead of inline patterns.

### 4.3 scripts/phase5-design-post.sh Updates

```bash
# BEFORE: Hardcoded UI component paths
if [[ "$FILE_PATH" == */components/* ]] || [[ "$FILE_PATH" == */ui/* ]]; then

# AFTER: Use extension + any component-like path
is_ui_file() {
    local file_path="$1"

    # Check for common UI file patterns
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.vue ]] || \
    [[ "$file_path" == *.svelte ]]
}

if is_ui_file "$FILE_PATH"; then
```

### 4.4 scripts/phase6-ui-post.sh Updates

Similar changes as phase5-design-post.sh.

---

## 5. Implementation Sequence

### 5.1 Execution Order

```
Phase 0 (Critical - Day 1)
├── 0.1 Update skills/bkit-rules/SKILL.md
├── 0.2 Update skills/bkit-templates/SKILL.md
├── 0.3 Update skills/phase-4-api/SKILL.md
├── 0.4 Update skills/phase-5-design-system/SKILL.md
├── 0.5 Update skills/phase-6-ui-integration/SKILL.md
├── 0.6 Update skills/phase-8-review/SKILL.md
├── 0.7 Update skills/phase-9-deployment/SKILL.md
├── 0.8 Update skills/zero-script-qa/SKILL.md
├── 0.9 Update agents/qa-monitor.md
├── 0.10 Update agents/design-validator.md
├── 0.11 Update agents/gap-detector.md
├── 0.12 Update lib/common.sh (comment)
└── 0.13 Update docs/02-BKIT-PLUGIN-DESIGN.md (section 3.4)

Phase 1 (High Priority - Day 2)
├── 1.1 Refactor is_source_file() in lib/common.sh
├── 1.2 Refactor extract_feature() in lib/common.sh
├── 1.3 Add new is_ui_file() helper
└── 1.4 Add BKIT_EXCLUDE_PATTERNS, BKIT_FEATURE_PATTERNS support

Phase 2 (Medium Priority - Day 2-3)
├── 2.1 Update scripts/pdca-post-write.sh
├── 2.2 Update scripts/phase5-design-post.sh
└── 2.3 Update scripts/phase6-ui-post.sh

Phase 3 (Testing - Day 3)
├── 3.1 Test with Next.js project
├── 3.2 Test with Python project
├── 3.3 Test with Go project
├── 3.4 Test with Monorepo
└── 3.5 Regression test (existing functionality)
```

### 5.2 Commit Strategy

```bash
# Commit 1: Phase 0 - Environment variable fixes
git commit -m "fix: correct environment variable usage in skills and agents

- Replace \$CLAUDE_PROJECT_DIR with \${CLAUDE_PLUGIN_ROOT} for plugin files
- Update 8 skills, 3 agents, 1 lib comment
- Update design document section 3.4 with correct guidance

Fixes plugin hooks failing after installation"

# Commit 2: Phase 1 - lib/common.sh refactoring
git commit -m "refactor: improve source file detection for multi-language support

- Redesign is_source_file() with negative pattern + extension-based detection
- Enhance extract_feature() for Python, Go, Ruby, Monorepo structures
- Add configurable BKIT_EXCLUDE_PATTERNS and BKIT_FEATURE_PATTERNS

Supports Python, Go, Rust, Ruby projects"

# Commit 3: Phase 2 - Scripts refactoring
git commit -m "refactor: remove hardcoded patterns from scripts

- Update phase5-design-post.sh to use is_ui_file()
- Update phase6-ui-post.sh to use extension-based detection
- DRY principle: reuse lib/common.sh functions"

# Commit 4: Phase 3 - Testing and docs
git commit -m "test: add multi-language project support verification

- Add test cases for Next.js, Python, Go, Ruby
- Update documentation with testing results"
```

---

## 6. Testing Plan

### 6.1 Unit Tests

| Test ID | Function | Input | Expected Output |
|---------|----------|-------|-----------------|
| T1.1 | `is_source_file` | `src/app.ts` | true |
| T1.2 | `is_source_file` | `node_modules/pkg.js` | false |
| T1.3 | `is_source_file` | `myapp/main.py` | true |
| T1.4 | `is_source_file` | `internal/auth/handler.go` | true |
| T1.5 | `is_source_file` | `docs/README.md` | false |
| T1.6 | `is_code_file` | `test.ts` | true |
| T1.7 | `is_code_file` | `test.py` | true |
| T1.8 | `is_code_file` | `test.go` | true |
| T1.9 | `is_code_file` | `test.md` | false |
| T2.1 | `extract_feature` | `src/features/auth/login.ts` | `auth` |
| T2.2 | `extract_feature` | `internal/auth/handler.go` | `auth` |
| T2.3 | `extract_feature` | `app/routers/users.py` | `users` |
| T2.4 | `extract_feature` | `packages/ui/src/Button.tsx` | `ui` |

### 6.2 Integration Tests

| Test ID | Project Type | Files | Expected Behavior |
|---------|--------------|-------|-------------------|
| I1 | Next.js App Router | `app/page.tsx` | PDCA hooks triggered |
| I2 | Next.js Pages Router | `pages/index.tsx` | PDCA hooks triggered |
| I3 | Python Django | `myapp/views.py` | PDCA hooks triggered |
| I4 | Python FastAPI | `main.py` | PDCA hooks triggered |
| I5 | Go Standard | `cmd/server/main.go` | PDCA hooks triggered |
| I6 | Go Internal | `internal/auth/auth.go` | Feature detected as `auth` |
| I7 | Rust Cargo | `src/main.rs` | PDCA hooks triggered |
| I8 | Monorepo | `packages/api/src/index.ts` | Feature detected as `api` |
| I9 | Ruby on Rails | `app/models/user.rb` | Feature detected as `user` |

### 6.3 Regression Tests

| Test ID | Scenario | Expected |
|---------|----------|----------|
| R1 | Plugin installation | hooks.json paths work |
| R2 | SessionStart hook | session-start.sh executes |
| R3 | PreToolUse Write hook | pre-write.sh executes |
| R4 | PostToolUse Write hook | pdca-post-write.sh executes |
| R5 | Existing Next.js project | No behavior change |

---

## 7. Rollback Plan

### 7.1 If Phase 0 Fails

```bash
# Revert to previous commit
git revert HEAD

# Or restore specific files
git checkout HEAD~1 -- skills/ agents/ lib/common.sh
```

### 7.2 If Phase 1-2 Fails

환경변수 수정 (Phase 0)은 유지하고, lib/common.sh만 롤백:

```bash
# Keep Phase 0, revert Phase 1-2
git checkout HEAD~1 -- lib/common.sh scripts/
```

---

## 8. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-20 | Initial design document | Claude |

---

## Related Documents

- Plan: [07-PATH-PORTABILITY-FIX-PLAN.md](../01-plan/07-PATH-PORTABILITY-FIX-PLAN.md)
- Architecture: [00-ARCHITECTURE.md](../00-ARCHITECTURE.md)
- Plugin Design: [02-BKIT-PLUGIN-DESIGN.md](../02-BKIT-PLUGIN-DESIGN.md)
- Features: [03-BKIT-FEATURES.md](../03-BKIT-FEATURES.md)
