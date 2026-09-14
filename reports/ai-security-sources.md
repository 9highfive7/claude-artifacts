# AI セキュリティ学習レポート — 調査ログ（出典・検索クエリ一覧）

対象成果物: `reports/ai-security.html`
作成日: 2026年9月15日
調査実施日: 2026年9月15日（すべての URL の参照日も同日）
調査者メモ: 一次情報（標準化団体・政府機関・ベンダー公式・査読論文）を優先。
裏取りできなかった主張は本文に書かないか、「未確認」と明記した。

---

## 1. 使用した検索クエリ（WebSearch）

| # | クエリ | 目的 |
|---|--------|------|
| 1 | `OWASP Top 10 for LLM Applications 2025 list` | OWASP LLM Top 10 の把握 |
| 2 | `NIST AI Risk Management Framework AI RMF Generative AI Profile NIST AI 600-1` | NIST AI RMF / GenAI Profile |
| 3 | `MITRE ATLAS adversarial threat landscape AI systems tactics techniques` | MITRE ATLAS |
| 4 | `総務省 経済産業省 AI事業者ガイドライン 最新版` | 国内ガイドライン最新版の特定 |
| 5 | `Model Context Protocol MCP security best practices prompt injection tool poisoning official specification` | MCP のセキュリティ |
| 6 | `IPA 情報処理推進機構 生成AI セキュリティ 資料 テキスト生成AIの導入・運用ガイドライン` | IPA ガイドライン |
| 7 | `個人情報保護委員会 生成AIサービスの利用に関する注意喚起 OpenAI` | 個人情報保護委員会の注意喚起 |
| 8 | `indirect prompt injection real world incident Microsoft 365 Copilot EchoLeak zero-click CVE` | 間接プロンプトインジェクションの公開事例 |
| 9 | `slopsquatting package hallucination LLM generated nonexistent package names research study` | 幻覚に起因するサプライチェーン攻撃 |
| 10 | `Hugging Face malicious model pickle deserialization safetensors security scanning` | モデル配布のサプライチェーン |
| 11 | `Moffatt v Air Canada chatbot Civil Resolution Tribunal decision 2024 negligent misrepresentation` | 誤情報の法的責任事例 |
| 12 | `Mata v. Avianca sanctions ChatGPT fake case citations Judge Castel opinion` | 幻覚の業務利用事故 |
| 13 | `NIST AI 100-2 E2025 Adversarial Machine Learning taxonomy terminology attacks mitigations` | 敵対的機械学習の分類体系 |
| 14 | `OWASP GenAI Security Project Agentic AI Threats and Mitigations guide` | エージェント固有リスク |
| 15 | `ISO/IEC 42001 AI management system standard overview certification` | AI マネジメントシステム規格 |
| 16 | `Anthropic constitutional classifiers jailbreak defense research paper official` | ジェイルブレイク防御 |
| 17 | `PoisonedRAG knowledge corruption attack retrieval augmented generation research paper` | RAG ポイズニング |
| 18 | `UK NCSC Guidelines for secure AI system development CISA joint guidance` | 国際共同ガイドライン |
| 19 | `AI security learning resources 2026 OWASP GenAI courses books "AI red teaming" recommended reading` | 学習リソース |
| 20 | `"OWASP Top 10 for LLM Applications 2026" LLM01 LLM02 LLM03 list entries titles` | 2026年版の確認 |
| 21 | `"OWASP Top 10 for Agentic Applications" AAI01 AAI02 list titles v1.0` | エージェント版 Top 10 の ID 体系確認 |
| 22 | `Anthropic "Constitutional Classifiers" blog announcement news anthropic.com` | 公式発表の特定 |

---

## 2. 一次情報（本文の主要な根拠）

### 2.1 OWASP

