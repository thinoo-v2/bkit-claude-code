---
name: claude-code-learning
description: |
  Claude Code learning and education skill.
  Teaches users how to configure and optimize Claude Code settings.
  Works across any project and any language.

  "learn" 또는 "setup"으로 학습/설정 시작.

  Use proactively when user is new to Claude Code, asks about configuration,
  or wants to improve their Claude Code setup.

  Triggers: learn claude code, claude code setup, CLAUDE.md, hooks, commands, skills,
  how to configure, 클로드 코드 배우기, 설정 방법, Claude Code 학습,
  クロードコード学習, 设置方法, how do I use claude code

  Do NOT use for: actual coding tasks, debugging, or feature implementation.
argument-hint: "[learn|setup|upgrade] [level]"
agent: claude-code-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/shared/naming-conventions.md
next-skill: null
pdca-phase: null
task-template: "[Learn] Claude Code {level}"
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
---

# Claude Code Learning Skill

> Master Claude Code configuration and optimization

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `learn` | 학습 가이드 시작 | `/claude-code-learning learn 1` |
| `setup` | 설정 자동 생성 | `/claude-code-learning setup` |
| `upgrade` | 최신 기능 안내 | `/claude-code-learning upgrade` |

### learn [level]

레벨별 학습 내용:
- **Level 1**: Basics - CLAUDE.md 작성, Plan Mode 사용
- **Level 2**: Automation - Commands, Hooks, Permission 관리
- **Level 3**: Specialization - Agents, Skills, MCP 연동
- **Level 4**: Team Optimization - GitHub Action, 팀 규칙 표준화
- **Level 5**: PDCA Methodology - bkit 방법론 학습

### setup

현재 프로젝트 분석 후 적절한 설정 자동 생성:
1. CLAUDE.md 분석/생성
2. .claude/ 폴더 구조 확인
3. 필요한 설정 파일 제안

### upgrade

최신 Claude Code 기능 및 모범 사례 안내.

## Learning Levels

### Level 1: Basics (15분)

```markdown
## What is CLAUDE.md?

팀의 공유 지식 저장소입니다. Claude가 실수하면 규칙을 추가하여
같은 실수가 반복되지 않도록 합니다.

## 예시

# Development Workflow

## Package Management
- **Always use `pnpm`** (`npm`, `yarn` 금지)

## Coding Conventions
- `type` 선호, `interface` 지양
- **`enum` 절대 금지** → 문자열 리터럴 유니온 사용

## 금지 사항
- ❌ console.log 금지 (logger 사용)
- ❌ any 타입 금지
```

### Level 2: Automation (30분)

```markdown
## Slash Commands란?

반복적인 일상 작업을 `/command-name`으로 실행.

## Command 위치

.claude/commands/{command-name}.md

## PostToolUse Hook

코드 수정 후 자동 포맷팅:

// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "pnpm format || true"
      }]
    }]
  }
}
```

### Level 3: Specialization (45분)

```markdown
## Sub-agents란?

특정 작업에 특화된 AI 에이전트.

## Skills란?

도메인별 전문 컨텍스트. Claude가 관련 작업 시 자동 참조.

## MCP 연결

.mcp.json으로 외부 도구(Slack, GitHub, Jira 등) 연결.
```

### Level 4: Team Optimization (1시간)

```markdown
## GitHub Action으로 PR 자동화

PR 댓글에서 @claude 멘션하여 자동으로 문서 업데이트.

## 팀 규칙 표준화

1. CLAUDE.md를 Git으로 관리
2. PR 리뷰 시 규칙 추가
3. 팀 지식을 점진적으로 축적
```

### Level 5: PDCA Methodology

```markdown
## PDCA란?

문서 주도 개발 방법론.

Plan → Design → Do → Check → Act

## 폴더 구조

docs/
├── 01-plan/      # 계획
├── 02-design/    # 설계
├── 03-analysis/  # 분석
└── 04-report/    # 보고서

## 자세한 학습

/pdca skill을 사용하여 PDCA 방법론 학습.
```

## Output Format

```
📚 Claude Code Learning Complete!

**Current Level**: {level}
**Learned**: {summary}

🎯 Next Steps:
- Continue learning with /claude-code-learning learn {next_level}
- Auto-generate settings with /claude-code-learning setup
- Check latest trends with /claude-code-learning upgrade
```

## Current Settings Analysis

분석 대상 파일:
- CLAUDE.md (root)
- .claude/settings.local.json
- .claude/commands/
- .claude/agents/
- .claude/skills/
- .mcp.json
