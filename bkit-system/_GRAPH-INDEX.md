# bkit Graph Index

> 옵시디안 그래프뷰의 중심 허브. 이 파일에서 모든 컴포넌트로 연결됩니다.
>
> **v1.2.0 리팩토링 반영**: Skills 26→18개, Scripts 15→12개, 통합 훅 도입

## Skills (18개)

### Core Skills (2개)
- [[components/skills/bkit-rules]] - PDCA 규칙 + 레벨감지 + 작업분류 (통합)
- [[components/skills/bkit-templates]] - 문서 템플릿 + 문서 표준 (통합)

### Level Skills (3개)
- [[components/skills/starter]] - Starter 레벨 (정적 웹)
- [[components/skills/dynamic]] - Dynamic 레벨 (BaaS 풀스택)
- [[components/skills/enterprise]] - Enterprise 레벨 (MSA/K8s + AI Native + 모노레포)

### Pipeline Phase Skills (10개)
- [[components/skills/development-pipeline]] - 9단계 파이프라인 전체
- [[components/skills/phase-1-schema]] - 스키마/용어 정의
- [[components/skills/phase-2-convention]] - 코딩 컨벤션
- [[components/skills/phase-3-mockup]] - 목업 개발
- [[components/skills/phase-4-api]] - API 설계/구현
- [[components/skills/phase-5-design-system]] - 디자인 시스템
- [[components/skills/phase-6-ui-integration]] - UI 구현 + API 연동
- [[components/skills/phase-7-seo-security]] - SEO/보안
- [[components/skills/phase-8-review]] - 코드 리뷰 + 갭 분석 패턴 (통합)
- [[components/skills/phase-9-deployment]] - 배포

### Specialized Skills (3개)
- [[components/skills/zero-script-qa]] - Zero Script QA
- [[components/skills/mobile-app]] - 모바일 앱 개발
- [[components/skills/desktop-app]] - 데스크톱 앱 개발

### 삭제된 Skills
다음 skills는 다른 곳으로 통합되었습니다:
- ~~task-classification~~ → bkit-rules
- ~~level-detection~~ → bkit-rules
- ~~pdca-methodology~~ → 삭제 (CLAUDE.md로 이동)
- ~~document-standards~~ → bkit-templates
- ~~evaluator-optimizer~~ → 삭제 (agent 설명으로 이동)
- ~~analysis-patterns~~ → phase-8-review
- ~~ai-native-development~~ → enterprise
- ~~monorepo-architecture~~ → enterprise

## Agents (11개)

### Level-Based Agents
- [[components/agents/starter-guide]] - Starter 레벨 가이드
- [[components/agents/bkend-expert]] - Dynamic 레벨 (BaaS 전문가)
- [[components/agents/enterprise-expert]] - Enterprise 레벨 (CTO급)
- [[components/agents/infra-architect]] - 인프라 아키텍트

### Task-Based Agents
- [[components/agents/pipeline-guide]] - 파이프라인 가이드
- [[components/agents/gap-detector]] - 갭 분석
- [[components/agents/design-validator]] - 설계 검증
- [[components/agents/code-analyzer]] - 코드 품질 분석
- [[components/agents/qa-monitor]] - QA 모니터링
- [[components/agents/pdca-iterator]] - 반복 개선
- [[components/agents/report-generator]] - 보고서 생성

## Hooks (4종)

- [[components/hooks/PreToolUse]] - 도구 사용 전 (Write, Edit, Bash)
- [[components/hooks/PostToolUse]] - 도구 사용 후 (Write)
- [[components/hooks/Stop]] - 세션 종료 시
- [[components/hooks/SessionStart]] - 세션 시작 시

## Scripts (12개 활성)

### Core Scripts (신규)
- [[components/scripts/pre-write]] - **통합 훅** (PDCA + 분류 + 컨벤션)
- [[components/scripts/pdca-post-write]] - Write 후 다음 단계 안내

### Phase Scripts
- [[components/scripts/phase4-api-stop]] - API 완료 후 QA 안내
- [[components/scripts/phase5-design-post]] - 디자인 토큰 검증
- [[components/scripts/phase6-ui-post]] - UI 레이어 분리 검증
- [[components/scripts/phase8-review-stop]] - 리뷰 완료 안내 (갭 분석 포함)
- [[components/scripts/phase9-deploy-pre]] - 배포 전 환경 검증

### QA Scripts
- [[components/scripts/qa-pre-bash]] - 파괴적 명령어 차단
- [[components/scripts/qa-monitor-post]] - QA 결과 후속 안내
- [[components/scripts/qa-stop]] - QA 세션 완료

### Other Scripts
- [[components/scripts/gap-detector-post]] - 갭 분석 후 안내
- [[components/scripts/design-validator-pre]] - 설계 문서 검증
- [[components/scripts/select-template]] - 레벨별 템플릿 선택

### 신규 인프라 파일
- `lib/common.sh` - 공유 유틸리티 라이브러리
- `bkit.config.json` - 설정 외부화 파일

### Deprecated Scripts
- ~~pdca-pre-write~~ → pre-write.sh로 통합
- ~~task-classify~~ → pre-write.sh로 통합
- ~~phase2-convention-pre~~ → pre-write.sh로 통합
- ~~analysis-stop~~ → phase8-review-stop으로 통합

## Triggers

- [[triggers/trigger-matrix]] - 이벤트별 트리거 매트릭스
- [[triggers/priority-rules]] - 우선순위 및 충돌 규칙

## Scenarios

- [[scenarios/scenario-write-code]] - 코드 작성 시 동작 흐름
- [[scenarios/scenario-new-feature]] - 새 기능 요청 시
- [[scenarios/scenario-qa]] - QA 실행 시

## Testing

- [[testing/test-checklist]] - 테스트 체크리스트
