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

## 3. デザイン仕上げ（Opus 5.5）
designer サブエージェントを呼び出す。model は指定しない（エージェント定義の `claude-opus-5-5` がそのまま使われる）。
2で作られたファイルのパスを渡し、完了を待つ。

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
