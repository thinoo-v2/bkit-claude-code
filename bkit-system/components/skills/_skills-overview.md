# Skills Overview

> bkit에 정의된 18개 Skills 목록과 각각의 역할 (v1.2.0 리팩토링 후)

## Skills란?

Skills는 **도메인별 전문 지식**을 제공하는 컴포넌트입니다.
- Claude가 특정 작업 시 참조하는 컨텍스트
- Frontmatter hooks로 자동화된 동작 정의
- Description의 Triggers 키워드로 자동 활성화

## v1.2.0 리팩토링 변경사항

기존 26개 Skills가 18개로 통합되었습니다:

| 삭제/통합된 Skill | 통합 위치 |
|------------------|----------|
| `task-classification` | → `bkit-rules` (통합) |
| `level-detection` | → `bkit-rules` (통합) |
| `pdca-methodology` | → 삭제 (CLAUDE.md로 이동) |
| `document-standards` | → `bkit-templates` (통합) |
| `evaluator-optimizer` | → 삭제 (agent 설명으로 이동) |
| `analysis-patterns` | → `phase-8-review` (통합) |
| `ai-native-development` | → `enterprise` (통합) |
| `monorepo-architecture` | → `enterprise` (통합) |

## 전체 목록 (18개)

### Core Skills (2개)

| Skill | 역할 | Hooks | Agent 연결 |
|-------|------|-------|-----------|
| [[bkit-rules]] | PDCA 규칙 + 레벨감지 + 작업분류 | PreToolUse, PostToolUse | - |
| [[bkit-templates]] | 템플릿 참조 + 문서 표준 | - | - |

**Note**: `bkit-rules`는 통합된 `pre-write.sh` 훅을 사용하여 PDCA, 작업분류, 컨벤션을 한번에 처리합니다.

### Level Skills (3개)

| Skill | 대상 | Agent 연결 |
|-------|------|-----------|
| [[starter]] | 정적 웹, 초보자 | [[../agents/starter-guide]] |
| [[dynamic]] | BaaS 풀스택 | [[../agents/bkend-expert]] |
| [[enterprise]] | MSA/K8s + AI Native + 모노레포 | [[../agents/enterprise-expert]], [[../agents/infra-architect]] |

**Note**: `enterprise`는 ai-native-development와 monorepo-architecture 내용을 통합합니다.

### Pipeline Phase Skills (10개)

| Skill | Phase | Hooks | 주요 내용 |
|-------|-------|-------|----------|
| [[development-pipeline]] | 전체 | Stop | 9단계 파이프라인 개요 |
| [[phase-1-schema]] | 1 | - | 스키마/용어 정의 |
| [[phase-2-convention]] | 2 | - | 코딩 컨벤션 (훅은 bkit-rules로 통합) |
| [[phase-3-mockup]] | 3 | - | 목업 개발 |
| [[phase-4-api]] | 4 | Stop | API 설계/구현 |
| [[phase-5-design-system]] | 5 | PostToolUse | 디자인 시스템 |
| [[phase-6-ui-integration]] | 6 | PostToolUse | UI + API 연동 |
| [[phase-7-seo-security]] | 7 | - | SEO/보안 |
| [[phase-8-review]] | 8 | Stop | 코드 리뷰 + 갭 분석 패턴 |
| [[phase-9-deployment]] | 9 | PreToolUse | 배포 |

**Note**: `phase-8-review`는 analysis-patterns 내용을 통합합니다.

### Specialized Skills (3개)

| Skill | 역할 | Hooks | Agent 연결 |
|-------|------|-------|-----------|
| [[zero-script-qa]] | 로그 기반 QA | PreToolUse, Stop | [[../agents/qa-monitor]] |
| [[mobile-app]] | 모바일 앱 | - | [[../agents/pipeline-guide]] |
| [[desktop-app]] | 데스크톱 앱 | - | [[../agents/pipeline-guide]] |

---

## Skill Frontmatter 구조

```yaml
---
name: skill-name
description: |
  Skill 설명.

  Use proactively when user...

  Triggers: keyword1, keyword2, 한글키워드

  Do NOT use for: 제외 조건
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
      script: "./scripts/script-name.sh"
  PostToolUse:
    - matcher: "Write"
      script: "./scripts/script-name.sh"
  Stop:
    - script: "./scripts/script-name.sh"
---
```

---

## Hooks 정의 방식

### PreToolUse (command 방식 - 권장)
```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit"   # 매칭할 도구
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/pre-write.sh"
```

**Note**: v1.2.0부터 `command` 타입 사용을 권장합니다. 통합된 `pre-write.sh`는 PDCA, 작업분류, 컨벤션을 한번에 처리합니다.

### PostToolUse
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/pdca-post-write.sh"
```

### Stop
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/qa-stop.sh"
```

---

## Skill 소스 위치

```
.claude/skills/
├── bkit-rules/SKILL.md
├── starter/SKILL.md
├── dynamic/SKILL.md
├── enterprise/SKILL.md
├── phase-1-schema/SKILL.md
├── phase-2-convention/SKILL.md
├── ...
└── zero-script-qa/SKILL.md
```

---

## 관련 문서

- [[../hooks/_hooks-overview]] - Hook 이벤트 상세
- [[../scripts/_scripts-overview]] - Script 상세
- [[../agents/_agents-overview]] - Agent 상세
- [[../../triggers/trigger-matrix]] - 트리거 매트릭스
