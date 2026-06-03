# Claude Code コマンドリファレンス — リサーチデータ

**バージョン:** Claude Code CLI v2.1.121
**調査日:** 2026-05-22
**情報源:** 公式ドキュメント (docs.claude.com / code.claude.com) + `claude --help` 出力

---

## 1. CLIコマンド

### 1.1 メインコマンド: `claude`
- **構文:** `claude [options] [command] [prompt]`
- **説明:** Claude Code を起動（デフォルトは対話モード、`-p`で非対話出力）

**主要オプション:**
| フラグ | 省略形 | 説明 |
|--------|--------|------|
| `--model <model>` | - | モデル指定（'sonnet', 'opus', 'claude-sonnet-4-6' 等） |
| `--print` | `-p` | 応答を出力して終了（パイプ用） |
| `--continue` | `-c` | 直近の会話を続行 |
| `--resume [value]` | `-r` | セッションIDで会話を再開、またはピッカー表示 |
| `--name <name>` | `-n` | セッション表示名を設定 |
| `--version` | `-v` | バージョン番号を表示 |
| `--help` | `-h` | ヘルプ表示 |
| `--debug [filter]` | `-d` | デバッグモード有効化（カテゴリフィルタ可） |
| `--verbose` | - | 詳細モード |
| `--worktree [name]` | `-w` | 新しいgit worktreeを作成 |
| `--add-dir <dirs...>` | - | ツールアクセスを許可する追加ディレクトリ |
| `--allowedTools <tools...>` | - | 許可するツール名リスト |
| `--disallowedTools <tools...>` | - | 拒否するツール名リスト |
| `--system-prompt <prompt>` | - | セッション用システムプロンプト |
| `--append-system-prompt <prompt>` | - | デフォルトプロンプトに追記 |
| `--model <model>` | - | モデル指定 |
| `--effort <level>` | - | 推論レベル（low, medium, high, xhigh, max） |
| `--permission-mode <mode>` | - | 権限モード（default, auto, plan, acceptEdits, dontAsk, bypassPermissions） |
| `--output-format <format>` | - | 出力形式（text, json, stream-json）※-p時のみ |
| `--input-format <format>` | - | 入力形式（text, stream-json）※-p時のみ |
| `--json-schema <schema>` | - | 構造化出力用JSONスキーマ |
| `--max-budget-usd <amount>` | - | API呼び出し上限金額 ※-p時のみ |
| `--mcp-config <configs...>` | - | MCP設定JSONファイル読み込み |
| `--dangerously-skip-permissions` | - | 全権限チェックをバイパス（サンドボックス推奨） |
| `--bare` | - | 最小モード（フック、LSP等をスキップ） |
| `--ide` | - | 起動時にIDEに自動接続 |
| `--file <specs...>` | - | 起動時にダウンロードするファイル |
| `--from-pr [value]` | - | PRにリンクされたセッションを再開 |
| `--fork-session` | - | 再開時に新セッションIDを作成 |
| `--session-id <uuid>` | - | 特定のセッションIDを使用 |
| `--agents <json>` | - | カスタムエージェントのJSON定義 |
| `--agent <agent>` | - | セッション用エージェント指定 |
| `--fallback-model <model>` | - | 過負荷時のフォールバックモデル ※-p時のみ |
| `--tmux` | - | worktree用tmuxセッション作成 |
| `--betas <betas...>` | - | APIリクエストに含めるベータヘッダー |
| `--settings <file-or-json>` | - | 追加設定ファイルまたはJSON |
| `--setting-sources <sources>` | - | 読み込む設定ソース（user, project, local） |
| `--plugin-dir <path>` | - | プラグインディレクトリ指定 |
| `--tools <tools...>` | - | 利用可能ツールの指定 |
| `--disable-slash-commands` | - | 全スキルを無効化 |
| `--no-session-persistence` | - | セッション永続化を無効 ※-p時のみ |
| `--chrome` / `--no-chrome` | - | Chrome連携の有効/無効 |

### 1.2 サブコマンド一覧

