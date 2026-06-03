# CLAUDE.md & Skills 学習ガイド — リサーチノート

**調査日:** 2026-05-22
**対象:** Claude Code CLI のCLAUDE.md + Agent Skills

---

## Part 1: CLAUDE.md

### 1.1 概要
- CLAUDE.mdはClaude Codeがタスク実行時に自動読み込みするMarkdownファイル
- プロジェクト固有のコーディング規約、アーキテクチャ、ワークフローを伝える
- **毎リクエスト**で読み込まれる（コンテキストウィンドウに常駐）

### 1.2 階層構造（4層）

| レイヤー | ファイルパス | スコープ | Git管理 |
|---------|------------|---------|---------|
| Managed Policy | 企業管理者設定（Enterprise） | 組織全体 | N/A |
| User | `~/.claude/CLAUDE.md` | ユーザー個人、全プロジェクト共通 | ✗（.gitignoreに含めるべき） |
| Project | `./CLAUDE.md`（リポジトリルート） | プロジェクト全体、チーム共有 | ✓（チームで共有） |
| Local | `./CLAUDE.local.md` | 個人のローカル設定 | ✗（.gitignore推奨） |

### 1.3 ロード順序
1. Managed Policy（存在すれば最優先）
2. User CLAUDE.md (`~/.claude/CLAUDE.md`)
3. カレントディレクトリからルートまでディレクトリツリーを上方向にウォーク
   - 各ディレクトリの `CLAUDE.md` と `CLAUDE.local.md` を読む
4. サブディレクトリの `CLAUDE.md` は**オンデマンド**でロード
   - Claudeがそのサブディレクトリのファイルを操作する時に初めて読み込まれる

### 1.4 インポート構文

```markdown
@path/to/file.md
```

- 相対パス（CLAUDE.mdからの相対）または絶対パス
- 最大 **5ホップ** の再帰インポート
- インポート先もMarkdownとして処理される
- 大きなCLAUDE.mdを分割する手段として有効
- 例: `@docs/coding-standards.md`, `@.claude/rules/testing.md`

### 1.5 パススコープルール

ディレクトリ: `.claude/rules/`

```yaml
---
paths:
  - "src/frontend/**/*.tsx"
  - "src/frontend/**/*.ts"
---

フロントエンドコードでは React 18 の関数コンポーネントのみ使用すること。
クラスコンポーネントは禁止。
```

- YAMLフロントマターの `paths` フィールドでglob指定
- マッチするファイルを操作する時のみロードされる（オンデマンド）
- 複数ルールファイルを配置可能
- グロブ構文: `*`, `**`, `?`, `[abc]` など標準glob

### 1.6 自動メモリ (MEMORY.md)

| 項目 | 値 |
|------|-----|
| 格納場所 | `~/.claude/projects/<project-hash>/memory/` |
| インデックスファイル | `MEMORY.md`（先頭200行 or 25KB） |
| 個別メモリファイル | `memory/` ディレクトリ内の `.md` ファイル |
| メモリタイプ | user, feedback, project, reference |
| 自動更新 | Claudeが会話中に学んだことを自動保存 |
| 手動操作 | `/memory` コマンドで管理 |

### 1.7 サブエージェント挙動

| エージェントタイプ | CLAUDE.md | メモリ |
|------------------|-----------|--------|
| Explore | ❌ スキップ | ❌ |
| Plan | ❌ スキップ | ❌ |
| その他のサブエージェント | ✅ 完全な階層を継承 | ✅ |

### 1.8 ベストプラクティス

- **推奨サイズ**: 200行以下
- 5,000トークンのCLAUDE.mdは毎リクエストにコスト発生
- 参照資料の分離で1,000行→80行に削減した実績あり
- コーディングスタイル、アーキテクチャ決定、ワークフロー指示を記載
- 具体的な指示 > 曖昧な指示（「テストを書け」より「pytestでテストを書き、カバレッジ80%以上」）
- 命令遵守限界: ~150-200命令を超えると遵守率が低下
- コンテキスト充填率: 30%以下を目標

### 1.9 CLAUDE.md vs CLAUDE.local.md

| | CLAUDE.md | CLAUDE.local.md |
|---|-----------|-----------------|
| 共有 | チーム全員 | 個人のみ |
| Git | コミット対象 | .gitignore推奨 |
| 用途 | プロジェクト規約 | 個人の環境・好み |
| 例 | テストフレームワーク指定 | エディタ設定、個人パス |

---

## Part 2: Skills (Agent Skills)

