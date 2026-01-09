---
name: bkit-rules
description: |
  Core development rules for bkit Vibecoding Kit.
  Includes PDCA methodology, code quality principles, level detection, and agent auto-triggering.

  Triggers: bkit rules, PDCA rules, code quality, level detection, auto trigger
---

# bkit Core Development Rules

## PDCA Auto-Apply Rules

**No Guessing**: If unsure, check docs -> If not in docs, ask user
**Source of Reference Priority**: Code > CLAUDE.md > docs/ design documents

| Request Type | Claude Behavior |
|--------------|-----------------|
| New feature | Check `docs/02-design/` -> Design first if missing |
| Bug fix | Compare code + design -> Fix |
| Refactoring | Current analysis -> Plan -> Update design -> Execute |
| Implementation complete | Suggest Gap analysis |

## Code Quality Principles

### Pre-coding Checks
1. Does similar functionality exist? Search first
2. Check utils/, hooks/, components/ui/
3. If exists, reuse; if not, create

### Core Principles
- **DRY**: No copy-paste same code to 2+ locations
- **SRP**: One function, one responsibility
- **Extensibility**: Write in generalized patterns
- **No Hardcoding**: Define constants with meaningful names

### Refactor When
- Same code appears 2nd time
- Function exceeds 20 lines
- if-else nests 3+ levels deep

## Level Detection

### Detection Order
1. Check CLAUDE.md "Level" section
2. File structure based detection:

| Level | Detection Conditions |
|-------|---------------------|
| Enterprise | 2+ of: infra/terraform/, k8s/, services/, turbo.json, docker-compose.yml |
| Dynamic | 1+ of: bkend in .mcp.json, lib/bkend/, supabase/, firebase.json |
| Starter | None of the above |

### Level-specific Agents
| Level | Primary Agent | Secondary Agent |
|-------|---------------|-----------------|
| Starter | starter-guide | - |
| Dynamic | bkend-expert | - |
| Enterprise | enterprise-expert | infra-architect |

## Agent Auto-Trigger Rules

Claude MUST auto-invoke agents based on intent:

| User Intent | Auto-Invoke Agent |
|-------------|-------------------|
| code review, security scan | code-analyzer |
| design review, spec check | design-validator |
| gap analysis, design vs implementation | gap-detector |
| report, summary | report-generator |
| QA, test, log analysis | qa-monitor |
| pipeline, which phase | pipeline-guide |

After major tasks, suggest relevant agents proactively.

## Progress Management

- Track all work with TodoWrite
- Use Task tool for parallel processing
- Report status at each milestone

## Template References

| Document Type | Template Path |
|---------------|---------------|
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` |
