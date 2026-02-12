# AI-Native 開発環境の全貌 — POPUP STUDIO の最先端ワークスペース

> **POPUP STUDIO PTE. LTD.** が自社開発した **bkit** (Claude Code プラグイン) と **bkend.ai** (BaaS プラットフォーム) を中核に、5つの MCP サーバーと16の AI エージェントが連携する、業界最先端の AI-Native 開発環境。

---

## 1. 会社概要

| 項目 | 内容 |
|------|------|
| **法人名** | POPUP STUDIO PTE. LTD. |
| **Web** | https://popupstudio.ai |
| **主要プロダクト** | bkit.ai (Claude Code Plugin), bkend.ai (BaaS), bkamp.ai(community) |
| **ライセンス** | Apache 2.0 |
| **対応言語** | 8言語 (EN, KO, JA, ZH, ES, FR, DE, IT) |

**自社開発プロダクト:**

- **bkit** — Claude Code 向け AI-Native 開発プラグイン。PDCA 方法論・CTO-Led Agent Teams・Context Engineering を実装した、Claude Code エコシステムにおける最も高度な開発フレームワーク。
- **bkend.ai** — MCP ネイティブの Backend-as-a-Service。OAuth 2.1 + PKCE 認証、データベース、ファイルストレージ、認証基盤を AI ツールから直接操作可能。

---

## 2. 環境全体像 — 何ができるか

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI-Native Workspace Architecture                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │   Claude Code (CLI)  │  │  Chrome Browser      │                 │
│  │   Opus 4.6 Model     │  │  自動操作            │                 │
│  └──────────┬───────────┘  └──────────┬───────────┘                 │
│             │                          │                             │
│  ┌──────────┴──────────────────────────┴───────────┐                │
│  │              MCP サーバー (5つ)                   │                │
│  │                                                   │                │
│  │  🔧 bkend.ai ──── BaaS (自社開発)               │                │
│  │  📊 Atlassian ─── Jira + Confluence              │                │
│  │  📧 Google ────── Gmail/Calendar/Drive/Docs/     │                │
│  │                    Sheets/Slides                   │                │
│  │  🤖 Gemini CLI ── セカンドオピニオン AI          │                │
│  │  🌐 Chrome ────── ブラウザ自動操作               │                │
│  └───────────────────────┬───────────────────────────┘               │
│                          │                                           │
│  ┌───────────────────────┴───────────────────────────┐              │
│  │          bkit Plugin v1.5.3 (自社開発)             │              │
│  │                                                     │              │
│  │  26 Skills | 16 Agents | 10 Hooks | 241 Functions  │              │
│  │  45 Scripts | 4 Output Styles | 13 Templates       │              │
│  │                                                     │              │
│  │  PDCA自動化 | CTO-Led Teams | Context Engineering  │              │
│  └─────────────────────────────────────────────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. MCP サーバー詳細 (5つ)

### 3.1 bkend.ai — 自社開発 BaaS プラットフォーム

**Firebase や Supabase に相当する BaaS を、MCP 経由で Claude Code から直接操作できる。**

```bash
# セットアップ (1コマンド)
claude mcp add bkend --transport http https://api.bkend.ai/mcp
# → ブラウザが自動で開き、OAuth 2.1 + PKCE で認証完了。API キー不要。
```

| サービス | 機能 | 詳細 |
|----------|------|------|
| **データベース** | スキーマ設計、CRUD、フィルタリング、ソート、ページネーション | 7カラム型、インデックス管理、スキーマバージョニング＋ロールバック |
| **認証** | Email/パスワード、ソーシャルログイン (Google, GitHub)、マジックリンク | JWT (Access 1h / Refresh 7d)、RBAC (admin/user/self/guest)、RLS |
| **ストレージ** | Presigned URL アップロード、CDN 配信、マルチパート | 4段階公開設定 (public/private/protected/shared) |

**MCP ツール (19個):**

- ガイドツール 8個 — コンテキスト取得、概念学習、チュートリアル、コード例
- API ツール 11個 — テーブル CRUD、フィールド管理、インデックス管理、スキーマロールバック

**REST API (34+ エンドポイント):**

- 認証系 18 エンドポイント (signup, signin, social OAuth, セッション管理)
- データ系 5 エンドポイント (CRUD + フィルタリング/ソート/ページネーション)
- ストレージ系 7 エンドポイント (Presigned URL、メタデータ管理、ダウンロード URL)

