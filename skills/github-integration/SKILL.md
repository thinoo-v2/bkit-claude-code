---
name: github-integration
description: |
  GitHub integration skill for repository statistics and automation.
  Collects GitHub metrics and integrates with external tools.

  "stats" 또는 "report"로 통계 수집 시작.

  Use proactively when user asks about GitHub statistics, repository metrics,
  or wants to track project growth.

  Triggers: github stats, repository statistics, traffic, stars, forks,
  깃허브 통계, 레포지토리 분석, GitHub レポート, 仓库统计

  Do NOT use for: code commits, PR creation, or git operations (use Bash for those).
argument-hint: "[stats|report|setup]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - mcp__mcp-atlassian__*
user-invocable: true
next-skill: null
pdca-phase: null
task-template: "[GitHub] {action}"
---

# GitHub Integration Skill

> Track and analyze GitHub repository metrics

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `stats` | GitHub 통계 수집 | `/github-integration stats` |
| `report` | Confluence 보고서 업데이트 | `/github-integration report` |
| `setup` | GitHub Actions 워크플로우 설정 | `/github-integration setup` |

### stats

GitHub API를 통해 다음 데이터 수집:

```bash
# Basic repo info (stars, forks, watchers)
gh repo view {owner}/{repo} --json stargazerCount,forkCount,watchers,issues,pullRequests

# Traffic views (last 14 days)
gh api repos/{owner}/{repo}/traffic/views

# Clone statistics (last 14 days)
gh api repos/{owner}/{repo}/traffic/clones

# Referrer sources
gh api repos/{owner}/{repo}/traffic/popular/referrers

# Popular content paths
gh api repos/{owner}/{repo}/traffic/popular/paths
```

### report

Confluence 페이지에 통계 보고서 업데이트 (Atlassian MCP 사용).

### setup

GitHub Actions 워크플로우 설정:
- CI/CD 파이프라인
- 자동 문서 업데이트
- PR 자동화

## Report Content

1. **Header**
   - 보고서 날짜
   - GitHub API 14일 제한 안내

2. **Basic Info**
   - 저장소 이름과 설명
   - 생성일, 마지막 푸시 날짜

3. **Popularity Metrics**
   - Stars, Forks, Watchers
   - Open Issues, Open PRs

4. **Traffic Summary (Last 14 Days)**
   - 총 조회수, 고유 방문자
   - 총 클론 수, 고유 클론 사용자

5. **Daily Views Table**
   - 날짜, 조회수, 고유 방문자

6. **Daily Clones Table**
   - 날짜, 클론 수, 고유 사용자

7. **Referrer Sources**
   - 출처, 횟수, 고유 방문자

8. **Popular Content TOP 10**
   - 순위, 페이지, 조회수, 고유 방문자

9. **Key Insights**
   - 성장 트렌드
   - 전환율 (조회→클론)
   - 마케팅 효과
   - 기술적 관심 영역

## Output Format

```
📊 GitHub Statistics Collection Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Summary (as of {date})
• Stars: {count}
• Forks: {count}
• Views (14d): {count} ({unique} unique)
• Clones (14d): {count} ({unique} unique)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Report generated successfully

💡 Next collection: Run /github-integration stats again tomorrow
```

## Important Notes

- GitHub Traffic API only provides **last 14 days** of data
- 이전 데이터는 복구할 수 없으므로 정기적인 수집 필수
- 14일간 매일 실행하여 완전한 트래픽 이력 구축
- 이후 주간 수집으로 트렌드 분석 가능

## Error Handling

| Error | Solution |
|-------|----------|
| gh CLI not authenticated | Run `gh auth login` |
| Confluence API error | Check MCP Atlassian configuration |
| Rate limit exceeded | Wait and retry later |

## Prerequisites

```bash
# GitHub CLI 설치 확인
gh --version

# GitHub 인증 확인
gh auth status

# Repository 접근 권한 확인
gh repo view {owner}/{repo}
```

## Schedule Recommendation

- **Initial setup**: 14일간 매일 수집
- **Maintenance**: 주 1회 수집으로 트렌드 분석
- **Important releases**: 릴리스 전후 수집하여 영향 측정