| コマンド | 説明 |
|---------|------|
| `claude agents` | バックグラウンド/設定済みエージェント管理 |
| `claude auth` | 認証管理 |
| `claude auth login` | Anthropicアカウントにサインイン |
| `claude auth logout` | ログアウト |
| `claude auth status` | 認証状態表示 |
| `claude auto-mode` | 自動モード分類器設定の確認 |
| `claude auto-mode config` | 有効な自動モード設定をJSON出力 |
| `claude auto-mode defaults` | デフォルト自動モードルールをJSON出力 |
| `claude auto-mode critique` | カスタム自動モードルールのAIフィードバック |
| `claude doctor` | 自動アップデーターのヘルスチェック |
| `claude install [target]` | ネイティブビルドのインストール |
| `claude mcp` | MCPサーバーの設定・管理 |
| `claude mcp add` | MCPサーバーを追加 |
| `claude mcp add-json` | JSON文字列でMCPサーバー追加 |
| `claude mcp add-from-claude-desktop` | Claude DesktopからMCPサーバーをインポート |
| `claude mcp get` | MCPサーバーの詳細取得 |
| `claude mcp list` | 設定済みMCPサーバーの一覧 |
| `claude mcp remove` | MCPサーバーの削除 |
| `claude mcp reset-project-choices` | プロジェクトスコープサーバーの承認/拒否をリセット |
| `claude mcp serve` | Claude Code MCPサーバーを起動 |
| `claude plugin` | プラグイン管理 |
| `claude plugin install` | プラグインのインストール |
| `claude plugin uninstall` | プラグインのアンインストール |
| `claude plugin list` | インストール済みプラグインの一覧 |
| `claude plugin enable` / `disable` | プラグインの有効化/無効化 |
| `claude plugin update` | プラグインの更新 |
| `claude plugin marketplace` | マーケットプレイス管理 |
| `claude setup-token` | 長期認証トークンの設定 |
| `claude update` | アップデート確認・インストール |
| `claude ultrareview [target]` | クラウドマルチエージェントコードレビュー |

---

## 2. スラッシュコマンド

| コマンド | 説明 |
|---------|------|
| `/help` | 利用可能なコマンドを表示 |
| `/clear` | 新しいセッションを開始 |
| `/compact` | 会話コンテキストを要約・圧縮 |
| `/model` | AIモデルを変更 |
| `/effort` | 推論エフォートレベルを設定 |
| `/plan` | プランモードに入る |
| `/review` | プルリクエストをレビュー |
| `/security-review` | 現在のブランチのセキュリティレビュー |
| `/simplify` | コードの品質・効率をレビュー |
| `/init` | CLAUDE.mdファイルを初期化 |
| `/memory` | メモリファイルとオートメモリを編集 |
| `/mcp` | MCPサーバーを管理 |
| `/agents` | サブエージェントを管理 |
| `/loop` | プロンプトを定期実行 |
| `/batch` | 大規模変更のオーケストレーション |
| `/diff` | インタラクティブ差分を表示 |
| `/branch` / `/fork` | 会話のブランチを作成 |
| `/resume` | 以前の会話に戻る |
| `/context` | コンテキスト使用量を可視化 |
| `/permissions` | ツール権限を管理 |
| `/config` | 設定インターフェースを開く |
| `/doctor` | インストールの診断 |
| `/hooks` | フック設定を表示 |
| `/keybindings` | キーボードショートカットを設定 |
| `/schedule` / `/routines` | スケジュール済みタスクを作成 |
| `/usage` | コストと使用量を表示 |
| `/recap` | セッション要約を生成 |
| `/voice` | 音声入力の制御 |
| `/desktop` | デスクトップアプリに引き継ぎ |
| `/skills` | 利用可能なスキルを管理 |
| `/plugin` | プラグインを管理 |
| `/btw` | 履歴に追加せず質問 |
| `/run` | アプリを起動・操作 |
| `/verify` | ビルド・実行して変更を確認 |
| `/terminal-setup` | ターミナルキーバインドをインストール |
| `/terminal-config` | ターミナル設定 |
| `/theme` | テーマを変更 |
| `/debug` | デバッグ設定 |

---

## 3. キーボードショートカット

### 3.1 一般操作
| キー | 動作 |
|------|------|
| Ctrl+C | 中断、または入力をクリア |
| Ctrl+D | Claude Codeセッションを終了 |
| Ctrl+L | 画面を再描画 |
| Ctrl+O | トランスクリプトビューアを切替 |
| Ctrl+R | コマンド履歴を逆検索 |
| Ctrl+B | 実行中タスクをバックグラウンドへ |
| Ctrl+T | タスクリストを切替 |
| Ctrl+X Ctrl+K | 全バックグラウンドサブエージェントを停止（3秒以内に2回） |
| Ctrl+G / Ctrl+X Ctrl+E | デフォルトテキストエディタで開く |
| Ctrl+V / Cmd+V (iTerm2) / Alt+V (Windows) | クリップボードから画像を貼り付け |
| Esc | Claudeを中断 |
| Esc Esc | 入力ドラフトをクリア、または巻き戻し |
| Shift+Tab / Alt+M | 権限モードを切替 |
| Alt+P (Win/Linux) / Option+P (macOS) | モデルを切替 |
| Alt+T (Win/Linux) / Option+T (macOS) | 拡張思考を切替 |
| Alt+O (Win/Linux) / Option+O (macOS) | 高速モードを切替 |
| 左右矢印 | ダイアログタブを切替 |
| 上下矢印 / Ctrl+P / Ctrl+N | カーソル移動またはコマンド履歴をナビゲート |