### 2.1 概要
- Skillsはオンデマンドでロードされる再利用可能な手続き（プロシージャ）
- CLAUDE.mdとは異なり、必要な時だけコンテキストに入る
- `.claude/skills/` ディレクトリに `SKILL.md` ファイルとして配置
- スラッシュコマンドまたはモデルの自動判断で起動

### 2.2 プログレッシブ開示（3段階）

| レベル | 内容 | サイズ | タイミング |
|--------|------|--------|-----------|
| Level 1 | メタデータ（名前・説明） | ~100 tokens | **常時ロード** |
| Level 2 | 指示本文（Markdown） | 可変 | トリガー時 |
| Level 3 | リソース・ファイル | 可変 | 必要時 |

- Level 1のコストは最小限（~100トークン/スキル）
- 埋め込みではなくオンデマンドロードで**約30%トークン節約**

### 2.3 SKILL.md ファイル形式

```markdown
---
name: deploy
description: プロダクション環境へのデプロイ手順
when_to_use: ユーザーがデプロイについて質問した時
user-invocable: true
arguments:
  - name: environment
    description: デプロイ先環境
    required: true
    type: string
  - name: dry-run
    description: ドライラン実行
    required: false
    type: boolean
    default: "false"
allowed-tools:
  - Bash
  - Read
  - Write
model: sonnet
effort: high
---

# デプロイ手順

$ARGUMENTS[environment] 環境へのデプロイを実行します。

1. テストの実行
2. ビルド
3. デプロイ
```

### 2.4 フロントマター全フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | ✓ | スキル名（スラッシュコマンド名） |
| `description` | string | ✓ | 短い説明文（Level 1メタデータ、常時表示） |
| `when_to_use` | string | - | モデルが自動起動する条件の記述 |
| `arguments` | array | - | 引数定義（name, description, required, type, default） |
| `disable-model-invocation` | boolean | - | trueでモデルの自動起動を禁止（ユーザー明示のみ） |
| `user-invocable` | boolean | - | ユーザーがスラッシュコマンドで直接呼べるか |
| `allowed-tools` | array | - | スキル実行中に使えるツールの制限 |
| `model` | string | - | 使用モデルの指定（opus, sonnet, haiku） |
| `effort` | string | - | 推論努力レベル（low, medium, high, max） |
| `context` | object | - | 追加コンテキスト（files, commands, mcp-tools） |
| `agent` | boolean | - | サブエージェントとして実行するか |
| `hooks` | object | - | スキル固有のフック定義 |
| `paths` | array | - | スキルが適用されるファイルパスglob |
| `shell` | string | - | Bashツールで使うシェル指定 |

#### `context` サブフィールド

```yaml
context:
  files:
    - path: "src/config.ts"
      description: "設定ファイル"
    - path: "docs/api.md"
  commands:
    - command: "git log --oneline -5"
      description: "最近のコミット"
  mcp-tools:
    - server: github
      tool: list_issues
```

#### `arguments` サブフィールド

```yaml
arguments:
  - name: target
    description: "ビルドターゲット"
    required: true
    type: string          # string | boolean | number
    default: "production"
```

### 2.5 文字列置換

| 変数 | 説明 | 例 |
|------|------|----|
| `$ARGUMENTS` | 全引数をスペース区切り | `/deploy staging --dry-run` → `staging --dry-run` |
| `$ARGUMENTS[N]` | N番目の引数（0始まり） | `$ARGUMENTS[0]` → `staging` |
| `$N` | N番目の引数のショートカット | `$0` → `staging` |
| `$name` | 名前付き引数 | `$environment` → `staging` |
| `${CLAUDE_SESSION_ID}` | セッションID | UUID形式 |
| `${CLAUDE_EFFORT}` | 現在のeffort設定 | `high` |
| `${CLAUDE_SKILL_DIR}` | スキルファイルのディレクトリ | `.claude/skills/` |

### 2.6 動的コンテキスト注入

```markdown
現在のブランチ情報:
!`git branch --show-current`

最近の変更:
!`git diff --stat HEAD~3`
```

- `!`command`` 構文でシェルコマンドをスキルロード前に実行
- 結果がMarkdown内に展開されてからClaudeに渡される
- ビルド状態、Git情報、環境情報などの動的データに有効

### 2.7 呼び出し方法

| 方法 | 構文 | 条件 |
|------|------|------|
| ユーザー明示 | `/skillname args` | `user-invocable: true` |
| ユーザー明示（代替） | `/run skillname args` | 同上 |
| モデル自動 | （Claudeが自動判断） | `when_to_use` にマッチ |

