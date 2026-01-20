# bkit Graph Index

> Obsidian graph view central hub. All components connect from this file.
>
> **v1.2.0 Refactoring**: Skills consolidated, .claude/ removed from repo, single source of truth at root level
>
> **v1.2.1 Multi-Language Support**: Extension-based file detection, 20+ language support, configurable patterns

## Skills (18)

### Core Skills (2)
- [[../skills/bkit-rules/SKILL|bkit-rules]] - PDCA rules + auto-triggering + code quality standards
- [[../skills/bkit-templates/SKILL|bkit-templates]] - Document templates for consistent PDCA documentation

### Level Skills (3)
- [[../skills/starter/SKILL|starter]] - Starter level (static web, HTML/CSS/JS, Next.js basics)
- [[../skills/dynamic/SKILL|dynamic]] - Dynamic level (BaaS fullstack with bkend.ai)
- [[../skills/enterprise/SKILL|enterprise]] - Enterprise level (MSA/K8s/Terraform, AI Native)

### Pipeline Phase Skills (10)
- [[../skills/development-pipeline/SKILL|development-pipeline]] - 9-stage pipeline overview
- [[../skills/phase-1-schema/SKILL|phase-1-schema]] - Schema/terminology definition
- [[../skills/phase-2-convention/SKILL|phase-2-convention]] - Coding conventions
- [[../skills/phase-3-mockup/SKILL|phase-3-mockup]] - Mockup development
- [[../skills/phase-4-api/SKILL|phase-4-api]] - API design/implementation
- [[../skills/phase-5-design-system/SKILL|phase-5-design-system]] - Design system
- [[../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] - UI implementation + API integration
- [[../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] - SEO/Security
- [[../skills/phase-8-review/SKILL|phase-8-review]] - Code review + quality analysis
- [[../skills/phase-9-deployment/SKILL|phase-9-deployment]] - Deployment

### Specialized Skills (3)
- [[../skills/zero-script-qa/SKILL|zero-script-qa]] - Zero Script QA (log-based testing)
- [[../skills/mobile-app/SKILL|mobile-app]] - Mobile app development (React Native, Flutter)
- [[../skills/desktop-app/SKILL|desktop-app]] - Desktop app development (Electron, Tauri)

### Removed Skills (v1.2.0)
The following skills were consolidated:
- ~~task-classification~~ → `lib/common.sh`
- ~~level-detection~~ → `lib/common.sh`
- ~~pdca-methodology~~ → `bkit-rules`
- ~~document-standards~~ → `bkit-templates`
- ~~evaluator-optimizer~~ → `/pdca-iterate` command
- ~~analysis-patterns~~ → `bkit-templates`
- ~~ai-native-development~~ → `enterprise`
- ~~monorepo-architecture~~ → `enterprise`

## Agents (11)

### Level-Based Agents
- [[../agents/starter-guide|starter-guide]] - Starter level guide (beginners)
- [[../agents/bkend-expert|bkend-expert]] - Dynamic level (BaaS expert)
- [[../agents/enterprise-expert|enterprise-expert]] - Enterprise level (CTO-level advisor)
- [[../agents/infra-architect|infra-architect]] - Infrastructure architect (AWS/K8s/Terraform)

### Task-Based Agents
- [[../agents/pipeline-guide|pipeline-guide]] - Pipeline guide (9-phase development)
- [[../agents/gap-detector|gap-detector]] - Gap analysis (design vs implementation)
- [[../agents/design-validator|design-validator]] - Design validation
- [[../agents/code-analyzer|code-analyzer]] - Code quality analysis
- [[../agents/qa-monitor|qa-monitor]] - QA monitoring (Zero Script QA)
- [[../agents/pdca-iterator|pdca-iterator]] - Iteration optimizer (Evaluator-Optimizer pattern)
- [[../agents/report-generator|report-generator]] - Report generation

## Commands (18)

### Initialization
- `/init-starter` - Initialize Starter level project
- `/init-dynamic` - Initialize Dynamic level project
- `/init-enterprise` - Initialize Enterprise level project

### PDCA Workflow
- `/pdca-plan` - Create plan document
- `/pdca-design` - Create design document
- `/pdca-analyze` - Run gap analysis
- `/pdca-iterate` - Auto-fix with Evaluator-Optimizer
- `/pdca-report` - Generate completion report
- `/pdca-status` - Show PDCA dashboard
- `/pdca-next` - Guide next PDCA step

### Pipeline
- `/pipeline-start` - Start pipeline guide
- `/pipeline-next` - Next pipeline phase
- `/pipeline-status` - Pipeline progress

### Utilities
- `/zero-script-qa` - Run Zero Script QA
- `/learn-claude-code` - Learning curriculum
- `/setup-claude-code` - Generate project settings
- `/upgrade-claude-code` - Upgrade settings
- `/upgrade-level` - Upgrade project level

## Hooks (3 events)

Defined in `hooks/hooks.json`:

- [[components/hooks/_hooks-overview|SessionStart]] - Plugin initialization on session start
- [[components/hooks/_hooks-overview|PreToolUse]] - Before Write/Edit operations
- [[components/hooks/_hooks-overview|PostToolUse]] - After Write operations

## Scripts (18)

> **Note**: Scripts reduced from 19 to 18 (task-classify.sh removed in v1.2.0, merged into pre-write.sh)

### Core Scripts
- `scripts/pre-write.sh` - Unified PreToolUse hook (PDCA + classification + convention)
- `scripts/pdca-post-write.sh` - PostToolUse guidance after Write
- `scripts/select-template.sh` - Template selection by level

### Phase Scripts
- `scripts/phase2-convention-pre.sh` - Convention check before write
- `scripts/phase4-api-stop.sh` - Zero Script QA after API implementation
- `scripts/phase5-design-post.sh` - Design token verification
- `scripts/phase6-ui-post.sh` - Layer separation verification
- `scripts/phase8-review-stop.sh` - Review completion guidance
- `scripts/phase9-deploy-pre.sh` - Deployment environment validation

### QA Scripts
- `scripts/qa-pre-bash.sh` - QA setup before Bash
- `scripts/qa-monitor-post.sh` - QA completion guidance
- `scripts/qa-stop.sh` - QA session cleanup

### Agent Scripts
- `scripts/design-validator-pre.sh` - Design document validation
- `scripts/gap-detector-post.sh` - Gap analysis guidance
- `scripts/analysis-stop.sh` - Analysis completion guidance

### Utility Scripts
- `scripts/pdca-pre-write.sh` - Legacy (merged into pre-write.sh)
- `scripts/sync-folders.sh` - Folder synchronization
- `scripts/validate-plugin.sh` - Plugin validation

## Infrastructure

### Shared Library
- `lib/common.sh` - Shared utility functions (v1.2.1 Multi-Language Support)
  - `get_config()` - Read from bkit.config.json
  - `is_source_file()` - Negative pattern + extension detection (20+ languages)
  - `is_code_file()` - Check code file extensions (.ts, .py, .go, .rs, .rb, etc.)
  - `is_ui_file()` - Check UI component files (.tsx, .jsx, .vue, .svelte)
  - `extract_feature()` - Multi-language feature extraction (Next.js/Python/Go/Ruby/Monorepo)
  - `classify_task()` - Task size classification
  - `detect_level()` - Project level detection
  - `output_allow()`, `output_block()`, `output_empty()` - JSON output helpers

### Configurable Patterns (v1.2.1)
- `BKIT_EXCLUDE_PATTERNS` - Exclude directories (node_modules, __pycache__, .git, etc.)
- `BKIT_FEATURE_PATTERNS` - Feature directory patterns (features, modules, packages, etc.)

### Configuration
- `bkit.config.json` - Centralized configuration
  - Task classification thresholds
  - Level detection rules
  - PDCA document paths
  - Naming conventions

## Templates (20)

### PDCA Templates
- `plan.template.md` - Plan phase
- `design.template.md` - Design phase
- `design-starter.template.md` - Starter-level design
- `design-enterprise.template.md` - Enterprise-level design
- `analysis.template.md` - Gap analysis
- `report.template.md` - Completion report
- `iteration-report.template.md` - Iteration report

### Pipeline Templates (10)
- `pipeline/phase-1-schema.template.md`
- `pipeline/phase-2-convention.template.md`
- `pipeline/phase-3-mockup.template.md`
- `pipeline/phase-4-api.template.md`
- `pipeline/phase-5-design-system.template.md`
- `pipeline/phase-6-ui.template.md`
- `pipeline/phase-7-seo-security.template.md`
- `pipeline/phase-8-review.template.md`
- `pipeline/phase-9-deployment.template.md`
- `pipeline/zero-script-qa.template.md`

### Other Templates
- `CLAUDE.template.md` - Project conventions
- `_INDEX.template.md` - Document index

## Triggers

- [[triggers/trigger-matrix]] - Event-based trigger matrix
- [[triggers/priority-rules]] - Priority and conflict rules

## Scenarios

- [[scenarios/scenario-write-code]] - Code write flow
- [[scenarios/scenario-new-feature]] - New feature request
- [[scenarios/scenario-qa]] - QA execution

## Testing

- [[testing/test-checklist]] - Test checklist
