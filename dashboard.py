#!/usr/bin/env python3
"""自律開発の見守りダッシュボード。

    python3 dashboard.py          # 30秒ごとに dashboard.html を再生成し続ける
    python3 dashboard.py --once   # 1回だけ生成して終了

標準ライブラリのみ。設定は dashboard_config.json。
"""
import glob
import html
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "dashboard_config.json"
OUT_PATH = ROOT / "dashboard.html"
TASKS_PATH = ROOT / ".agent" / "tasks.json"
QUESTIONS_PATH = ROOT / ".agent" / "questions.json"

TASKS_TEMPLATE = {
    "_schema": {
        "id": "文字列。例: T-001",
        "status": "todo | doing | done",
        "title": "タスクの題",
        "blocker": "止まっている理由（なければ null）",
        "updated": "ISO 8601 の更新日時（任意）",
    },
    "tasks": [],
}
QUESTIONS_TEMPLATE = {
    "_schema": {
        "id": "文字列。例: Q-001",
        "urgency": "high | medium | low",
        "question": "人間への問い",
        "default_action": "回答がない場合にエージェントが取る行動",
        "status": "open | answered",
        "answer": "回答（未回答なら null）",
        "asked_at": "ISO 8601 の日時（任意）",
    },
    "questions": [],
}


def load_json(path, template=None):
    if not path.exists():
        if template is None:
            return None
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(template, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return template
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"[warn] {path} を読めません: {e}", file=sys.stderr)
        return template


def log_dir():
    # Claude Code はプロジェクトの絶対パスの英数字以外を "-" に置き換えたディレクトリ名を使う
    name = re.sub(r"[^A-Za-z0-9]", "-", str(ROOT))
    return Path.home() / ".claude" / "projects" / name


# ---------- セッションログの集計 ----------

def price_for(model, prices):
    if model in prices:
        return prices[model]
    # 日付付きなど、前方一致で拾う
    for key in sorted(prices, key=len, reverse=True):
        if key != "default" and model.startswith(key):
            return prices[key]
    return prices["default"]


def call_cost(usage, model, cfg):
    p = price_for(model, cfg["prices"])
    cc = usage.get("cache_creation") or {}
    w1h = cc.get("ephemeral_1h_input_tokens", 0) or 0
    w5m = cc.get("ephemeral_5m_input_tokens")
    if w5m is None:
        w5m = (usage.get("cache_creation_input_tokens", 0) or 0) - w1h
    cost = (
        (usage.get("input_tokens", 0) or 0) * p["input"]
        + (usage.get("output_tokens", 0) or 0) * p["output"]
        + w5m * p["cache_write_5m"]
        + w1h * p["cache_write_1h"]
        + (usage.get("cache_read_input_tokens", 0) or 0) * p["cache_read"]
    ) / 1_000_000
    if usage.get("speed") == "fast":
        cost *= cfg.get("fast_mode_multiplier", 1.0)
    return cost


def parse_session(path, cfg):
    s = {
        "id": Path(path).stem, "cost": 0.0, "calls": 0,
        "input": 0, "cache_read": 0, "cache_write": 0, "output": 0,
        "tool_uses": 0, "tool_errors": 0, "drops": 0,
        "last_ts": "", "models": {}, "unknown_models": set(),
    }
    seen = set()          # 1回のAPI応答はコンテンツブロックごとに複数行に分かれるので message.id で重複排除
    prev_read = None      # メインスレッドの直前の cache_read
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            ts = d.get("timestamp") or ""
            if ts > s["last_ts"]:
                s["last_ts"] = ts
            msg = d.get("message")
            if not isinstance(msg, dict):
                continue
            content = msg.get("content") if isinstance(msg.get("content"), list) else []

            if d.get("type") == "assistant":
                s["tool_uses"] += sum(1 for c in content if isinstance(c, dict) and c.get("type") == "tool_use")
                usage = msg.get("usage")
                model = msg.get("model") or ""
                key = msg.get("id") or d.get("requestId") or d.get("uuid")
                if not usage or model == "<synthetic>" or key in seen:
                    continue
                seen.add(key)
                if model not in cfg["prices"] and price_for(model, cfg["prices"]) is cfg["prices"]["default"]:
                    s["unknown_models"].add(model)
                c = call_cost(usage, model, cfg)
                s["cost"] += c
                s["calls"] += 1
                s["models"][model] = s["models"].get(model, 0) + c
                read = usage.get("cache_read_input_tokens", 0) or 0
                s["input"] += usage.get("input_tokens", 0) or 0
                s["cache_read"] += read
                s["cache_write"] += usage.get("cache_creation_input_tokens", 0) or 0
                s["output"] += usage.get("output_tokens", 0) or 0
                if not d.get("isSidechain"):
                    if prev_read and read < prev_read / 2:
                        s["drops"] += 1
                    prev_read = read

            elif d.get("type") == "user":
                s["tool_errors"] += sum(
                    1 for c in content
                    if isinstance(c, dict) and c.get("type") == "tool_result" and c.get("is_error")
                )
    return s