| 資料 | URL | 取得方法 / 備考 |
|------|-----|----------------|
| OWASP Top 10 for LLM Applications 2026（v2026, PDF 122ページ, CC BY-SA 4.0） | https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/ | PDF 実体: `https://genai.owasp.org/download/56857/` を取得し全文抽出。LLM01〜LLM10 の ID・名称、2025年版からの順位変動、LLM01 の緩和策11項目、LLM03 の緩和策、ASI01〜ASI10 のマッピング表を確認 |
| OWASP Top 10 for LLM Applications 2025（v2025, 2024-11-18） | https://genai.owasp.org/llm-top-10/ | 10項目の ID・名称を確認 |
| LLM02:2025 Sensitive Information Disclosure | https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/ | 対象データ種別・緩和策 |
| LLM03:2025 Supply Chain | https://genai.owasp.org/llmrisk/llm032025-supply-chain/ | リスク9分類・緩和策10項目 |
| LLM04:2025 Data and Model Poisoning | https://genai.owasp.org/llmrisk/llm042025-data-and-model-poisoning/ | ライフサイクル3段階・バックドア・緩和策 |
| LLM05:2025 Improper Output Handling | https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/ | 下流脆弱性・緩和策 |
| LLM06:2025 Excessive Agency | https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ | 3つの根本原因・緩和策8項目 |
| LLM08:2025 Vector and Embedding Weaknesses | https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/ | RAG 固有リスク・緩和策 |
| LLM09:2025 Misinformation | https://genai.owasp.org/llmrisk/llm092025-misinformation/ | 幻覚・過度の信頼・パッケージ幻覚 |
| OWASP Top 10 for Agentic Applications (ASI) 2026（2025-12-09 発表） | https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ | ASI01〜ASI10 の ID・名称は 2026年版 LLM Top 10 PDF のマッピング表から確認（当該リソースページ本体からは一覧を抽出できず） |
| OWASP GenAI Security Project（トップ） | https://genai.owasp.org/ | 公開資料の一覧 |
| OWASP Top 10 for LLM Applications v1.1（2023, アーカイブ） | https://owasp.github.io/www-project-top-10-for-large-language-model-applications/ | 版の変遷確認用 |

### 2.2 NIST

| 資料 | URL | 備考 |
|------|-----|------|
| NIST AI RMF 1.0（AI 100-1, 2023-01-26） | https://www.nist.gov/itl/ai-risk-management-framework | 4機能 GOVERN/MAP/MEASURE/MANAGE、現在改訂作業中との記載を確認 |
| NIST AI 600-1 Generative AI Profile（2024年7月） | https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf | PDF を取得し全文抽出。12のリスクカテゴリ、§2.9 Information Security（直接/間接プロンプトインジェクション、データポイズニング）を原文で確認 |
| NIST AI 100-2 E2025 Adversarial Machine Learning（2025年3月） | https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf | 公式ページ https://csrc.nist.gov/news/2025/nist-ai-100-2-adversarial-machine-learning-taxonom 経由で存在と概要を確認。**本文の詳細記述は検索結果ベース（PDF 全文未読）** |

### 2.3 MITRE

| 資料 | URL | 備考 |
|------|-----|------|
| MITRE ATLAS（公式サイト） | https://atlas.mitre.org/ | サイト本体は JavaScript 描画のため本文抽出不可 |
| MITRE ATLAS データ（GitHub, `dist/v6/ATLAS-2026.08.yaml`） | https://github.com/mitre-atlas/atlas-data | 最新リリース v2026.08（2026-09-01 公開）を取得。戦術16・技術197（うちサブ技術83）・緩和策39・ケーススタディ72 を機械的に集計 |
| CVE-2025-32711（CVE Program レコード） | https://cveawg.mitre.org/api/cve/CVE-2025-32711 | 公式 JSON を取得。名称・CVSS・CWE・公開日・タグを確認 |
| MSRC アドバイザリ（CVE-2025-32711） | https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711 | **本文取得不可（JS 描画）。CVE レコードからの参照リンクとして記載** |
| Aim Labs EchoLeak 報告 | https://www.aim.security/lp/aim-labs-echoleak-m365 | CVE レコードの参照リンクとして確認。**ページ本文は未取得** |

### 2.4 Model Context Protocol（MCP）

| 資料 | URL | 備考 |
|------|-----|------|
| MCP Security Best Practices（公式仕様付属文書） | https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices | 全文取得。Confused Deputy / Token Passthrough / SSRF / State Handle Hijacking / Local MCP Server Compromise / OAuth URL 検証 / stdio プロキシ / Mix-Up / localhost リダイレクト / スコープ最小化 の MUST・SHOULD 要件を原文で確認 |

### 2.5 日本国内