### 3.2 テキスト編集
| キー | 動作 |
|------|------|
| Ctrl+A | 行頭へ移動 |
| Ctrl+E | 行末へ移動 |
| Ctrl+K | 行末まで削除 |
| Ctrl+U | カーソルから行頭まで削除 |
| Ctrl+W | 前の単語を削除 |
| Ctrl+Y | 削除したテキストを貼り付け |
| Alt+Y (Ctrl+Y後) | 貼り付け履歴を循環 |
| Alt+B | 前の単語へ移動 |
| Alt+F | 次の単語へ移動 |

### 3.3 マルチライン入力
| キー | 動作 |
|------|------|
| \ + Enter | クイックエスケープ（全ターミナル対応） |
| Option+Enter (macOS) | macOSでOption as Meta有効時 |
| Shift+Enter | iTerm2, WezTerm, Ghostty, Kitty, Warp, Apple Terminal, Windows Terminal |
| Ctrl+J | 全ターミナルで設定不要 |

### 3.4 クイックコマンド
| 記法 | 動作 |
|------|------|
| `/` (行頭) | コマンドまたはスキル |
| `!` (行頭) | シェルモード |
| `@` | ファイルパスメンション |

### 3.5 トランスクリプトビューア (Ctrl+O時)
| キー | 動作 |
|------|------|
| ? | キーボードショートカットヘルプを切替 |
| { / } | 前/次のユーザープロンプトへジャンプ |
| Ctrl+E | 全コンテンツ表示を切替 |
| [ | 会話をターミナルのスクロールバックに書き出し |
| v | 一時ファイルに書き出しエディタで開く |
| q / Ctrl+C / Esc | トランスクリプトビューを終了 |

### 3.6 音声入力
| キー | 動作 |
|------|------|
| Space (長押しまたはタップ) | 音声ディクテーション（有効時） |

### 3.7 Vimモード

**モード切替:**
| キー | 動作 |
|------|------|
| Esc | NORMALモードへ |
| i | カーソル前に挿入 |
| I | 行頭に挿入 |
| a | カーソル後に挿入 |
| A | 行末に挿入 |
| o | 下に行を開く |
| O | 上に行を開く |
| v | 文字選択モード |
| V | 行選択モード |

**NORMALモード — ナビゲーション:**
| キー | 動作 |
|------|------|
| h/j/k/l | 左/下/上/右 |
| Space | 右へ移動 |
| w | 次の単語 |
| e | 単語末 |
| b | 前の単語 |
| 0 | 行頭 |
| $ | 行末 |
| ^ | 最初の非空白文字 |
| gg | 入力先頭 |
| G | 入力末尾 |
| f{char} | 次の文字へジャンプ |
| F{char} | 前の文字へジャンプ |
| t{char} | 次の文字の手前へ |
| T{char} | 前の文字の直後へ |
| ; | 直前のf/F/t/Tを繰り返し |
| , | 直前のf/F/t/Tを逆方向に繰り返し |

**NORMALモード — 編集:**
| キー | 動作 |
|------|------|
| x | 文字を削除 |
| dd | 行を削除 |
| D | 行末まで削除 |
| dw/de/db | 単語削除 |
| cc | 行を変更 |
| C | 行末まで変更 |
| cw/ce/cb | 単語を変更 |
| yy / Y | 行をヤンク（コピー） |
| yw/ye/yb | 単語をヤンク |
| p | カーソル後に貼り付け |
| P | カーソル前に貼り付け |
| >> | インデント |
| << | デデント |
| J | 行を結合 |
| u | 元に戻す |
| . | 直前の変更を繰り返す |

**テキストオブジェクト:**
| キー | 動作 |
|------|------|
| iw/aw | 内部/周囲の単語 |
| iW/aW | 内部/周囲のWORD |
| i"/a" | 内部/周囲のダブルクォート |
| i'/a' | 内部/周囲のシングルクォート |
| i(/a( | 内部/周囲の括弧 |
| i[/a[ | 内部/周囲のブラケット |
| i{/a{ | 内部/周囲のブレース |

**ビジュアルモード:**
| キー | 動作 |
|------|------|
| d/x | 選択を削除 |
| y | 選択をヤンク |
| c/s | 選択を変更 |
| p | レジスタ内容で選択を置換 |
| r{char} | 選択した文字を全置換 |
| ~/u/U | 大小文字切替/小文字/大文字 |
| >/< | 選択行のインデント/デデント |
| J | 選択行を結合 |
| o | カーソルとアンカーを入れ替え |

---

## 4. 特殊記法

### 4.1 `@` ファイルメンション
- `@path/to/file` でファイルをコンテキストに追加
- Tabで自動補完
- MCPリソースも `@` で参照可能

### 4.2 `#` コンテキスト参照
- `#` でメモリやコード参照を追加

### 4.3 `!` シェルモード
- 行頭の `!` でシェルコマンドを直接実行
- コマンドと出力が会話コンテキストに追加
- Ctrl+Bで長時間コマンドをバックグラウンド化
- Tab で履歴ベースの自動補完
- Escape / Backspace / Ctrl+U でシェルモード終了

---

## 5. カスタムコマンド

### ディレクトリ構造
- `~/.claude/skills/<skill-name>/` — 個人スキル（全プロジェクト共通）
- `.claude/skills/<skill-name>/` — プロジェクト固有スキル
- プラグイン経由のスキルも利用可能

### スキルフロントマターフィールド
| フィールド | 説明 |
|-----------|------|
| `name` | 表示名 |
| `description` | 説明 |
| `when_to_use` | 呼び出し判断の追加コンテキスト |
| `argument-hint` | 期待される引数のヒント |
| `arguments` | 名前付き位置引数 |
| `disable-model-invocation` | 自動呼び出し防止 |
| `user-invocable` | メニューの表示/非表示 |
| `allowed-tools` | 事前承認ツール |
| `model` | モデルのオーバーライド |
| `effort` | エフォートレベルのオーバーライド |
| `context` | "fork" でサブエージェント実行 |
| `agent` | サブエージェントタイプ |
| `hooks` | スキル固有フック |
| `paths` | 有効化用globパターン |
| `shell` | "bash" または "powershell" |

### 文字列置換
| 変数 | 説明 |
|------|------|
| `$ARGUMENTS` | 渡された全引数 |
| `$ARGUMENTS[N]` | N番目の引数 |
| `$N` | `$ARGUMENTS[N]` の省略形 |
| `$name` | 名前付き引数 |
| `${CLAUDE_SESSION_ID}` | 現在のセッションID |
| `${CLAUDE_EFFORT}` | 現在のエフォートレベル |
| `${CLAUDE_SKILL_DIR}` | スキルディレクトリパス |

---

## 6. 設定

### 設定ファイル階層
| ファイル | スコープ | 共有 |
|---------|--------|------|
| `~/.claude/settings.json` | ユーザー（全プロジェクト） | × |
| `.claude/settings.json` | プロジェクト | ○（Git管理） |
| `.claude/settings.local.json` | ローカル | × (gitignore) |
| Managed Policy | 組織 | 組織管理 |

### 主要設定キー
| キー | 説明 | 値の例 |
|------|------|--------|
| `model` | AIモデル | `"claude-sonnet-4-6"` |
| `effortLevel` | エフォートレベル | `"low"`, `"medium"`, `"high"`, `"xhigh"`, `"max"` |
| `alwaysThinkingEnabled` | 拡張思考デフォルト有効 | `true` / `false` |
| `editorMode` | エディタモード | `"normal"`, `"vim"` |
| `tui` | UIモード | `"fullscreen"`, `"default"` |
| `viewMode` | 表示モード | `"default"`, `"verbose"`, `"focus"` |
| `permissions.allow` | 許可ルール | `["Bash(git *)"]` |
| `permissions.ask` | 確認ルール | `["Edit"]` |
| `permissions.deny` | 拒否ルール | `["Bash(rm -rf *)"]` |
| `env` | 環境変数 | `{"KEY": "value"}` |
| `hooks` | ライフサイクルフック | (オブジェクト) |
| `skillOverrides` | スキル別表示設定 | (オブジェクト) |
| `disableAutoMode` | 自動モード無効化 | `true` / `false` |
| `cleanupPeriodDays` | 古いセッション削除日数 | `30` |
| `autoUpdatesChannel` | 更新チャンネル | `"stable"`, `"latest"` |
| `plansDirectory` | プランファイルディレクトリ | パス文字列 |

---

## 7. フック

### フックイベント (27種)
| イベント | タイミング |
|---------|----------|
| `SessionStart` | セッション開始/再開時 |
| `Setup` | `--init-only` またはメンテナンス時 |
| `UserPromptSubmit` | ユーザーがプロンプト送信時 |
| `UserPromptExpansion` | スラッシュコマンド展開時 |
| `PreToolUse` | ツール呼び出し実行前 |
| `PermissionRequest` | 権限ダイアログ表示時 |
| `PermissionDenied` | ツール呼び出し自動拒否時 |
| `PostToolUse` | ツール呼び出し成功後 |
| `PostToolUseFailure` | ツール呼び出し失敗後 |
| `PostToolBatch` | 並列ツール呼び出しバッチ後 |
| `Notification` | 通知送信時 |
| `SubagentStart` | サブエージェント生成時 |
| `SubagentStop` | サブエージェント終了時 |
| `TaskCreated` | タスク作成時 |
| `TaskCompleted` | タスク完了時 |
| `Stop` | Claude応答完了時 |
| `StopFailure` | APIエラーでターン終了時 |
| `TeammateIdle` | エージェントチームメイトがアイドル時 |
| `InstructionsLoaded` | CLAUDE.md読み込み時 |
| `ConfigChange` | 設定ファイル変更時 |
| `CwdChanged` | 作業ディレクトリ変更時 |
| `FileChanged` | 監視ファイル変更時 |
| `WorktreeCreate` | Worktree作成時 |
| `WorktreeRemove` | Worktree削除時 |
| `PreCompact` | コンテキスト圧縮前 |
| `PostCompact` | コンテキスト圧縮後 |
| `Elicitation` | MCPがユーザー入力要求時 |
| `ElicitationResult` | ユーザーがMCPに応答後 |
| `SessionEnd` | セッション終了時 |

### フックタイプ (5種)
| タイプ | 説明 |
|--------|------|
| `command` | シェルコマンド実行 |
| `http` | URLにPOSTリクエスト送信 |
| `mcp_tool` | MCPサーバーのツール呼び出し |
| `prompt` | Claudeにプロンプト送信して評価 |
| `agent` | サブエージェントを生成して検証 |

---

## 8. 環境変数

| 変数 | 説明 |
|------|------|
| `ANTHROPIC_MODEL` | デフォルトモデルのオーバーライド |
| `CLAUDE_CODE_EFFORT_LEVEL` | エフォートレベル設定 |
| `CLAUDE_CODE_DISABLE_THINKING` | 思考を強制オフ |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | テレメトリ有効化 |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | オートメモリ無効化 |
| `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` | サーベイ抑制 |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` | Git指示の設定オーバーライド |
| `CLAUDE_CODE_ENABLE_AWAY_SUMMARY` | 離席サマリー有効化 |
| `CLAUDE_CODE_NO_FLICKER` | フリッカーフリーレンダラー |
| `NO_COLOR` | カラー無効化 |
| `FORCE_COLOR` | カラー強制 |
| `CLAUDE_CODE_DISABLE_AGENT_VIEW` | バックグラウンドエージェント無効化 |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | PowerShellツール有効化 |
| `CLAUDE_CODE_AUTO_CONNECT_IDE` | IDE自動接続 |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL` | IDE拡張自動インストールをスキップ |
| `DISABLE_AUTOUPDATER` | 自動更新無効化 |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY` | トランスクリプト書き込み無効化 |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | バックグラウンドタスク無効化 |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` | プロンプト提案の有効/無効 |
| `CLAUDE_CODE_TASK_LIST_ID` | 名前付きタスクリストディレクトリ |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` | 追加ディレクトリからCLAUDE.md読み込み |

---

## 9. パーミッション構文

**形式:** `Tool` または `Tool(specifier)`

| パターン | 説明 |
|---------|------|
| `Bash` | 全bashコマンド |
| `Bash(npm run *)` | "npm run" で始まるコマンド |
| `Read(./.env)` | .envファイルの読み取り |
| `WebFetch(domain:example.com)` | 特定ドメインへのフェッチ |
| `Edit(*.ts)` | TypeScriptファイルの編集 |
| `Skill(deploy *)` | deploy スキル |

**評価順序:** deny → ask → allow（最初のマッチが適用）

---

## 10. インストール方法

| 環境 | コマンド |
|------|---------|
| macOS / Linux / WSL | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Windows PowerShell | `irm https://claude.ai/install.ps1 \| iex` |
| Windows CMD | `curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd` |
| Homebrew | `brew install --cask claude-code` |
| WinGet | `winget install Anthropic.ClaudeCode` |
