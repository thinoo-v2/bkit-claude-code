# Auto-Trigger System Debugging Planning Document

> **Summary**: bkit skills/agents/hooks 자동 트리거 시스템이 작동하지 않는 문제 디버깅
>
> **Project**: bkit-claude-code
> **Version**: 1.2.3
> **Author**: User
> **Date**: 2026-01-22
> **Status**: In Progress

---

## 1. Overview

### 1.1 Purpose

bkit 플러그인의 핵심 기능인 **자동 트리거 시스템**이 실제로 작동하지 않는 문제를 디버깅하고 해결합니다.

### 1.2 Background

- 사용자가 "검증하고 싶어", "개선하고 싶어" 등의 키워드를 사용해도 관련 에이전트/스킬이 자동으로 활성화되지 않음
- SessionStart 훅은 작동하지만 (AskUserQuestion 호출됨), 이후 대화에서는 자동 트리거가 작동하지 않음
- description의 "Triggers:" 키워드가 Claude의 자동 위임 결정에 영향을 미치지 않는 것으로 보임

### 1.3 Related Documents

- `bkit-system/triggers/trigger-matrix.md`
- `docs/pdca/03-analysis/13-hooks-triggers-gap-analysis.md`

---

## 2. Scope

### 2.1 In Scope

- [x] 모든 skills SKILL.md frontmatter 분석
- [x] 모든 agents .md frontmatter 분석
- [x] hooks.json 및 session-start.sh 분석
- [x] 자동 트리거 실패 원인 파악
- [ ] 개선 방안 수립 및 적용

### 2.2 Out of Scope

- Claude Code 자체의 버그 수정 (외부 의존성)
- 완전히 새로운 트리거 시스템 설계

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | "검증", "개선" 등 키워드 시 관련 에이전트 자동 활성화 | High | Pending |
| FR-02 | PDCA 문서 없이 구현 시작 시 문서 작성 강제 | High | Pending |
| FR-03 | 구현 완료 후 Gap Analysis 자동 제안 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 신뢰성 | 트리거가 90% 이상 정확하게 작동 | 테스트 시나리오 |
| 사용성 | 사용자가 명시적 명령 없이도 자동 안내 | 사용자 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 자동 트리거 실패 원인 명확히 파악
- [ ] 개선 방안 구현 및 테스트
- [ ] 트리거 키워드 사용 시 에이전트/스킬 자동 활성화 확인

### 4.2 Quality Criteria

- [ ] 5개 이상의 트리거 시나리오 테스트 통과
- [ ] SessionStart 이후 대화에서도 자동 트리거 작동

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude Code의 자동 위임 로직이 description만으로는 불충분 | High | High | hooks를 통한 강제 트리거 구현 |
| Semantic matching이 키워드 기반이 아닐 수 있음 | Medium | High | 더 명확한 description 작성 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules | Web apps with backend | ☒ |
| **Enterprise** | Strict layer separation | Complex architectures | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 트리거 방식 | Description만 / Hooks 강제 / 하이브리드 | 하이브리드 | Description으로 안내, Hooks로 강제 |

---

## 7. Investigation Plan

### 7.1 분석 대상

| Category | Files | Count |
|----------|-------|-------|
| Skills | `skills/*/SKILL.md` | 18개 |
| Agents | `agents/*.md` | 11개 |
| Hooks | `hooks/hooks.json`, `hooks/session-start.sh` | 2개 |
| Scripts | `scripts/*.sh` | 18개 |

### 7.2 분석 항목

1. **Skills frontmatter**
   - `description` 필드의 "Triggers:" 키워드 패턴
   - `hooks` 정의 유무
   - `agent` 연결 상태

2. **Agents frontmatter**
   - `description` 필드의 트리거 패턴
   - `hooks` 정의 유무
   - `skills` 참조 상태

3. **Hooks 시스템**
   - SessionStart 이후 추가 훅 이벤트
   - PreToolUse/PostToolUse 실제 트리거 조건

---

## 8. Next Steps

1. [x] 모든 skills/agents frontmatter 수집 및 분석
2. [ ] 자동 트리거 실패 원인 정리
3. [ ] 개선 방안 설계 (`/pdca-design` 사용)
4. [ ] 개선 구현
5. [ ] 테스트 및 검증 (`/pdca-analyze` 사용)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-22 | Initial draft | User |