**リソース階層:**
```
Organization (チーム/課金)
  └─ Project (サービス単位)
      └─ Environment (dev/staging/prod — データ完全分離)
```

**bkit プラグインとの統合:**
- 専用 Agent: `bkend-expert` (Sonnet モデル、8言語トリガー対応)
- 専用 Skills 5個: quickstart, auth, data, storage, cookbook
- 10+ チュートリアルプロジェクト (Todo, Blog, EC, Chat, SaaS 等)
- 共有テンプレート: `bkend-patterns.md` (API パターン、エラーコード)

---

### 3.2 Atlassian — Jira + Confluence

プロジェクト管理とナレッジベースを AI が直接操作。

**Jira (30+ ツール):**

| カテゴリ | 操作 |
|----------|------|
| Issue 管理 | 作成、取得、更新、削除、バッチ作成、検索 |
| ワークフロー | トランジション実行、リンク作成/削除、Epic 連携 |
| スプリント | ボード取得、スプリント作成/更新、Issue 割当 |
| バージョン | プロジェクトバージョン作成/バッチ作成 |
| その他 | ワークログ、添付ダウンロード、変更ログ、ユーザープロフィール |

**Confluence (10+ ツール):**

| カテゴリ | 操作 |
|----------|------|
| ページ | 作成、更新、削除、子ページ取得 |
| 検索 | コンテンツ検索、ユーザー検索 |
| コラボ | コメント追加/取得、ラベル追加/取得 |

**活用例:** PDCA で生成した設計書を Confluence に自動公開、Jira チケットから実装→PR まで一気通貫。

---

### 3.3 Google Workspace — 6サービス統合

| サービス | 主な操作 |
|----------|----------|
| **Gmail** | メール検索・読取・送信・下書き・ラベル管理・添付取得・既読/未読切替 |
| **Calendar** | イベント CRUD・空き時間検索・参加回答・Quick Add |
| **Drive** | ファイル検索・コピー・移動・共有・権限管理・容量確認・ゴミ箱操作 |
| **Docs** | 文書作成・読取・テキスト置換/追加・見出し/テーブル挿入・コメント |
| **Sheets** | スプレッドシート作成・読書き・セル書式設定・シート管理・自動リサイズ |
| **Slides** | プレゼン作成・スライド追加/削除/複製/移動・テキスト操作 |

**活用例:** Gmail からタスク抽出 → Jira 登録、Calendar の空きを確認して会議設定、Sheets でテスト結果管理。

---

### 3.4 Gemini CLI — Google AI セカンドオピニオン

| ツール | 用途 |
|--------|------|
| `ask-gemini` | Gemini に技術質問を投げて別視点を得る |
| `brainstorm` | アイデアブレスト |
| `fetch-chunk` | 大規模コンテンツの分割取得・分析 |

**活用例:** Claude と Gemini のダブルチェックによる設計レビュー、アーキテクチャ決定の多角的検証。

---

### 3.5 Claude in Chrome — ブラウザ自動操作

| カテゴリ | ツール | 用途 |
|----------|--------|------|
| **ナビゲーション** | navigate, tabs_create/context | URL遷移、タブ管理 |
| **読取** | read_page, get_page_text, find | ページ内容取得、要素検索 |
| **操作** | form_input, computer, javascript_tool | フォーム入力、クリック、JS 実行 |
| **デバッグ** | read_console_messages, read_network_requests | コンソール/ネットワーク監視 |
| **記録** | gif_creator, upload_image | 操作の GIF 録画、画像アップロード |

**活用例:** 開発中の Web アプリの E2E テスト自動化、競合サイト分析、UI バグの GIF 記録。

---

## 4. bkit プラグイン — 自社開発 AI-Native フレームワーク

### 4.1 なぜ「最先端」なのか

bkit は単なる Claude Code のプラグインではない。**Context Engineering** という方法論に基づき、LLM が最適な推論を行えるよう、コンテキストを体系的に設計・注入するフレームワーク。

**従来の AI 開発:**
```
人間 → プロンプト → AI → 出力 → 人間がレビュー → やり直し...
```

**bkit の AI-Native 開発:**
```
人間 → 要件 → PDCA Plan → Design → [AI チーム並列実装] →
自動 Gap 分析 → 90% 未満なら自動改善 → 完了レポート
```

### 4.2 アーキテクチャ定量データ