def collect(cfg):
    files = glob.glob(str(log_dir() / "*.jsonl"))
    sessions = [parse_session(p, cfg) for p in files]
    sessions = [s for s in sessions if s["calls"] or s["tool_uses"]]
    sessions.sort(key=lambda s: s["last_ts"])
    tot = {k: sum(s[k] for s in sessions) for k in
           ("cost", "calls", "input", "cache_read", "cache_write", "output", "tool_uses", "tool_errors", "drops")}
    tot["unknown_models"] = set().union(*(s["unknown_models"] for s in sessions)) if sessions else set()
    return sessions, tot


# ---------- HTML ----------

def esc(v):
    return html.escape("" if v is None else str(v))


def pct(n, d):
    return n / d if d else 0.0


def bar(ratio, bad):
    w = min(ratio, 1.0) * 100
    return f'<div class="bar"><div class="fill{" bad" if bad else ""}" style="width:{w:.1f}%"></div></div>'


def card(title, value, sub="", bad=False, extra=""):
    return (f'<section class="card"><h2>{esc(title)}</h2>'
            f'<div class="val{" bad" if bad else ""}">{value}</div>{extra}'
            f'<p class="sub">{sub}</p></section>')


def fmt_tok(n):
    for unit, div in (("B", 1e9), ("M", 1e6), ("k", 1e3)):
        if n >= div:
            return f"{n / div:.1f}{unit}"
    return str(n)


