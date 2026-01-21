# bkit Plugin v1.2.3 Enhancement Plan

> **Summary**: Claude Code 2.1.14 기능을 최대한 활용한 bkit 플러그인 고도화 계획
>
> **Project**: bkit Claude Code Plugin
> **Current Version**: 1.2.2
> **Target Version**: 1.2.3
> **Author**: POPUP STUDIO
> **Date**: 2026-01-21
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Claude Code 2.1.14의 새로운 기능(컨텍스트 확장, 병렬 에이전트 안정화, 메모리 누수 수정)을 활용하여 bkit 플러그인의 핵심 가치인 PDCA 자동화와 AI-Native 개발 경험을 한 단계 끌어올린다.

### 1.2 Background

**현재 상태 (v1.2.2)**:

| 영역 | 점수 | 상태 |
|-----|:----:|------|
| Context Engineering | 85/100 | Good |
| Memory/State Management | 70/100 | **Improvement Needed** |
| Plugin Architecture | 92/100 | Excellent |
| Error Handling | 75/100 | Moderate |
| Testability | 65/100 | **Improvement Needed** |
| **Overall** | **82/100** | Good |

**Claude Code 2.1.14 기회 요소**:

```
┌─────────────────────────────────────────────────────────────┐
│                 Claude Code 2.1.14 Opportunities             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ▲ Context Window: 65% → 98% (+33% usable space)            │
│  ▲ Parallel Agents: Crash-free concurrent execution         │
│  ▲ Memory Stability: No leaks in long sessions              │
│  ▲ Version Pinning: SHA-based exact version control         │
│  ▲ Command Autocomplete: 18 bkit commands correctly work    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Related Documents

- Analysis: [10-software-engineering-perspective-analysis.md](../03-analysis/10-software-engineering-perspective-analysis.md)
- Impact Analysis: [11-claude-code-2.1.14-impact-analysis.md](../03-analysis/11-claude-code-2.1.14-impact-analysis.md)
- System Docs: [bkit-system/README.md](../../../bkit-system/README.md)

---

## 2. Scope

### 2.1 In Scope

- [ ] **Memory System**: Episodic/Semantic/Procedural 3-tier 메모리 구현
- [ ] **Context Optimization**: 확장된 컨텍스트 윈도우 최대 활용
- [ ] **Parallel Agent Architecture**: 병렬 에이전트 실행 패턴 도입
- [ ] **Testing Infrastructure**: 자동화된 테스트 파이프라인 구축
- [ ] **Error Handling Enhancement**: 재시도 로직, 구조화된 로깅
- [ ] **Version Pinning Support**: Enterprise 배포 안정성 강화

### 2.2 Out of Scope

- Claude Code 코어 기능 변경 (플러그인 범위 외)
- 새로운 Level 추가 (Starter/Dynamic/Enterprise 유지)
- MCP 서버 통합 확장 (bkend.ai 이외)
- 새로운 언어 Tier 추가 (현재 4-tier + experimental 유지)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status | Target Score |
|----|-------------|:--------:|:------:|:------------:|
| FR-01 | 3-tier Memory System 구현 | Critical | Pending | 70→85 |
| FR-02 | Context Pre-loading 메커니즘 | High | Pending | 85→92 |
| FR-03 | Parallel Agent Orchestration | High | Pending | New |
| FR-04 | Hook 자동화 테스트 | High | Pending | 65→80 |
| FR-05 | 구조화된 에러 로깅 | Medium | Pending | 75→85 |
| FR-06 | 버전 고정 가이드 문서화 | Medium | Pending | New |
| FR-07 | SessionStart 컨텍스트 확장 | Medium | Pending | 85→90 |
| FR-08 | Resource Cleanup 메커니즘 | Low | Pending | New |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Hook 실행 < 500ms | timeout 모니터링 |
| Stability | 장시간 세션 (2h+) 안정성 | Memory 사용량 추적 |
| Compatibility | Claude Code 2.1.12+ 호환 | 버전별 테스트 |
| Maintainability | 코드 커버리지 > 60% | Jest/Bash 테스트 |

---

## 4. Enhancement Domains

### 4.1 Domain 1: Memory System (Priority: Critical)

**현재 상태**: 세션 환경 변수 + `.pdca-status.json`만 사용 (70/100)

**목표**: 3-tier 메모리 아키텍처 구현 (85/100)

```
docs/.bkit-memory/
├── episodic/                    # 과거 경험 기록
│   ├── cycles/                  # PDCA 사이클 이력
│   │   └── {feature}.history.json
│   ├── sessions/                # 세션 요약
│   │   └── {date}.summary.json
│   └── decisions/               # 아키텍처 결정 기록
│       └── {topic}.decision.json
│
├── semantic/                    # 학습된 패턴
│   ├── conventions.learned.json # 프로젝트 컨벤션 패턴
│   ├── architecture.patterns.json # 아키텍처 패턴
│   ├── common-issues.json       # 빈번한 이슈와 해결책
│   └── tier-preferences.json    # 언어/도구 선호도
│
└── procedural/                  # 성공한 워크플로우
    ├── workflows.json           # 검증된 워크플로우
    ├── templates.usage.json     # 템플릿 사용 통계
    └── agent.effectiveness.json # 에이전트별 효과성