| 資料 | URL | 備考 |
|------|-----|------|
| AI事業者ガイドライン 第1.2版 本編（令和8年3月31日） | https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_1.pdf | PDF 取得済み。ただし埋め込みフォントの都合で日本語テキスト抽出不可 |
| AI事業者ガイドライン 第1.2版 概要 | https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_2.pdf | PDF 全文抽出成功。**10の「共通の指針」の名称と本文、主体区分、全体構成はこの資料から引用** |
| 総務省「AI事業者ガイドライン」掲載ページ | https://www.soumu.go.jp/main_sosiki/kenkyu/ai_network/02ryutsu20_04000019.html | 版・公表日・本編/別添の構成を確認 |
| IPA「テキスト生成AIの導入・運用ガイドライン」（2024年7月） | https://www.ipa.go.jp/jinzai/ics/core_human_resource/final_project/2024/generative-ai-guideline.html | 概要ページ |
| 同 PDF 本体 | https://www.ipa.go.jp/jinzai/ics/core_human_resource/final_project/2024/f55m8k0000003spo-att/f55m8k0000003svn.pdf | PDF 全文抽出成功。リスク4分類、インシデント事例（サムスン電子、警視庁逮捕事例、米国の罰金事例）、リスク管理4工程を原文で確認 |
| 個人情報保護委員会「生成AIサービスの利用に関する注意喚起等について」（2023年6月2日） | https://www.ppc.go.jp/news/careful_information/230602_AI_utilize_alert/ | ページ本文・添付PDFのURLを確認 |
| 同 利用者向け注意喚起 PDF | https://www.ppc.go.jp/files/pdf/230602_alert_AI_utilize.pdf | PDF 取得済み。**日本語テキスト抽出不可のため、本文は掲載ページの記載範囲に限定して記述** |
| 同 OpenAI 向け注意喚起 PDF | https://www.ppc.go.jp/files/pdf/230602_alert_generative_AI_service.pdf | 同上 |

### 2.6 事例・論文・ベンダー公式

| 資料 | URL | 備考 |
|------|-----|------|
| PyTorch「Compromised nightly dependency chain」（2022年12月） | https://pytorch.org/blog/compromised-nightly-dependency/ | 全文取得。依存関係混同、窃取対象ファイル、対処手順を原文で確認 |
| AWS Security Bulletin AWS-2025-015（Amazon Q Developer for VS Code） | https://aws.amazon.com/security/security-bulletins/AWS-2025-015/ | 全文取得。CVE-2025-8217、1.84.0 の混入と 1.85.0 への更新指示を確認 |
| PoisonedRAG（USENIX Security 2025, arXiv:2402.07867） | https://arxiv.org/abs/2402.07867 | 著者・投稿日・成功率90%／注入5件／数百万件DB をアブストラクトで確認 |
| USENIX 掲載ページ | https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag | 採録確認 |
| We Have a Package for You!（USENIX Security 2025, arXiv:2406.10279） | https://arxiv.org/abs/2406.10279 | 16モデル／576,000サンプル／205,474のユニークな存在しないパッケージ名／商用モデル平均5.2%以上・OSSモデル平均21.7%以上、対象言語は Python と JavaScript の2言語 |
| Anthropic「Constitutional Classifiers」（2025-02-03） | https://www.anthropic.com/research/constitutional-classifiers | 全文取得。86%→4.4%、拒否率+0.38%、計算オーバーヘッド+23.7%、公開デモの結果と限界の明記を確認 |
| Constitutional Classifiers 論文 | https://arxiv.org/abs/2501.18837 | 存在を確認（**全文未読**） |
| Simon Willison「The lethal trifecta for AI agents」（2025-06-16） | https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ | 全文取得。3要素の定義と緩和の考え方を確認。OWASP 2026年版 LLM01 からも引用されている |
| CISA/UK NCSC「Guidelines for Secure AI System Development」（2023年11月） | https://www.cisa.gov/news-events/alerts/2023/11/26/cisa-and-uk-ncsc-unveil-joint-guidelines-secure-ai-system-development | 4段階構成・23機関の共同署名を確認。**ガイドライン PDF 本体は 404 で取得できず（未確認）** |
| ISO/IEC 42001 解説（ISO 公式） | https://www.iso.org/home/insights-news/resources/iso-42001-explained-what-it-is.html | 2023年12月発行・任意認証であることを確認 |
| Moffatt v. Air Canada, 2024 BCCRT 149 | https://www.canlii.org/en/commentary/doc/2025CanLIIDocs1963 | 2024-02-14 判断、過失による不実表示、650.88カナダドル |
| Mata v. Avianca, Inc., 678 F.Supp.3d 443 (S.D.N.Y. 2023) | https://www.law.berkeley.edu/wp-content/uploads/archive/2025/12/Mata-v-Avianca-Inc.pdf | 2023-06-22、5,000ドルの制裁金 |