def render(cfg):
    sessions, tot = collect(cfg)
    tasks_doc = load_json(TASKS_PATH, TASKS_TEMPLATE) or {}
    qs_doc = load_json(QUESTIONS_PATH, QUESTIONS_TEMPLATE) or {}
    tasks = [t for t in tasks_doc.get("tasks", []) if isinstance(t, dict)]
    questions = [q for q in qs_doc.get("questions", []) if isinstance(q, dict)]
    open_qs = [q for q in questions if q.get("status", "open") != "answered" and not q.get("answer")]

    warn_ratio = cfg["warn_budget_ratio"]
    cards = []

    # 費用（累計）
    budget = cfg["budget_total_usd"]
    r = pct(tot["cost"], budget)
    sub = f"上限 ${budget:,.0f} の {r * 100:.1f}% ／ {len(sessions)} セッション"
    if tot["unknown_models"]:
        sub += f"<br><span class=\"bad\">単価未登録: {esc(', '.join(sorted(tot['unknown_models'])))}（default で計算）</span>"
    cards.append(card("費用（API換算・累計）", f"${tot['cost']:,.2f}", sub, r > warn_ratio, bar(r, r > warn_ratio)))

    # 直近セッション
    if sessions:
        last = sessions[-1]
        sb = cfg["budget_session_usd"]
        r = pct(last["cost"], sb)
        cards.append(card("直近セッションの費用", f"${last['cost']:,.2f}",
                          f"<code>{esc(last['id'][:8])}</code> ／ 上限 ${sb:,.0f} の {r * 100:.1f}% ／ {last['calls']} 回",
                          r > warn_ratio, bar(r, r > warn_ratio)))
    else:
        cards.append(card("直近セッションの費用", "—", "ログがありません"))

    # キャッシュ読み込み率
    in_all = tot["input"] + tot["cache_read"] + tot["cache_write"]
    cr = pct(tot["cache_read"], in_all)
    cards.append(card("キャッシュ読み込み率", f"{cr * 100:.1f}%",
                      f"{fmt_tok(tot['cache_read'])} / {fmt_tok(in_all)} トークン ／ 呼び出し {tot['calls']:,} 回"))

    # ツールのエラー率
    er = pct(tot["tool_errors"], tot["tool_uses"])
    bad = er > cfg["warn_error_rate"]
    cards.append(card("ツールのエラー率", f"{er * 100:.1f}%",
                      f"{tot['tool_errors']} / {tot['tool_uses']} 回", bad))

    # 文脈の読み落とし
    bad = tot["drops"] >= cfg["warn_context_drops"]
    detail = "、".join(f"{s['id'][:8]}: {s['drops']}" for s in sessions if s["drops"])
    cards.append(card("文脈の読み落とし", f"{tot['drops']} 回",
                      "キャッシュ読み込みが直前の半分未満に落ちた回数" + (f"<br>{esc(detail)}" if detail else ""), bad))

    # タスク進捗
    cnt = {k: sum(1 for t in tasks if t.get("status") == k) for k in ("done", "doing", "todo")}
    n = len(tasks)
    cards.append(card("タスク進捗", f"{cnt['done']} / {n}",
                      f"done {cnt['done']} ／ doing {cnt['doing']} ／ todo {cnt['todo']}",
                      extra=bar(pct(cnt["done"], n), False)))

    # 未回答の質問
    high = sum(1 for q in open_qs if q.get("urgency") == "high")
    cards.append(card("未回答の質問", f"{len(open_qs)} 件", f"うち緊急度 high: {high} 件", high > 0))

    # タスク表
    order = {"doing": 0, "todo": 1, "done": 2}
    rows = "".join(
        f'<tr class="st-{esc(t.get("status"))}"><td>{esc(t.get("id"))}</td>'
        f'<td><span class="pill {esc(t.get("status"))}">{esc(t.get("status"))}</span></td>'
        f'<td>{esc(t.get("title"))}</td><td class="{"bad" if t.get("blocker") else ""}">{esc(t.get("blocker") or "")}</td></tr>'
        for t in sorted(tasks, key=lambda t: (order.get(t.get("status"), 3), str(t.get("id", ""))))
    ) or '<tr><td colspan="4" class="empty">タスクはありません</td></tr>'
    task_table = f"<table><thead><tr><th>ID</th><th>状態</th><th>題</th><th>blocker</th></tr></thead><tbody>{rows}</tbody></table>"

    urg = {"high": 0, "medium": 1, "low": 2}
    rows = "".join(
        f'<tr><td>{esc(q.get("id"))}</td>'
        f'<td><span class="pill u-{esc(q.get("urgency"))}">{esc(q.get("urgency"))}</span></td>'
        f'<td>{esc(q.get("question"))}</td><td>{esc(q.get("default_action"))}</td></tr>'
        for q in sorted(open_qs, key=lambda q: (urg.get(q.get("urgency"), 3), str(q.get("id", ""))))
    ) or '<tr><td colspan="4" class="empty">未回答の質問はありません</td></tr>'
    q_table = f"<table><thead><tr><th>ID</th><th>緊急度</th><th>問い</th><th>既定の行動</th></tr></thead><tbody>{rows}</tbody></table>"

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    refresh = int(cfg.get("refresh_seconds", 30))
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="{refresh}">
<title>Agent Dashboard</title>
<style>
:root{{--bg:#f6f7f9;--card:#fff;--fg:#1f2328;--muted:#656d76;--line:#e5e7eb;--accent:#2563eb;--bad:#d1242f}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif}}
main{{max-width:1100px;margin:0 auto;padding:20px 16px 40px}}
header{{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px 16px;margin-bottom:16px}}
h1{{font-size:20px;margin:0}} .stamp{{color:var(--muted);font-size:13px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}}
.card h2{{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 4px}}
.val{{font-size:28px;font-weight:700;font-variant-numeric:tabular-nums}}
.sub{{color:var(--muted);font-size:13px;margin:6px 0 0}}
.bad{{color:var(--bad)!important}}
.bar{{height:8px;background:#eef0f3;border-radius:4px;overflow:hidden;margin-top:6px}}
.fill{{height:100%;background:var(--accent)}} .fill.bad{{background:var(--bad)}}
h3{{font-size:16px;margin:28px 0 8px}}
.tbl{{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow-x:auto}}
table{{width:100%;border-collapse:collapse;font-size:14px}}
th,td{{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}}
th{{color:var(--muted);font-weight:600;font-size:12px;white-space:nowrap}}
tr:last-child td{{border-bottom:none}} tr.st-done td{{color:var(--muted)}}
td:first-child{{white-space:nowrap;font-variant-numeric:tabular-nums}}
.empty{{color:var(--muted);text-align:center}}
.pill{{display:inline-block;padding:0 8px;border-radius:999px;font-size:12px;background:#eef0f3;white-space:nowrap}}
.pill.doing{{background:#dbeafe;color:#1d4ed8}} .pill.done{{background:#dcfce7;color:#15803d}}
.pill.u-high{{background:#fde2e1;color:var(--bad)}} .pill.u-medium{{background:#fef3c7;color:#92400e}}
code{{font-size:13px}}
@media (max-width:600px){{.val{{font-size:24px}} th,td{{padding:6px 8px}}}}
</style></head><body><main>
<header><h1>自律開発ダッシュボード</h1><span class="stamp">更新 {now} ／ {refresh}秒ごとに自動更新</span></header>
<div class="grid">{''.join(cards)}</div>
<h3>タスク</h3><div class="tbl">{task_table}</div>
<h3>未回答の質問</h3><div class="tbl">{q_table}</div>
</main></body></html>
"""


def build():
    cfg = load_json(CONFIG_PATH)
    if cfg is None:
        sys.exit(f"{CONFIG_PATH} がありません")
    tmp = OUT_PATH.with_suffix(".html.tmp")
    tmp.write_text(render(cfg), encoding="utf-8")
    os.replace(tmp, OUT_PATH)  # 書き込み途中のファイルをブラウザが読まないように
    return cfg


def main():
    cfg = build()
    print(f"生成: {OUT_PATH}")
    if "--once" in sys.argv:
        return
    interval = int(cfg.get("refresh_seconds", 30))
    print(f"{interval}秒ごとに再生成します（Ctrl+C で終了）")
    try:
        while True:
            time.sleep(interval)
            try:
                build()
            except Exception as e:  # 1回の失敗でループを止めない
                print(f"[error] {e}", file=sys.stderr)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