```

**구현 계획**:

| Phase | Task | 영향 범위 | 예상 효과 |
|:-----:|------|----------|----------|
| 1 | Episodic memory 스키마 정의 | New files | PDCA 이력 추적 |
| 2 | SessionStart hook 확장 | `session-start.sh` | 이전 세션 context 로드 |
| 3 | PostToolUse에 학습 로직 추가 | `pdca-post-write.sh` | 성공 패턴 저장 |
| 4 | Semantic memory 쿼리 API | `lib/common.sh` | 패턴 재사용 |
| 5 | Procedural memory 통계 | New script | 워크플로우 최적화 |

**Episodic Memory Schema**:

```json
// docs/.bkit-memory/episodic/cycles/{feature}.history.json
{
  "feature": "auth",
  "cycles": [
    {
      "cycleId": "auth-2026-01-20-001",
      "phase": "Check",
      "startedAt": "2026-01-20T10:00:00Z",
      "completedAt": "2026-01-20T14:00:00Z",
      "documents": {
        "plan": "docs/pdca/01-plan/auth.plan.md",
        "design": "docs/pdca/02-design/auth.design.md",
        "analysis": "docs/pdca/03-analysis/auth.analysis.md"
      },
      "metrics": {
        "matchRate": 92,
        "issuesFound": 3,
        "issuesResolved": 3
      },
      "learnings": [
        "JWT refresh token 로직은 middleware에서 처리",
        "Rate limiting은 API route 레벨에서 적용"
      ]
    }
  ],
  "summary": {
    "totalCycles": 3,
    "averageMatchRate": 89,
    "commonPatterns": ["middleware-first-auth", "token-refresh-strategy"]
  }
}
```

**Semantic Memory Schema**:

```json
// docs/.bkit-memory/semantic/conventions.learned.json
{
  "project": "my-saas-app",
  "level": "Dynamic",
  "detectedAt": "2026-01-15T09:00:00Z",
  "updatedAt": "2026-01-21T15:00:00Z",
  "patterns": {
    "naming": {
      "components": "PascalCase",
      "hooks": "useCamelCase",
      "services": "camelCase.service.ts",
      "confidence": 0.95
    },
    "structure": {
      "featureModules": true,
      "servicesLayer": true,
      "sharedComponents": "src/components/ui/",
      "confidence": 0.92
    },
    "imports": {
      "order": ["react", "next", "external", "internal", "relative"],
      "aliasPrefix": "@/",
      "confidence": 0.88
    }
  },
  "antiPatterns": [
    {
      "pattern": "Direct API calls in components",
      "alternative": "Use services layer",
      "occurrences": 5,
      "fixed": 5
    }
  ]
}
```

---

### 4.2 Domain 2: Context Optimization (Priority: High)

**현재 상태**: Task classification 기반 차등 context 주입 (85/100)

**목표**: 확장된 컨텍스트 윈도우 최대 활용 (92/100)

**개선 전략**:

```
┌─────────────────────────────────────────────────────────────┐
│              Context Loading Strategy v1.2.3                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SessionStart (Once):                                        │
│  ├─ Load CLAUDE.md (project conventions)                    │
│  ├─ Load .pdca-status.json (current state)                  │
│  ├─ Load semantic memory (learned patterns)                 │
│  └─ Pre-seed top 3 relevant templates                       │
│                                                              │
│  PreToolUse (Per Operation):                                 │
│  ├─ Quick Fix: Minimal context (conventions only)           │
│  ├─ Minor Change: + related file patterns                   │
│  ├─ Feature: + design doc reference                         │
│  └─ Major Feature: + full design + episodic memory          │
│                                                              │
│  PostToolUse (Learning):                                     │
│  └─ Update semantic memory with successful patterns         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**구현 변경**:

| File | 변경 내용 |
|------|----------|
| `hooks/session-start.sh` | Memory system 로드 로직 추가 |
| `scripts/pre-write.sh` | 컨텍스트 로딩 전략 확장 |
| `lib/common.sh` | `load_context_by_task_size()` 함수 추가 |
| `bkit.config.json` | 컨텍스트 로딩 설정 추가 |

**새로운 Config 항목**:

```json
{
  "contextLoading": {
    "sessionStart": {
      "loadProjectConventions": true,
      "loadSemanticMemory": true,
      "preloadTemplateCount": 3
    },
    "taskBased": {
      "quickFix": {
        "includeConventions": true,
        "includeDesignDoc": false,
        "includeMemory": false
      },
      "feature": {
        "includeConventions": true,
        "includeDesignDoc": true,
        "includeMemory": true,
        "memoryDepth": 3
      },
      "majorFeature": {
        "includeConventions": true,
        "includeDesignDoc": true,
        "includeMemory": true,
        "includeEpisodicHistory": true,
        "memoryDepth": 5
      }
    }
  }
}
```

---

### 4.3 Domain 3: Parallel Agent Architecture (Priority: High)

**현재 상태**: 순차적 에이전트 실행만 지원

**목표**: Claude Code 2.1.14 병렬 에이전트 안정화 활용

**Parallel Review Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                 /pdca-review-parallel {feature}              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Preparation (Sequential)                          │
│  └─ Load code + design + analysis files                     │
│                                                              │
│  Phase 2: Parallel Analysis                                  │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ code-analyzer│design-validtr│ gap-detector │            │
│  │   (quality)  │   (spec)     │   (delta)    │            │
│  └──────┬───────┴──────┬───────┴──────┬───────┘            │
│         │              │              │                     │
│         ▼              ▼              ▼                     │
│  ┌─────────────────────────────────────────────┐           │
│  │           Results Aggregation               │           │
│  └─────────────────────────────────────────────┘           │
│                                                              │
│  Phase 3: Unified Report Generation                         │
│  └─ report-generator combines all findings                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**새로운 Command 정의**:

```yaml
# commands/pdca-review-parallel.md
---
description: Run parallel code review with multiple agents
allowed-tools: ["Task", "Read", "Glob", "Grep"]
---

# Parallel PDCA Review

Run the following agents IN PARALLEL using a single Task tool call with multiple agent invocations:

1. **code-analyzer**: Code quality and security check
2. **design-validator**: Design document validation
3. **gap-detector**: Design-implementation gap analysis

After all agents complete, use **report-generator** to create unified report.

## Expected Output
- Unified review report in `docs/pdca/03-analysis/{feature}.review.md`
- Individual agent findings preserved
- Aggregated metrics and recommendations
```

**Agent Orchestration Updates**:

| Agent | Parallelizable | Model | Notes |
|-------|:--------------:|:-----:|-------|
| code-analyzer | Yes | sonnet | Read-only, safe for parallel |
| design-validator | Yes | sonnet | Read-only, safe for parallel |
| gap-detector | Yes | sonnet | Read-only, safe for parallel |
| qa-monitor | No | sonnet | Requires sequential bash execution |
| pdca-iterator | No | opus | Writes files, must be sequential |
| report-generator | No | sonnet | Aggregates results, runs last |

---

### 4.4 Domain 4: Testing Infrastructure (Priority: High)

**현재 상태**: 수동 체크리스트만 존재 (65/100)

**목표**: 자동화된 테스트 파이프라인 구축 (80/100)

**테스트 아키텍처**:

```
tests/
├── unit/
│   ├── common.test.sh           # lib/common.sh 함수 테스트
│   ├── config.test.sh           # bkit.config.json 검증
│   └── memory.test.sh           # Memory system 테스트
│
├── integration/
│   ├── hook-pretooluse.test.sh  # PreToolUse hook 통합 테스트
│   ├── hook-posttooluse.test.sh # PostToolUse hook 통합 테스트
│   └── hook-sessionstart.test.sh# SessionStart hook 통합 테스트
│
├── e2e/
│   ├── pdca-workflow.test.sh    # 전체 PDCA 워크플로우
│   ├── level-detection.test.sh  # Level 감지 정확성
│   └── parallel-agents.test.sh  # 병렬 에이전트 안정성
│
├── fixtures/
│   ├── sample-project-starter/  # Starter 레벨 샘플
│   ├── sample-project-dynamic/  # Dynamic 레벨 샘플
│   └── sample-project-enterprise/ # Enterprise 레벨 샘플
│
└── run-tests.sh                 # 테스트 실행 스크립트
```