| コンポーネント | 数量 | 説明 |
|---------------|:----:|------|
| **Skills** | 26 | 21 コア + 5 bkend 専門スキル |
| **Agents** | 16 | 11 コア + 5 CTO-Led チームエージェント |
| **Hook Events** | 10 | セッション開始からサブエージェント終了まで全ライフサイクル |
| **Hook Scripts** | 45 | Node.js 実行モジュール |
| **Library Functions** | 241 | 5モジュール (core/pdca/intent/task/team) |
| **Templates** | 13 | Plan/Design/Analysis/Report の各レベル対応 |
| **Output Styles** | 4 | learning, pdca-guide, enterprise, pdca-enterprise |
| **対応言語** | 8 | EN, KO, JA, ZH, ES, FR, DE, IT |

**品質実績 (v1.5.3):**
- テストケース: **646/646 PASS** (100%パス率、39 SKIP)
- Critical Issue: **0件**
- Regression Issue: **0件**

---

### 4.3 PDCA サイクル — 仕様駆動開発

全ての開発を **Plan → Design → Do → Check → Act → Report** の6フェーズで管理。

```
/pdca plan {feature}     →  docs/01-plan/ に要件定義書生成
        ↓
/pdca design {feature}   →  docs/02-design/ にアーキテクチャ設計書生成
        ↓
/pdca do {feature}       →  CTO-Led チームが並列実装
        ↓
/pdca analyze {feature}  →  docs/03-analysis/ に Gap 分析レポート生成
        ↓                    Match Rate < 90% → 自動改善 (最大5回)
/pdca iterate {feature}  →  Evaluator-Optimizer パターンで自動修正
        ↓                    Match Rate >= 90% → 完了
/pdca report {feature}   →  docs/04-report/ に完了レポート生成
```

**自動化レベル:**
- `manual` — 全手動
- `semi-auto` (デフォルト) — Check→Act 自動遷移
- `full-auto` — 全フェーズ自動遷移 (要所でレビューゲート)

---

### 4.4 CTO-Led Agent Teams — AI チーム並列開発

**1人の CTO エージェントが、複数の専門エージェントを指揮して並列開発を行う。**

```
CTO Lead (Opus) ─── プロジェクト全体を統括
    ├── Product Manager (Sonnet) ─── 要件分析・優先順位付け
    ├── Frontend Architect (Sonnet) ── UI/UX・コンポーネント設計
    ├── Security Architect (Opus) ──── 脆弱性分析・認証設計
    ├── QA Strategist (Sonnet) ─────── テスト戦略・品質指標
    └── bkend Expert (Sonnet) ─────── BaaS・API 設計
```

**オーケストレーションパターン:**

| パターン | 用途 | PDCA フェーズ |
|----------|------|--------------|
| **Leader** | CTO が指示、チームが実行 | Plan, Act |
| **Council** | 多角的視点で合議決定 | Design, Check |
| **Swarm** | 大規模並列実装 | Do |
| **Watchdog** | 品質監視 (Enterprise) | Act |

**チーム構成 (レベル別):**
- **Starter** — チームなし (直接ガイド)
- **Dynamic** — 3名 (QA + Frontend + Backend)
- **Enterprise** — 5名 (全ロール)

---

### 4.5 Context Engineering — プロンプトを超えた体系的設計

**5層コンテキスト注入アーキテクチャ:**

```
Layer 1: Domain Knowledge ──── 26 Skills (構造化された専門知識)
Layer 2: Behavioral Rules ──── 16 Agents (ロール別行動制約 + モデル選択)
Layer 3: State Management ──── 241 Functions (PDCA追跡、Intent検出、曖昧度スコアリング)
Layer 4: Dynamic Injection ─── Intent Detection (8言語自動トリガー)
Layer 5: Feedback Loop ──────── Match Rate → Evaluator-Optimizer 自動改善
```

**Intent Detection (意図検出):**
- 8言語でのキーワード自動マッチング
- Agent トリガー信頼度閾値: `>= 0.8`
- Ambiguity Score (曖昧度): 0〜1 の float 値で意図の明確さを数値化
- 曖昧な場合は自動で clarifying question を生成

**タスク自動分類:**

| 分類 | 行数 | 対応 |
|------|------|------|
| Quick Fix | < 50行 | 即時対応 |
| Minor Change | 50-200行 | PDCA 推奨 |
| Feature | 200-1000行 | PDCA 必須 |
| Major Feature | > 1000行 | CTO Team + PDCA |

---

### 4.6 Hook System — 全ライフサイクル制御

