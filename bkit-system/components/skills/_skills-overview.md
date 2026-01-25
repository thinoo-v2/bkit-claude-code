# Skills Overview

> 18 Skills defined in bkit (v1.4.1)
>
> **v1.4.1**: Context Engineering 관점 추가 - 도메인 지식 계층
> **v1.4.0**: Dual Platform Support (Claude Code + Gemini CLI)

## What are Skills?

Skills are **domain-specific expert knowledge** components.
- Context that Claude references during specific tasks
- Automated behavior via frontmatter hooks
- Auto-activation via "Triggers:" keywords in description

## Context Engineering 관점 (v1.4.1)

Skills는 bkit의 **Domain Knowledge Layer**를 구성하며, [[../../philosophy/context-engineering|Context Engineering]] 원칙에 따라 설계되었습니다.

### Skill Context Engineering 패턴

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill Context Engineering                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ Structured Knowledge │  │ Conditional Select   │             │
│  │                      │  │                      │             │
│  │ • 계층 구조 테이블     │  │ • Level 분기         │             │
│  │ • ASCII 다이어그램    │  │ • Phase 분기         │             │
│  │ • 체크리스트          │  │ • 8개 언어 트리거     │             │
│  │ • 코드 예제           │  │ • Magic Word Bypass  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Skill Classification                         │   │
│  │                                                          │   │
│  │  Core (2)     → 전역 규칙, 템플릿 기준                       │   │
│  │  Level (3)    → Starter/Dynamic/Enterprise               │   │
│  │  Pipeline(10) → 9-Phase 단계별 가이드                       │   │
│  │  Specialized(3) → QA, Mobile, Desktop 특수 도메인           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Engineering 기법 적용

| 기법 | Skill 구현 | 효과 |
|------|-----------|------|
| **계층 구조 테이블** | 레벨별/Phase별 적용 방법 | 조건부 지식 선택 |
| **ASCII 다이어그램** | 아키텍처 시각화 | 구조적 이해 |
| **체크리스트** | 완료 조건 명확화 | 자동화 가능 |
| **코드 예제** | 즉시 적용 가능한 참조 | 일관된 구현 |
| **Few-shot Examples** | 대화/출력 패턴 | 예측 가능한 응답 |

## Skill List (18)

### Core Skills (2)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[../../../skills/bkit-rules/SKILL|bkit-rules]] | PDCA rules + auto-triggering + code quality standards | PreToolUse, PostToolUse | - |
| [[../../../skills/bkit-templates/SKILL|bkit-templates]] | Template references + document standards | - | - |

### Level Skills (3)

| Skill | Target | Agent |
|-------|--------|-------|
| [[../../../skills/starter/SKILL|starter]] | Static web, beginners | [[../../../agents/starter-guide|starter-guide]] |
| [[../../../skills/dynamic/SKILL|dynamic]] | BaaS fullstack | [[../../../agents/bkend-expert|bkend-expert]] |
| [[../../../skills/enterprise/SKILL|enterprise]] | MSA/K8s + AI Native | [[../../../agents/enterprise-expert|enterprise-expert]], [[../../../agents/infra-architect|infra-architect]] |

### Pipeline Phase Skills (10)

| Skill | Phase | Hooks | Content |
|-------|-------|-------|---------|
| [[../../../skills/development-pipeline/SKILL|development-pipeline]] | Overview | Stop | 9-stage pipeline overview |
| [[../../../skills/phase-1-schema/SKILL|phase-1-schema]] | 1 | - | Schema/terminology definition |
| [[../../../skills/phase-2-convention/SKILL|phase-2-convention]] | 2 | - | Coding conventions |
| [[../../../skills/phase-3-mockup/SKILL|phase-3-mockup]] | 3 | - | Mockup development |
| [[../../../skills/phase-4-api/SKILL|phase-4-api]] | 4 | Stop | API design/implementation |
| [[../../../skills/phase-5-design-system/SKILL|phase-5-design-system]] | 5 | PostToolUse | Design system |
| [[../../../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] | 6 | PostToolUse | UI + API integration |
| [[../../../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] | 7 | - | SEO/Security |
| [[../../../skills/phase-8-review/SKILL|phase-8-review]] | 8 | Stop | Code review + gap analysis |
| [[../../../skills/phase-9-deployment/SKILL|phase-9-deployment]] | 9 | PreToolUse | Deployment |

### Specialized Skills (3)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[../../../skills/zero-script-qa/SKILL|zero-script-qa]] | Log-based QA | PreToolUse, Stop | [[../../../agents/qa-monitor|qa-monitor]] |
| [[../../../skills/mobile-app/SKILL|mobile-app]] | Mobile app dev | - | [[../../../agents/pipeline-guide|pipeline-guide]] |
| [[../../../skills/desktop-app/SKILL|desktop-app]] | Desktop app dev | - | [[../../../agents/pipeline-guide|pipeline-guide]] |

## Removed Skills (v1.2.0)

The following skills were consolidated:

| Removed Skill | Merged Into |
|---------------|-------------|
| `task-classification` | `lib/common.js` |
| `level-detection` | `lib/common.js` |
| `pdca-methodology` | `bkit-rules` |
| `document-standards` | `bkit-templates` |
| `evaluator-optimizer` | `/pdca-iterate` command |
| `analysis-patterns` | `bkit-templates` |
| `ai-native-development` | `enterprise` |
| `monorepo-architecture` | `enterprise` |

## Skill Frontmatter Structure

```yaml
---
name: skill-name
description: |
  Skill description.

  Use proactively when user...

  Triggers: keyword1, keyword2, keyword3

  Do NOT use for: exclusion conditions
agent: connected-agent-name
allowed-tools:
  - Read
  - Write
  - Edit
  - ...
user-invocable: true|false
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  PostToolUse:
    - matcher: "Write"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  Stop:
    - command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
---
```

## Hooks Definition

### PreToolUse (command type - recommended)
```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js"
```

### PostToolUse
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.js"
```

### Stop
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.js"
```

## Source Location

Skills are at root level (not in .claude/):

```
bkit-claude-code/
└── skills/
    ├── bkit-rules/SKILL.md
    ├── bkit-templates/SKILL.md
    ├── starter/SKILL.md
    ├── dynamic/SKILL.md
    ├── enterprise/SKILL.md
    ├── development-pipeline/SKILL.md
    ├── phase-1-schema/SKILL.md
    ├── phase-2-convention/SKILL.md
    ├── phase-3-mockup/SKILL.md
    ├── phase-4-api/SKILL.md
    ├── phase-5-design-system/SKILL.md
    ├── phase-6-ui-integration/SKILL.md
    ├── phase-7-seo-security/SKILL.md
    ├── phase-8-review/SKILL.md
    ├── phase-9-deployment/SKILL.md
    ├── zero-script-qa/SKILL.md
    ├── mobile-app/SKILL.md
    └── desktop-app/SKILL.md
```

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering 원칙 ⭐ NEW
- [[../hooks/_hooks-overview]] - Hook event details
- [[../scripts/_scripts-overview]] - Script details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix
