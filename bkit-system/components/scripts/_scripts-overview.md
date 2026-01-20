# Scripts Overview

> bkit에서 사용하는 12개 Shell Scripts 목록과 역할 (v1.2.0 리팩토링 후)

## Scripts란?

Scripts는 **Hooks에서 실행되는 실제 로직**입니다.
- Skill/Agent frontmatter의 hooks에서 참조
- stdin으로 JSON 입력, stdout으로 JSON 출력
- allow/block 결정 및 additionalContext 제공

## v1.2.0 리팩토링 변경사항

### 새로 추가된 파일

| 파일 | 역할 |
|------|------|
| `lib/common.sh` | 공유 유틸리티 라이브러리 |
| `scripts/pre-write.sh` | 통합된 PreToolUse 훅 (PDCA + 분류 + 컨벤션) |
| `bkit.config.json` | 설정 외부화 파일 |

### 통합/Deprecated된 Scripts

| Script | 상태 | 통합 위치 |
|--------|------|----------|
| `pdca-pre-write.sh` | DEPRECATED | → `pre-write.sh`로 통합 |
| `task-classify.sh` | DEPRECATED | → `pre-write.sh`로 통합 |
| `phase2-convention-pre.sh` | 기능 통합 | → `pre-write.sh`로 통합 |
| `analysis-stop.sh` | 기능 통합 | → `phase-8-review` Stop hook 사용 |

## 전체 목록 (12개 활성)

### Core Scripts (2개)

| Script | Hook | Skill/Agent | 역할 |
|--------|------|-------------|------|
| **[[pre-write]]** | PreToolUse | bkit-rules | **통합 훅**: PDCA 체크 + 작업분류 + 컨벤션 힌트 |
| [[pdca-post-write]] | PostToolUse | bkit-rules | Write 후 Gap Analysis 안내 |

**Note**: `pre-write.sh`는 `lib/common.sh`를 참조하여 설정 기반으로 동작합니다.

### Phase Scripts (5개)

| Script | Hook | Skill | 역할 |
|--------|------|-------|------|
| [[phase4-api-stop]] | Stop | phase-4-api | API 완료 후 Zero Script QA 안내 |
| [[phase5-design-post]] | PostToolUse | phase-5-design-system | 디자인 토큰 사용 검증 |
| [[phase6-ui-post]] | PostToolUse | phase-6-ui-integration | UI 레이어 분리 검증 |
| [[phase8-review-stop]] | Stop | phase-8-review | 리뷰 완료 요약 + 갭 분석 안내 |
| [[phase9-deploy-pre]] | PreToolUse | phase-9-deployment | 배포 전 환경 검증 |

### QA Scripts (3개)

| Script | Hook | Skill/Agent | 역할 |
|--------|------|-------------|------|
| [[qa-pre-bash]] | PreToolUse | zero-script-qa | 파괴적 명령어 차단 |
| [[qa-monitor-post]] | PostToolUse | qa-monitor | Critical 이슈 발견 시 알림 |
| [[qa-stop]] | Stop | zero-script-qa | QA 세션 완료 안내 |

### Agent Scripts (2개)

| Script | Hook | Agent | 역할 |
|--------|------|-------|------|
| [[gap-detector-post]] | PostToolUse | gap-detector | 분석 완료 후 iterate 안내 |
| [[design-validator-pre]] | PreToolUse | design-validator | 설계 문서 체크리스트 |

### Utility Scripts (1개)

| Script | 용도 | 호출 방식 |
|--------|------|----------|
| [[select-template]] | 레벨별 템플릿 선택 | Commands에서 직접 호출 |

## 공유 라이브러리: lib/common.sh

통합된 스크립트들은 `lib/common.sh`를 사용합니다:

```bash
source "${LIB_DIR}/common.sh"

# 사용 가능한 함수들:
get_config ".pdca.thresholds.quickFix" "50"   # 설정 값 읽기
is_source_file "/path/to/file"                 # 소스 파일 여부
is_code_file "/path/to/file.ts"                # 코드 파일 여부
extract_feature "/src/features/auth/login.ts"  # 기능명 추출
find_design_doc "auth"                         # 설계 문서 찾기
classify_task "$content"                       # 작업 분류
detect_level                                   # 레벨 감지
output_allow "context message"                 # JSON 출력
```

---

## Script 입출력 규격

### 입력 (stdin)

PreToolUse/PostToolUse에서 받는 JSON:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  }
}
```

### 출력 (stdout)

**Allow with context**:
```json
{
  "decision": "allow",
  "hookSpecificOutput": {
    "additionalContext": "Claude에게 전달할 메시지"
  }
}
```

**Block**:
```json
{
  "decision": "block",
  "reason": "차단 이유"
}
```

**No action**:
```json
{}
```

---

## 주요 Script 상세

### pre-write.sh (통합 스크립트)

```
트리거: Write|Edit on source files (src/, lib/, app/, components/, pages/, features/, services/)

