---
name: report
description: 学びたいテーマを受け取り、調査→HTML作成→デザイン仕上げ→index更新→GitHubへpush→完了報告までを一括で行う。「〇〇をレポートにして」「〇〇を調べてまとめて」と頼まれたときにも使う。
argument-hint: <学びたいテーマ>
---

# 学習レポート作成フロー

テーマ: $ARGUMENTS

テーマが空、または曖昧すぎる場合だけ、1問だけ質問してから始める。それ以外は確認なしで最後まで進める。

## 1. 準備
- `git pull` で最新にする
- テーマから英語スラッグを決め、保存先を `reports/<slug>.html` とする（日付は付けない。同名があれば末尾に -2 などを付ける）

## 2. 調査・初稿（Sonnet 5.5）
researcher サブエージェントを呼び出す。model は指定しない（エージェント定義の `claude-sonnet-5-5` がそのまま使われる。別名の sonnet を渡すと版が変わることがある）。
テーマと保存先パスを渡し、完了を待つ。

## 2.5 文章の推敲（yomiyasu）
初稿の文章からAIっぽさを取る。designer が蛍光ペンや赤ペンを入れる前に行う。
1. Skill ツールで `yomiyasu` を読み込み、その原則に従う。ドメインは tech、文書の立場は「説明」。文体（だ・である／です・ます）は初稿のまま
2. 本文をテキストにしてリンターにかけ、見直し候補を出す
   ```
   python3 .claude/skills/report/extract_text.py reports/<slug>.html /tmp/<slug>.md
   python3 .claude/skills/yomiyasu/scripts/yomiyasu_lint.py /tmp/<slug>.md
   ```
   `bold_not_rendered`（太字の記号）は Markdown 向けの指摘で、HTML では関係ないので無視する。「装置」のように技術用語として正しい語の指摘も無視する
3. 候補と本文全体を見て、HTML の該当箇所を直接書き直す。直すのは主に次のもの
   - 不要な「AではなくB」（否定しても主張が変わらないもの）。誤解を正す否定は残す
   - 比喩動詞・AI頻出語（土台、本質的、地に足のついた など）、文末のコロン、ダッシュ（—）
   - 和文と英単語・コードのあいだの不自然な半角スペース
   - 同じ文末の3連続、多すぎる太字
4. 守ること: 事実・数値・固有名詞・リンク・コード・図（svg）は変えない。情報を足さない、削らない。HTML のタグ構造を崩さない


designer サブエージェントを呼び出す。model は指定しない（エージェント定義の `claude-opus-5-5` がそのまま使われる）。
2.5 で推敲したファイルのパスを渡し、完了を待つ。

## 4. トップページ更新
index.html を読み、先頭の <!-- ENTRY TEMPLATE --> コメントの書式どおりに
新しい <article class="entry"> を該当する月の <section class="month"> の先頭に追加する。
月のセクションがなければ新しく作る。
直前まで新着だったエントリから class="is-new" を外し、新しいエントリに付ける
（新着はタイトル下の蛍光ペンの線で示すので、「新着」タグは書かない）。data-topic は ai / infra / security / dev から選ぶ。
テーマに連載（シリーズ）名や「第N回」が書かれていれば、data-series="シリーズ名" と data-order="N" を付ける。
既存のシリーズの続きなら、index.html にある同じシリーズのエントリとシリーズ名を一字一句そろえ、
回数は既存の最大値の次にする。シリーズの指定がなければ付けない（各レポート末尾の
「シリーズ」「関連ノート」はこの属性と data-topic から自動で表示される）。
reports/index.html は触らない（トップへのリダイレクトになっている）。

## 5. GitHubへ反映
```
git add reports/<作成したファイル> index.html
git commit -m "add: <テーマ>"
git push origin main
```
失敗したら修正を試みず、エラー内容を報告して止める。force push はしない。
push が成功すると、コスト記録用フックが自動で reports/usage-log.csv を更新して別途pushする。
これはこのスキルの管轄外なので、待つ必要も確認する必要もない。

## 6. 完了報告
スマホにプッシュ通知で完了を知らせたうえで、次の形式で報告する：
- テーマ
- ファイル名
- 公開URL（GitHub Pages: https://9highfive7.github.io/claude-artifacts/reports/<ファイル名>）
- 要点3行
- デザインで手を入れた点（簡潔に）
- 利用コストの確認方法（初回のみ）: https://9highfive7.github.io/claude-artifacts/usage-dashboard.html で確認できる旨を一言添える