**GitHub Actions Workflow**:

```yaml
# .github/workflows/plugin-validation.yml
name: Plugin Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate-structure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate plugin structure
        run: ./scripts/validate-plugin.sh

  test-hooks:
    runs-on: ubuntu-latest
    needs: validate-structure
    steps:
      - uses: actions/checkout@v4
      - name: Install jq
        run: sudo apt-get install -y jq
      - name: Run unit tests
        run: ./tests/run-tests.sh unit
      - name: Run integration tests
        run: ./tests/run-tests.sh integration

  test-multi-platform:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    needs: test-hooks
    steps:
      - uses: actions/checkout@v4
      - name: Run cross-platform tests
        run: ./tests/run-tests.sh e2e
```

**테스트 케이스 예시**:

```bash
# tests/unit/common.test.sh

#!/bin/bash
source "$(dirname "$0")/../../lib/common.sh"

test_is_source_file() {
    # Positive cases
    assert_true "is_source_file 'src/index.ts'" "TypeScript should be source"
    assert_true "is_source_file 'app/page.tsx'" "TSX should be source"
    assert_true "is_source_file 'lib/utils.py'" "Python should be source"

    # Negative cases
    assert_false "is_source_file 'node_modules/pkg/index.js'" "node_modules excluded"
    assert_false "is_source_file 'README.md'" "Markdown not source"
    assert_false "is_source_file 'package.json'" "Config not source"
}

test_classify_task() {
    assert_equals "$(classify_task 30)" "quick_fix"
    assert_equals "$(classify_task 100)" "minor_change"
    assert_equals "$(classify_task 500)" "feature"
    assert_equals "$(classify_task 1500)" "major_feature"
}

test_extract_feature() {
    assert_equals "$(extract_feature 'src/features/auth/login.ts')" "auth"
    assert_equals "$(extract_feature 'app/(dashboard)/settings/page.tsx')" "settings"
    assert_equals "$(extract_feature 'components/ui/Button.tsx')" "ui"
}

# Run tests
run_test_suite
```

---

### 4.5 Domain 5: Error Handling Enhancement (Priority: Medium)

**현재 상태**: `set -e` + block 메커니즘 (75/100)

**목표**: 재시도 로직 + 구조화된 로깅 (85/100)

**lib/common.sh 확장**:

```bash
# Error handling utilities

# Retry with exponential backoff
retry_with_backoff() {
    local max_attempts="${1:-3}"
    local delay="${2:-1}"
    shift 2
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if "$@"; then
            return 0
        fi

        log_warning "Attempt $attempt failed, retrying in ${delay}s..."
        sleep $delay
        delay=$((delay * 2))
        attempt=$((attempt + 1))
    done

    log_error "All $max_attempts attempts failed for: $*"
    return 1
}

# Structured logging
log_error() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local log_file="${CLAUDE_PROJECT_DIR:-.}/.bkit-errors.log"

    echo "{\"level\":\"error\",\"timestamp\":\"$timestamp\",\"message\":\"$message\"}" >> "$log_file"
    echo "ERROR: $message" >&2
}

log_warning() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local log_file="${CLAUDE_PROJECT_DIR:-.}/.bkit-warnings.log"

    echo "{\"level\":\"warning\",\"timestamp\":\"$timestamp\",\"message\":\"$message\"}" >> "$log_file"
}

log_info() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ "${BKIT_DEBUG:-false}" = "true" ]; then
        echo "INFO [$timestamp]: $message" >&2
    fi
}

# Resource cleanup
cleanup_resources() {
    # Clear temporary files
    rm -f "${CLAUDE_PROJECT_DIR:-.}/.bkit-temp-"* 2>/dev/null || true

    # Truncate large log files (keep last 1000 lines)
    for log in .bkit-errors.log .bkit-warnings.log; do
        if [ -f "${CLAUDE_PROJECT_DIR:-.}/$log" ]; then
            tail -n 1000 "${CLAUDE_PROJECT_DIR:-.}/$log" > "${CLAUDE_PROJECT_DIR:-.}/$log.tmp"
            mv "${CLAUDE_PROJECT_DIR:-.}/$log.tmp" "${CLAUDE_PROJECT_DIR:-.}/$log"
        fi
    done
}

# Fallback config reader (when jq unavailable)
get_config_fallback() {
    local key="$1"
    local default="$2"
    local config_file="${BKIT_CONFIG:-bkit.config.json}"

    if command -v jq &> /dev/null; then
        jq -r "$key // \"$default\"" "$config_file" 2>/dev/null || echo "$default"
    else
        # Fallback to grep/sed for basic extraction
        grep -o "\"${key##*.}\":[^,}]*" "$config_file" 2>/dev/null | \
            sed 's/.*:\s*"\?\([^",}]*\)"\?.*/\1/' || echo "$default"
    fi
}
```

