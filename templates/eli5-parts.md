# やさしく図解の部品

「やさしく図解」は、初学者が文章だけでは頭に描きにくい所に置く、絵1枚のブロック。eli5 の考え方（大きな絵、少ない言葉、番号の順）を、このサイトの見た目（白い紙、実線の枠、黄色は1か所）で取り込んだもの。
決まりは `.claude/agents/designer.md`、見た目の CSS（`.eli5`・`.eli5-label`）は共通の UI ブロックに入っている。ここには、描くための部品と見本を置く。

実例は次の2本にある。`grep -n 'class="eli5"' reports/ai-security.html reports/claude-cowork-guide.html` で場所が分かる。

| 型 | 実例 | 向いている話 |
|---|---|---|
| 縦の手順（①②③） | ai-security の図1・図3、cowork-guide の図1 | 順番に起きること、やりとり |
| 重なり（ベン図） | ai-security の図2 | 3つの条件が同時に揃うと危ない、など |
| 並べて比べる | cowork-guide の図2 | 同じ流れが、設定によってどう変わるか |
| 箱の中身 | cowork-guide の図3 | 「A＋B＋C を1つにまとめたもの」 |

## 骨組み

```html
<div class="eli5">
  <span class="eli5-label">やさしく図解</span>
  <figure>
    <svg viewBox="0 0 360 430" role="img" aria-label="図の内容を1〜2文で">
      <title>図のタイトル</title>
      …
    </svg>
    <figcaption><b>図1</b>キャプション（1〜2文）。</figcaption>
  </figure>
</div>
```

- 置く場所は、ELI5 の印を付けた見出しの直後。描いたら印のコメントは消す
- 図番号は、文書の上から順に、ほかの図（FIGURE）と通しで付ける
- `.eli5` の幅（440px）、「拡大」ボタン、スマホでの余白は共通 CSS が処理する。レポート固有の `<style>` には書かない

## SVG の決まり

- `viewBox` の幅は **360**。高さは 380〜490。縦長にすると、スマホ幅 360px でも図の文字が実寸 12px 以上になる
- 文字は **すべて font-size 16 以上**。見出し的なもの（人や物の名前、モード名）は `font-weight="700"`
- ラベルは **1行12字以内**。全角1字は幅16として数え、入れる箱の幅より 16 以上小さくする。説明はキャプションに書く
- 順番がある話は、左端に番号バッジ ①②③ を縦に並べ、点線でつなぐ
- 強調は **1要素だけ** `fill="var(--marker-fill)"`。ほかの塗りは `var(--code-bg)` か `none`
- 破線（`stroke-dasharray="5 4"`）は「怪しいもの、隠れたもの、悪い結果」に使う。意味を変えない
- 色の固定値は書かない。線と文字は `currentColor`
- 絵に出すのは、**本文に書いてあることだけ**。具体的な事件名や数値を足さない。例え話の絵は、キャプションに「（イメージ）」と書く

## 部品（コピーして座標を変える）

共通の線の属性（以下では `ST` と書く）:

```
fill="var(--code-bg)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
```

矢印の先（`<svg>` の先頭に1つ。`id` は図ごとに変える）:

```html
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
```

矢印、線、番号バッジ、番号をつなぐ点線:

```html
<line x1="114" y1="62" x2="238" y2="62" stroke="currentColor" stroke-width="2.5" marker-end="url(#f1-ah)"/>
<circle cx="22" cy="62" r="13" fill="none" stroke="currentColor" stroke-width="2"/><text x="22" y="68" text-anchor="middle" font-size="16" font-weight="700">1</text>
<line x1="22" y1="79" x2="22" y2="185" stroke="currentColor" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>
```

人（中心が (x, y)。攻撃者など怪しいものは `stroke-dasharray="5 4"` を足す）:

```html
<g transform="translate(84 66)" ST><circle cx="0" cy="-16" r="10"/><path d="M-18 18 C-18 -2 18 -2 18 18 Z"/></g>
```

AI:

```html
<g transform="translate(270 66)" ST><rect x="-24" y="-18" width="48" height="36" rx="9"/><line x1="0" y1="-18" x2="0" y2="-26"/><circle cx="0" cy="-30" r="3"/><circle cx="-9" cy="-3" r="3.5" fill="currentColor" stroke="none"/><circle cx="9" cy="-3" r="3.5" fill="currentColor" stroke="none"/><line x1="-8" y1="9" x2="8" y2="9"/></g>
```

メール:

```html
<g transform="translate(84 196)" ST><rect x="-24" y="-16" width="48" height="32" rx="4"/><path d="M-24 -16 L0 4 L24 -16"/></g>
```

データベース（強調するときは `fill="var(--marker-fill)"`）:

```html
<g transform="translate(290 74)" fill="var(--code-bg)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M-26 -20 V16 A26 8 0 0 0 26 16 V-20"/><ellipse cx="0" cy="-20" rx="26" ry="8"/><path d="M-26 -2 A26 8 0 0 0 26 -2" fill="none"/></g>
```

小さい人（関所の印）と盾（自動チェックの印）:

```html
<g transform="translate(93 74)" ST><circle cx="0" cy="-9" r="6"/><path d="M-11 11 C-11 -1 11 -1 11 11 Z"/></g>
<g transform="translate(207 74)" ST><path d="M0 -14 L12 -9 V3 C12 11 6 16 0 19 C-6 16 -12 11 -12 3 V-9 Z"/><path d="M-5 3 L-1 8 L7 -4" fill="none"/></g>
```

箱（通常、強調、破線）と、強調する見出し札:

```html
<rect x="20" y="368" width="80" height="48" rx="10" fill="var(--code-bg)" stroke="currentColor" stroke-width="2"/>
<rect x="140" y="368" width="80" height="48" rx="10" fill="var(--marker-fill)" stroke="currentColor" stroke-width="2"/>
<rect x="244" y="308" width="108" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4"/>
<rect x="20" y="14" width="104" height="30" rx="8" fill="var(--marker-fill)" stroke="currentColor" stroke-width="2"/>
```

段のあいだの区切り（点線）:

```html
<line x1="20" y1="190" x2="340" y2="190" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>
```

重なり（ベン図）の円（3つ。重なりが濃くなる）:

```html
<circle cx="125" cy="105" r="70" fill="currentColor" fill-opacity="0.07" stroke="currentColor" stroke-width="2"/>
```

## 描いたあとの確認

- ラベルが箱からはみ出していない（全角1字＝幅16で数える）。矢印やアイコンの上に文字が重なっていない
- 黄色の塗り（`var(--marker-fill)`）が、1つの図に1要素だけ
- 本文と食い違う内容を描いていない
- ブラウザで見られるときは、PC幅とスマホ幅（360px）で、図の文字が小さすぎないことを確かめる