동작 (3단계 통합):

1. 작업 분류 (Task Classification)
   - content 크기 측정
   - bkit.config.json의 thresholds 참조
   - < 50 chars → Quick Fix
   - < 200 chars → Minor Change
   - < 1000 chars → Feature (PDCA 권장)
   - >= 1000 chars → Major Feature (PDCA 필수)

2. PDCA 문서 체크
   - 파일 경로에서 feature 이름 추출 (extract_feature)
   - design doc 존재 여부 체크 (find_design_doc)
   - 있으면 → "design doc 참조하세요" 안내
   - plan만 있으면 → "design 먼저 만드세요" 경고

3. 컨벤션 힌트
   - 코드 파일 → "Components=PascalCase, Functions=camelCase..."
   - 환경 파일 → "NEXT_PUBLIC_* (client), DB_* (database)..."

출력: 모든 컨텍스트를 한 JSON 응답으로 통합
```

### lib/common.sh 주요 함수

```bash
# 설정 관리
get_config()         # bkit.config.json에서 값 읽기
get_config_array()   # 배열 값 읽기

# 파일 분류
is_source_file()     # 소스 디렉토리 파일 여부
is_code_file()       # 코드 확장자 여부
is_env_file()        # 환경 파일 여부

# 기능 추출
extract_feature()    # 경로에서 feature명 추출
find_design_doc()    # design 문서 경로 찾기
find_plan_doc()      # plan 문서 경로 찾기

# 작업 분류
classify_task()      # 내용 크기로 작업 분류
get_pdca_guidance()  # 분류에 따른 가이드 메시지

# 레벨 감지
detect_level()       # Starter/Dynamic/Enterprise 판별

# JSON 출력
output_allow()       # allow + additionalContext
output_block()       # block + reason
output_empty()       # {} 빈 응답
```

### qa-pre-bash.sh

```
트리거: Bash commands during zero-script-qa

동작:
1. 명령어에서 파괴적 패턴 검색
   - rm -rf, DROP TABLE, DELETE FROM, etc.
2. 발견 시 → block
3. 안전 시 → allow with "QA 환경에서 안전"
```

### phase5-design-post.sh

```
트리거: Write on component files (components/, ui/)

동작:
1. 작성된 내용에서 하드코딩 색상 검색
   - #[0-9a-fA-F]{3,6}
   - rgb(, rgba(
2. 발견 시 → "디자인 토큰 사용하세요" 경고
3. 없으면 → "디자인 토큰 올바르게 사용" 확인
```

---

## 소스 위치

```
.claude/
├── lib/
│   └── common.sh              # 공유 유틸리티 라이브러리 (NEW)
├── scripts/
│   ├── pre-write.sh           # 통합 PreToolUse 훅 (NEW)
│   ├── pdca-pre-write.sh      # DEPRECATED → pre-write.sh
│   ├── pdca-post-write.sh
│   ├── task-classify.sh       # DEPRECATED → pre-write.sh
│   ├── phase4-api-stop.sh
│   ├── phase5-design-post.sh
│   ├── phase6-ui-post.sh
│   ├── phase8-review-stop.sh  # analysis-stop.sh 기능 통합
│   ├── phase9-deploy-pre.sh
│   ├── qa-pre-bash.sh
│   ├── qa-monitor-post.sh
│   ├── qa-stop.sh
│   ├── gap-detector-post.sh
│   ├── design-validator-pre.sh
│   ├── analysis-stop.sh       # 기능 통합됨 (phase-8-review 사용)
│   └── select-template.sh
└── bkit.config.json           # 설정 외부화 파일 (NEW)
```

---

## Script 작성 가이드

### 필수 요소

```bash
#!/bin/bash
set -e  # 에러 시 중단

INPUT=$(cat)  # stdin에서 JSON 읽기
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# 로직...

# 반드시 JSON 출력
cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "..."}}
EOF
```

### 권장 사항

1. **Early exit**: 해당 없는 파일은 빨리 `{}` 반환
2. **jq 사용**: JSON 파싱에 jq 사용
3. **Block 최소화**: allow가 기본, block은 정말 위험할 때만
4. **메시지 간결**: additionalContext는 간결하게

---

## 관련 문서

- [[../hooks/_hooks-overview]] - Hook 이벤트 상세
- [[../skills/_skills-overview]] - Skill 상세
- [[../../triggers/trigger-matrix]] - 트리거 매트릭스