**Stop Hook에 Cleanup 추가**:

```bash
# hooks/session-cleanup.sh (새 파일)
#!/bin/bash
set -e
source "$(dirname "$0")/../lib/common.sh"

# Session end cleanup
cleanup_resources

# Generate session summary for episodic memory
if [ -f "${CLAUDE_PROJECT_DIR:-.}/.bkit-session-log" ]; then
    summarize_session
fi

echo "Session cleanup completed"
```

---

### 4.6 Domain 6: Version Pinning Support (Priority: Medium)

**현재 상태**: 버전 고정 미지원

**목표**: Enterprise 배포를 위한 SHA 기반 버전 고정

**문서화 추가**:

```markdown
# docs/guides/version-pinning.md

## bkit Version Pinning Guide

### For Enterprise Teams

Claude Code 2.1.14부터 플러그인 버전을 특정 commit SHA로 고정할 수 있습니다.

### Version History

| Version | Commit SHA | Release Date | Notes |
|---------|-----------|--------------|-------|
| 1.2.3 | (pending) | 2026-02-xx | Memory system, parallel agents |
| 1.2.2 | 7012e1c | 2026-01-20 | Bug fixes |
| 1.2.1 | cbe7d77 | 2026-01-18 | Multi-language support |
| 1.2.0 | (lookup) | 2026-01-15 | Unified hooks |

### Installation with Version Pinning

\`\`\`bash
# Install specific version
claude plugins install popup-studio-ai/bkit-claude-code@7012e1c

# Or in settings.json
{
  "plugins": [
    {
      "name": "bkit",
      "repository": "popup-studio-ai/bkit-claude-code",
      "commit": "7012e1c"
    }
  ]
}
\`\`\`

### Team Synchronization

1. Determine stable version for team
2. Add to shared `.claude/settings.json`
3. Commit to repository
4. All team members get same version
```

**CHANGELOG 업데이트 정책**:

```markdown
# CHANGELOG.md 형식

## [1.2.3] - 2026-02-xx
**Commit**: {SHA}

### Added
- 3-tier Memory System (episodic/semantic/procedural)
- Parallel agent orchestration
- Automated testing infrastructure

### Changed
- Context loading strategy for 2.1.14 compatibility
- Enhanced error handling with retry logic

### Fixed
- (list fixes)
```

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] 모든 Functional Requirements 구현 완료
- [ ] Memory System 3-tier 구조 동작 확인
- [ ] Parallel agent 실행 안정성 검증
- [ ] 자동화 테스트 통과율 90% 이상
- [ ] 문서 업데이트 완료
- [ ] Code review 완료
- [ ] v1.2.3 릴리스 태그 생성

### 5.2 Quality Criteria

| Metric | Current | Target | Measurement |
|--------|:-------:|:------:|-------------|
| Overall Score | 82/100 | 88/100 | 5-domain evaluation |
| Memory Score | 70/100 | 85/100 | Memory system completeness |
| Test Coverage | ~0% | 60%+ | `run-tests.sh` results |
| Hook Latency | ~1s | <500ms | Performance monitoring |
| Error Recovery | Manual | Auto | Retry success rate |

### 5.3 Measurable Improvements