### 2.8 自動コンパクション

- 各スキルの先頭 **5,000トークン** を保持
- 合計 **25,000トークン** 予算
- 最も最近使用されたスキルが優先
- コンテキストが長くなると古いスキルコンテキストが自動削除

### 2.9 ディレクトリ構造

```
.claude/
├── skills/
│   ├── deploy/
│   │   └── SKILL.md
│   ├── test-runner/
│   │   └── SKILL.md
│   ├── code-review/
│   │   └── SKILL.md
│   └── SKILL.md          ← ルートレベルスキルも可
├── rules/
│   ├── frontend.md
│   └── backend.md
└── settings.json
```

---

## Part 3: CLAUDE.md vs Skills 比較

### 3.1 使い分け判断

| 基準 | CLAUDE.md | Skills |
|------|-----------|--------|
| ロードタイミング | 毎リクエスト（常時） | 必要時のみ（オンデマンド） |
| コンテンツ性質 | 永続的な知識・ルール | 手続き的な操作手順 |
| トークンコスト | 常時消費 | 使用時のみ消費（Level 1除く） |
| 適した内容 | コーディング規約、アーキテクチャ | デプロイ手順、テスト実行、コードレビュー |
| サイズ推奨 | 200行以下 | 制限緩い（オンデマンドのため） |
| 引数 | なし | あり（型・必須・デフォルト指定可） |
| ツール制限 | なし | `allowed-tools` で制限可能 |

### 3.2 判断フローチャート

```
開始
├─ 毎回の会話で必要？
│  ├─ YES → CLAUDE.md
│  └─ NO → 特定タスクのトリガー？
│     ├─ YES → Skills
│     └─ NO → パス限定のルール？
│        ├─ YES → .claude/rules/（パススコープ）
│        └─ NO → CLAUDE.md（短く簡潔に）
```

---

## Part 4: チーム運用

### 4.1 Git管理戦略

| ファイル | コミット | 理由 |
|---------|---------|------|
| `CLAUDE.md` | ✓ | チーム共有の規約 |
| `CLAUDE.local.md` | ✗ | 個人設定 |
| `.claude/skills/` | ✓ | チーム共有のワークフロー |
| `.claude/rules/` | ✓ | パス限定ルール |
| `MEMORY.md` | ✗ | 自動生成、個人コンテキスト |

### 4.2 AGENTS.md クロスツール標準

```bash
# CLAUDE.mdの内容をAGENTS.mdとしても利用可能にする
ln -s CLAUDE.md AGENTS.md
```

- 複数のAIツール間で共通の指示ファイルとして機能
- AGENTS.md: Cursor, GitHub Copilot等が参照する規格
- symlink方式でメンテナンスコスト削減

### 4.3 セキュリティ

- CLAUDE.mdにシークレット（APIキー、パスワード）を記載しない
- `allowed-tools` でスキルのツールアクセスを制限
- サブエージェントの権限は親の設定を継承
- `.claude/settings.json` のパーミッション設定で追加制御
- プロンプトインジェクション対策: 外部データをCLAUDE.mdに直接含めない

### 4.4 よくある間違い

1. **CLAUDE.mdの肥大化**: 1,000行超えでトークンコスト増大・遵守率低下
2. **重複指示**: CLAUDE.mdとスキルに同じ内容を書く
3. **パス未指定**: 特定ファイルにのみ適用すべきルールをグローバルに記載
4. **スキル乱用**: 毎回必要な情報をスキルに入れる（常時ロードされないため漏れる）
5. **メモリ依存**: 重要な指示をMEMORY.mdに入れる（200行制限、不安定）
6. **曖昧な指示**: 「きれいなコードを書け」（解釈が不定）

### 4.5 パフォーマンスTips

- CLAUDE.mdは200行以下に保つ
- 大きな参照資料は `@path` でインポート分離
- スキルのLevel 1メタデータは簡潔に（description ~1行）
- 不要なスキルは削除（Level 1でも100トークン/スキル）
- パススコープルールで必要時のみロード
- コンテキスト充填率30%以下を目標

---

## 情報源

1. https://docs.claude.com/en/docs/claude-code/memory
2. https://docs.claude.com/en/docs/claude-code/settings
3. https://docs.claude.com/en/docs/claude-code/slash-commands
4. https://code.claude.com/docs/en/commands.md
5. https://code.claude.com/docs/en/memory.md
6. Claude Code CLI v2.1.121 内部ドキュメント