10のイベントと45のスクリプトで、AI の行動を全段階で制御。

| Hook Event | トリガー | 用途 |
|------------|---------|------|
| **SessionStart** | セッション開始時 | プロジェクトコンテキスト初期化、PDCA 状態復元 |
| **UserPromptSubmit** | ユーザー入力時 | 意図検出、言語判定、Agent/Skill ルーティング |
| **PreToolUse** (Write/Bash) | ツール実行前 | 設計書との整合性チェック、権限検証 |
| **PostToolUse** (Write/Bash/Skill) | ツール実行後 | PDCA 状態更新、コンテキスト反映 |
| **PreCompact** | コンテキスト圧縮前 | スナップショット保存、重要コンテキスト保護 |
| **TaskCompleted** | タスク完了時 | PDCA フェーズ自動遷移 |
| **SubagentStart** | サブエージェント起動 | エージェントライフサイクル追跡 (v1.5.3 新機能) |
| **SubagentStop** | サブエージェント終了 | 完了/失敗検出、進捗更新 (v1.5.3 新機能) |
| **TeammateIdle** | チームメイト待機 | チーム状態同期 |
| **Stop** | セッション終了 | 最終状態永続化、クリーンアップ |

---

### 4.7 Team Visibility — Studio IPC (v1.5.3 新機能)

`.bkit/agent-state.json` にリアルタイムでチーム状態を書き出し、外部ツール (bkit Studio) との連携を実現。

```json
{
  "version": "1.0",
  "teamName": "cto-team-{feature}",
  "pdcaPhase": "do",
  "orchestrationPattern": "swarm",
  "teammates": [
    { "name": "frontend-architect", "status": "active", "model": "sonnet" },
    { "name": "bkend-expert", "status": "idle", "model": "sonnet" }
  ],
  "progress": {
    "totalTasks": 10,
    "completedTasks": 7,
    "inProgressTasks": 2
  }
}
```

State Writer モジュール (9関数): アトミック書き込み (temp+rename)、リングバッファメッセージ管理 (最大50件)、最大10チームメイト追跡。

---

### 4.8 Zero Script QA — テストコード不要の品質検証

**従来:** テストコードを書く → 実行 → メンテナンス → 壊れたら修正...

**Zero Script QA:** 構造化ログ + Docker リアルタイム監視で、テストスクリプトなしに品質を検証。

```
1. 構造化 JSON ログ (timestamp, level, service, request_id, message, data)
2. Request ID の全スタック伝播
3. Docker コンテナログのリアルタイム監視
4. Claude Code がログを分析し、即座に問題を特定・文書化
```

---

## 5. 実戦シナリオ — どう組み合わせるか

### シナリオ A: フルスタック SaaS MVP 開発

```
1. /pdca plan my-saas          → 要件定義書を自動生成
2. /pdca design my-saas        → アーキテクチャ設計 (bkend.ai をバックエンドに選定)
3. bkend MCP でテーブル設計     → データベーススキーマを Claude Code から直接作成
4. CTO Team が並列実装          → Frontend + Backend + Auth を同時進行
5. /pdca analyze my-saas       → Gap 分析で設計との乖離を自動検出
6. Chrome 自動操作で E2E テスト → gif_creator で動作確認を GIF 録画
7. /pdca report my-saas        → 完了レポート自動生成
8. Confluence に設計書公開       → Atlassian MCP で自動アップロード
```

### シナリオ B: Jira 駆動の開発フロー

```
1. Jira MCP で Issue 一覧取得    → 優先度順にタスク把握
2. Issue から /pdca plan 自動生成 → Jira の説明文を要件として取り込み
3. 実装 → PR 作成               → GitHub CLI で PR 作成
4. Gap 分析 → 自動改善           → 90% 以上になるまで自動反復
5. Jira Issue をトランジション    → MCP で "Done" に自動遷移
6. Confluence にレポート公開      → ナレッジとして蓄積
```

### シナリオ C: マルチ AI レビュー

```
1. Claude Code で実装
2. /code-review で自動コードレビュー
3. Gemini CLI でセカンドオピニオン取得
4. Security Architect エージェントで脆弱性チェック
5. 3つの AI 視点を統合して最終判断
```

### シナリオ D: Google Workspace 自動化

```
1. Gmail から未読メールを検索 → 技術的な問い合わせを抽出
2. Calendar で空き時間を確認 → 対応時間を自動提案
3. Sheets にタスクリスト更新 → 進捗管理を自動化
4. Docs に議事録作成         → 会議メモを構造化して保存
```