```
┌─────────────────────────────────────────────────────────────┐
│                 Expected Improvements                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Before (v1.2.2)              After (v1.2.3)                │
│  ─────────────────            ─────────────────             │
│  Memory: 70/100       ──→     Memory: 85/100  (+15)         │
│  Testing: 65/100      ──→     Testing: 80/100 (+15)         │
│  Error: 75/100        ──→     Error: 85/100   (+10)         │
│  Context: 85/100      ──→     Context: 92/100 (+7)          │
│  Architecture: 92/100 ──→     Architecture: 94/100 (+2)     │
│                                                              │
│  Overall: 82/100      ──→     Overall: 88/100 (+6)          │
│                                                              │
│  + New: Parallel Agents, Version Pinning                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Memory system 성능 저하 | High | Medium | Lazy loading, 캐싱 적용 |
| Parallel agent 불안정 | High | Low | 2.1.14에서 수정됨, fallback 준비 |
| 테스트 작성 시간 과다 | Medium | High | 핵심 기능 우선, 점진적 확장 |
| 하위 호환성 문제 | Medium | Low | 2.1.12+ 버전 테스트 |
| Config 스키마 변경 충돌 | Medium | Medium | Migration script 제공 |

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)

```
Priority: Critical/High items foundation

Tasks:
├── Memory System schema 정의
├── lib/common.sh 확장 (error handling, logging)
├── bkit.config.json 스키마 확장
├── 기본 테스트 인프라 구축
└── tests/unit/ 작성
```

### Phase 2: Core Features (Week 3-4)

```
Priority: Memory + Context implementation

Tasks:
├── Episodic memory 구현 (SessionStart hook 확장)
├── Semantic memory 구현 (PostToolUse 학습 로직)
├── Context loading 전략 적용
├── tests/integration/ 작성
└── 문서 업데이트
```

### Phase 3: Advanced Features (Week 5-6)

```
Priority: Parallel agents + Testing

Tasks:
├── /pdca-review-parallel 명령 구현
├── Agent orchestration 로직
├── tests/e2e/ 작성
├── GitHub Actions 워크플로우
└── Performance 최적화
```

### Phase 4: Finalization (Week 7-8)

```
Priority: Polish + Release

Tasks:
├── Version pinning 문서화
├── Migration guide 작성
├── CHANGELOG 업데이트
├── 전체 테스트 실행
├── v1.2.3 릴리스
└── Marketplace 업데이트
```

---

## 8. Architecture Considerations

### 8.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation | High-traffic systems | ☐ |

bkit 플러그인 자체는 **Dynamic** 레벨로 분류됩니다.

### 8.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Memory Storage | JSON files / SQLite | JSON files | 간단함, 이식성, Claude Code 호환 |
| Test Framework | Bats / Custom bash | Custom bash | 의존성 최소화 |
| Parallel Execution | Task tool / Custom | Task tool | Claude Code 네이티브 지원 |
| Logging Format | Plain text / JSON | JSON | 구조화된 분석 가능 |

### 8.3 File Changes Overview

```
Changed Files Summary:
─────────────────────────────────────────────────────────────
lib/
└── common.sh                    [MODIFY] +150 lines

hooks/
├── session-start.sh            [MODIFY] Memory loading
└── session-cleanup.sh          [NEW] Resource cleanup

scripts/
├── pre-write.sh                [MODIFY] Context strategy
└── pdca-post-write.sh          [MODIFY] Learning logic

commands/
└── pdca-review-parallel.md     [NEW] Parallel review

tests/
├── unit/*.test.sh              [NEW] Unit tests
├── integration/*.test.sh       [NEW] Integration tests
├── e2e/*.test.sh               [NEW] E2E tests
└── run-tests.sh                [NEW] Test runner

docs/
├── .bkit-memory/               [NEW] Memory structure
│   ├── episodic/
│   ├── semantic/
│   └── procedural/
└── guides/version-pinning.md   [NEW] Version guide

.github/
└── workflows/plugin-validation.yml [NEW] CI/CD

bkit.config.json                [MODIFY] New config sections
plugin.json                     [MODIFY] Version bump
CHANGELOG.md                    [MODIFY] Release notes
─────────────────────────────────────────────────────────────
```

---

## 9. Next Steps

1. [ ] 팀 리뷰 및 승인
2. [ ] Design document 작성 (`11-bkit-enhancement-design-v1.2.3.md`)
3. [ ] Phase 1 구현 시작
4. [ ] 주간 진행 상황 체크 (`/pdca-status`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-21 | Initial draft | Claude + POPUP STUDIO |
