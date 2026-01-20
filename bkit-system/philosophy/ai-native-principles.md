# AI-Native Development Principles

> AI-Native 개발의 핵심 원칙과 3대 역량

## AI-Native Development란?

```
Claude Code + PDCA Methodology + 9-Stage Pipeline + Zero Script QA
= AI-Native Development Framework
```

AI가 단순 코드 생성 도구가 아닌, **개발 프로세스 전체를 함께 이끄는 파트너**로 작동하는 개발 방식.

---

## 3 Core Competencies

AI-Native 개발에서 인간에게 요구되는 3가지 핵심 역량:

| Competency | Description | Without It |
|------------|-------------|------------|
| **Verification Ability** | AI 출력물이 올바른지 판단 | 그럴듯하지만 틀린 코드 생산 |
| **Direction Setting** | 무엇을 만들지 명확히 정의 | AI가 추측 기반 결과물 생성 |
| **Quality Standards** | 좋은 코드의 기준 제시 | 일관성 없는 코드베이스 |

### Implementation in bkit

| Competency | bkit Feature |
|------------|--------------|
| Verification | `gap-detector` agent, `/pdca-analyze` |
| Direction | Design-first workflow, templates |
| Quality | `code-analyzer` agent, `bkit-rules` skill |

---

## As-Is vs To-Be

### Development Process

| Aspect | As-Is (Traditional) | To-Be (With bkit) |
|--------|---------------------|-------------------|
| **Methodology** | Waterfall or Agile (manual) | Automated PDCA cycle |
| **Documentation** | Code first, docs later | Design first → Code → Auto-sync |
| **Quality Verification** | Manual QA team testing | Zero Script QA (log-based) |
| **Knowledge Sharing** | Scattered docs | Single Source of Truth (CLAUDE.md) |
| **Onboarding** | 2-4 weeks | Under 1 week (auto-referenced docs) |

### Team Composition

| Role | As-Is (10-person) | To-Be (bkit) | Change |
|------|-------------------|--------------|--------|
| **PM** | 1 | 0.5 | PDCA auto-tracking |
| **Senior Dev** | 2 | 1 | AI guides architecture |
| **Junior Dev** | 4 | 2 | 3x productivity with AI |
| **QA** | 2 | 0.5 | Zero Script QA |
| **Tech Writer** | 1 | 0 | Auto-generated docs |
| **Total** | **10** | **4** | **60% reduction** |

---

## Role Transformation

### Senior Developer

```
As-Is: Direct coding + Junior reviews + Architecture design
To-Be: AI verification + Direction setting + Quality standards
       (AI-Native conductor)
```

### Junior Developer

```
As-Is: Simple feature implementation, asks seniors questions
To-Be: Can implement complex features through AI collaboration
```

### QA Engineer

```
As-Is: Write and execute manual test scripts
To-Be: Monitor logs, discover edge cases with AI assistance
```

---

## Speed Improvements

| Feature Size | As-Is | To-Be (bkit) | Improvement |
|--------------|-------|--------------|-------------|
| Simple CRUD | 2-3 days | 2-4 hours | **80% faster** |
| Medium complexity | 1-2 weeks | 2-3 days | **70% faster** |
| Complex feature | 3-4 weeks | 1-2 weeks | **50% faster** |
| Full MVP | 3-6 months | 1-2 months | **60% faster** |

### Breakdown

```
1. Auto-generated boilerplate: -50% coding time
2. Design-code sync: -70% communication overhead
3. Zero Script QA: -80% QA time
4. Auto-documentation: -90% doc writing time
5. AI pair programming: -40% debugging time
```

---

## Quality Metrics

| Quality Metric | As-Is | To-Be (bkit) |
|----------------|-------|--------------|
| **Bug Discovery** | Post-release | During development |
| **Design-Implementation Gap** | 30-50% | Under 5% |
| **Code Consistency** | Varies by developer | Auto-applied conventions |
| **Security Vulnerabilities** | Found post-hoc | Pre-checked (Phase 7) |
| **Technical Debt** | Accumulates | Periodic analysis |

---

## Language Tier System (v1.2.1)

bkit은 AI-Native 개발에 최적화된 언어를 4단계로 분류:

| Tier | Category | Languages/Frameworks |
|------|----------|---------------------|
| **Tier 1** | AI-Native Essential | Python, TypeScript, JavaScript, React/Next.js |
| **Tier 2** | Mainstream Recommended | Go, Rust, Dart, Vue, Astro, Flutter |
| **Tier 3** | Domain Specific | Java, Kotlin, Swift, C/C++, Angular |
| **Tier 4** | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir |
| **Experimental** | Future Consideration | Mojo, Zig, V |

### Selection Criteria

- AI tool ecosystem compatibility (Copilot, Claude, Cursor)
- Vibe Coding optimization
- Market share (IEEE Spectrum)
- Training data availability

---

## Key Message

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "It's not about reducing developers,                         │
│    it's about letting developers focus on more valuable work"  │
│                                                                 │
│   • Repetitive tasks → AI handles                               │
│   • Creative design, business logic → Developers focus          │
│   • Documentation, QA → Automated                               │
│   • Direction setting, verification → Human's unique role       │
│                                                                 │
│   Result: Same team creates 3x more value                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [[core-mission]] - 핵심 사명과 철학
- [[pdca-methodology]] - PDCA 방법론
- [[../components/agents/_agents-overview]] - Agent 시스템
- [[../../skills/enterprise/SKILL]] - Enterprise skill (AI-Native 상세)