---

## 6. 数字で見る AI-Native の生産性

### 従来開発 vs AI-Native 開発

| 指標 | 従来開発 | AI-Native (bkit) |
|------|---------|-------------------|
| **仕様→実装** | 数日〜数週間 | 2-3 会話セッション |
| **品質検証** | テストコード作成 + メンテナンス | Zero Script QA (テストコード不要) |
| **設計書** | 手動作成 (テクニカルライター) | 自動生成 + テンプレート |
| **チーム構成** | PM 1 + Senior 2 + Junior 4 + QA 2 + Security 1 + TW 1 = **11名** | **4名相当** (64% 削減) |
| **品質反復** | 手動レビュー → 修正 → 再レビュー | Evaluator-Optimizer 自動 (最大5回) |
| **多言語対応** | 翻訳リソース別途 | 8言語ネイティブ対応 |
| **ナレッジ管理** | Wiki 手動更新 | PDCA ドキュメント自動蓄積 |

### bkit 品質実績

| バージョン | テストケース | パス率 |
|-----------|:----------:|:-----:|
| v2.1.31 互換 | 101 TC | 99%+ |
| v2.1.33 互換 | 673 TC | 99.5% |
| v1.5.3 最終 | 646 TC | **100%** |

---

## 7. 技術的革新のまとめ

### 自社開発の競争優位性

1. **bkit** — Claude Code 向け唯一の PDCA + Agent Teams + Context Engineering フレームワーク
2. **bkend.ai** — MCP ネイティブ設計の BaaS (AI ツールからの直接操作を前提に設計)
3. **両者の統合** — Plan から Deploy まで、外部サービスに依存せず自社エコシステムで完結

### 業界初の実装

| 革新 | 説明 |
|------|------|
| **Context Engineering** | プロンプトではなくコンテキストの体系的設計 (5層アーキテクチャ) |
| **CTO-Led Agent Teams** | AI エージェントチームによる並列 PDCA 実行 |
| **Zero Script QA** | テストスクリプトなしのログベース品質検証 |
| **8言語 Intent Detection** | ユーザーの自然言語入力から意図を8言語で自動判定 |
| **Evaluator-Optimizer** | 90% Match Rate を閾値とした自動品質改善ループ |
| **Team Visibility / Studio IPC** | エージェントチームの状態をリアルタイムで外部可視化 |
| **MCP-Native BaaS** | AI ツールからの直接操作を前提としたバックエンド基盤 |

### ワークスペース統合図

```
┌─────────────────────── POPUP STUDIO AI-Native Workspace ───────────────────────┐
│                                                                                 │
│  自社開発                          外部連携                                     │
│  ┌─────────────┐                   ┌─────────────────┐                         │
│  │  bkit v1.5.3 │ ←── Plugin ────→ │  Claude Code    │                         │
│  │  26 Skills   │                   │  (Opus 4.6)     │                         │
│  │  16 Agents   │                   └────────┬────────┘                         │
│  │  241 Funcs   │                            │                                  │
│  └──────┬───────┘                            │ MCP                              │
│         │                        ┌───────────┼───────────┐                      │
│  ┌──────┴───────┐    ┌──────────┴──┐  ┌─────┴─────┐  ┌──┴──────────┐          │
│  │ bkend.ai     │    │ Atlassian   │  │ Google    │  │ Chrome      │          │
│  │ (自社 BaaS)  │    │ Jira+Confl. │  │ Workspace │  │ 自動操作    │          │
│  │ DB/Auth/File │    │ 30+ tools   │  │ 6 services│  │ 15+ tools   │          │
│  └──────────────┘    └─────────────┘  └───────────┘  └─────────────┘          │
│                                                                                 │
│  開発フロー:                                                                    │
│  要件 → PDCA Plan → Design → [AI チーム並列 Do] → Gap 分析 →                   │
│  自動改善 (< 90%) → Report → Jira 完了 → Confluence 公開                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

> **結論:** POPUP STUDIO は、自社開発の bkit と bkend.ai を中核に、5つの MCP サーバーと16の AI エージェントを統合した、業界最先端の AI-Native 開発環境を構築している。従来11名で行っていた開発を4名相当で実現し、PDCA サイクルの自動化・CTO-Led チーム並列開発・Zero Script QA など、他に類を見ない革新的手法を実装している。
