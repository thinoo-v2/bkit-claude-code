---
name: bkit-templates
description: |
  Document templates for bkit PDCA methodology.
  Includes plan, design, analysis, report templates and pipeline phase templates.

  Triggers: template, document template, plan template, design template, PDCA template
---

# bkit Document Templates

Use these templates when creating PDCA and pipeline phase documents.

## Core PDCA Templates

| Template | Path | Usage |
|----------|------|-------|
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` | Feature planning document |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` | Technical design document |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` | Gap analysis report |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` | Completion/status report |
| Index | `${CLAUDE_PLUGIN_ROOT}/templates/_INDEX.template.md` | Documentation index |
| CLAUDE | `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` | Project CLAUDE.md template |

## Pipeline Phase Templates

Located in `${CLAUDE_PLUGIN_ROOT}/templates/pipeline/`:

| Phase | Template | Deliverable |
|-------|----------|-------------|
| 1 | phase-1-schema.template.md | Schema/Terminology document |
| 2 | phase-2-convention.template.md | Coding conventions |
| 3 | phase-3-mockup.template.md | UI/UX mockup |
| 4 | phase-4-api.template.md | API design document |
| 5 | phase-5-design-system.template.md | Design system spec |
| 6 | phase-6-ui.template.md | UI implementation checklist |
| 7 | phase-7-seo-security.template.md | SEO/Security checklist |
| 8 | phase-8-review.template.md | Code review document |
| 9 | phase-9-deployment.template.md | Deployment checklist |
| QA | zero-script-qa.template.md | Zero Script QA template |

## Usage Guidelines

### When Creating Documents

1. **Read the appropriate template first**
2. **Copy structure** - maintain section headers
3. **Fill placeholders** - replace {placeholder} with actual values
4. **Adapt to context** - add/remove sections as needed

### Document Location Convention

```
docs/
├── 01-plan/          # Plan phase documents
├── 02-design/        # Design phase documents
├── 03-analysis/      # Check phase (gap analysis)
└── 04-report/        # Act phase (reports)
```

### Naming Convention

```
{feature-name}.{type}.md

Examples:
- auth.plan.md
- auth.design.md
- auth-gap.analysis.md
- auth.report.md
```

## Template Variables

Common placeholders used in templates:

| Variable | Description |
|----------|-------------|
| `{feature-name}` | Name of the feature |
| `{date}` | Document creation date |
| `{author}` | Document author |
| `{version}` | Document version |
| `{status}` | Document status |