---

## 3. 二次情報（解説記事として明示的に区別して使用）

| 資料 | URL | 用途 |
|------|-----|------|
| PwC Japan「AI事業者ガイドライン（第1.2版）改定のポイント」 | https://www.pwc.com/jp/ja/knowledge/column/ai-governance/ai-guideline-03.html | 第1.2版の改定論点7つ（AIエージェント/フィジカルAIの定義追記ほか） |
| Promptfoo「OWASP Top 10 for Agentic Applications」 | https://www.promptfoo.dev/docs/red-team/owasp-agentic-ai/ | ASI 各項目の平易な説明。ID・名称自体は OWASP 公式 PDF で照合済み |
| axonbuild「OWASP LLM Top 10 2026: What Changed」 | https://axonbuild.com/blog/owasp-ai-top-10 | 2026年版の公開日（2026-08-03）のクロスチェック |
| JFrog「Data Scientists Targeted by Malicious Hugging Face ML Models」 | https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models/ | モデル配布経路の pickle 悪用 |
| Trend Micro「Slopsquatting: When AI Agents Hallucinate Malicious Packages」 | https://www.trendmicro.com/vinfo/us/security/news/cybercrime-and-digital-threats/slopsquatting-when-ai-agents-hallucinate-malicious-packages | 用語 slopsquatting の解説。MITRE ATLAS の参照文献にも採用されている |
| Wikipedia「Slopsquatting」 | https://en.wikipedia.org/wiki/Slopsquatting | 用語の由来（Seth Larson 提唱、Andrew Nesbitt が普及） |

---

## 4. アクセスできなかった／確認できなかったもの（本文で「未確認」と記載）

| 資料 | 状況 |
|------|------|
| MSRC アドバイザリ本文（CVE-2025-32711） | ページが JavaScript 描画のため本文取得不可。CVE Program の公式レコードで代替 |
| Aim Labs EchoLeak 技術レポート本文 | 未取得。CVE レコードの参照リンクとしてのみ記載 |
| CISA/NCSC「Guidelines for Secure AI System Development」PDF 本体 | `https://www.cisa.gov/sites/default/files/2023-11/Guidelines-for-secure-AI-system-development.pdf` が 404。CISA のアラートページの記載のみを根拠にした |
| NIST AI 100-2 E2025 PDF 本文 | 全文未読。存在・発行時期・概要のみ記載 |
| AI事業者ガイドライン第1.2版「本編」PDF の本文 | ダウンロードは成功したがフォント埋め込みの都合で日本語抽出不可。「概要」PDF の記述に限定した |
| 個人情報保護委員会 注意喚起 PDF 本文 | 同上。掲載ページの記載範囲に限定した |
| OpenAI 2023年3月20日インシデント報告（Redis バグ） | `https://openai.com/index/march-20-chatgpt-outage/` が HTTP 403。**本レポートでは扱わなかった** |
| Constitutional Classifiers++（次世代版, 2026年1月） | arXiv に該当論文が存在するとの検索結果はあるが全文未確認。本文では触れていない |
| サムスン電子の ChatGPT 情報流出 | 一次報道にはアクセスしていない。IPA ガイドライン（公的資料）の記述を出典として引用した |

---

## 5. 表記の方針

- 事実（出典で確認できた内容）と、筆者（Claude）の解釈・整理は本文中で区別した。
- 出典が古い資料（例: NIST AI 600-1 は2024年7月、IPA ガイドラインは2024年7月、CISA/NCSC ガイドラインは2023年11月）は、本文にその旨を明記した。
- 攻撃手法は「なぜ危険か」「どう防ぐか」を理解するのに必要な概念レベルにとどめ、再現手順やペイロードは記載していない。
