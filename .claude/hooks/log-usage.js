#!/usr/bin/env node
/**
 * PostToolUse フック（git push 成功直後に1回だけ動く）
 * 直前の /report 実行以降に使ったトークンを会話ログから集計し、
 * API料金に換算して reports/usage-log.csv に追記 → そのCSVだけ別コミットでpushする。
 *
 * ※ Pro/Maxプランでは実際の請求はされない。ここでの金額は「API換算の目安」。
 * ※ 料金は変わることがあるので PRICING は公式ページで確認して更新すること。
 *    https://platform.claude.com/docs/en/about-claude/pricing
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// $ / 1M tokens。cacheWrite = 入力単価×1.25（5分キャッシュ）、cacheRead = 入力単価×0.1
const PRICING = {
  // 5.5 世代（2026-10-03 追加）。出典は第三者サイトの料金表（株式会社ripla）。公式ページでの確認は未了。
  // opus-5-5 は dashboard_config.json の値とも一致する
  'claude-opus-5-5':   { input: 4.00, output: 20.00 },
  'claude-sonnet-5-5': { input: 2.00, output: 10.00 },
  'claude-opus-5':   { input: 5.00, output: 25.00 },
  'claude-sonnet-5': { input: 2.00, output: 10.00 }, // 要確認: $3/$15 とする情報もある
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
};
// サブエージェントのログは最終 usage が欠け、ストリーミング開始時の output_tokens（数個〜数十）しか残らない応答が多い。
// そうした応答（stop_reason のある行がない応答）は、生成文字数（text＋thinking＋tool_use の input を JSON にした長さ）から推定する。
// 0.74 は最終値がある日本語HTMLレポート作成時の応答で実測した比（2026-10-05）。thinking が伏せられている応答では過小になる。
const OUTPUT_TOKENS_PER_CHAR = 0.74;
const CSV_REL = path.join('reports', 'usage-log.csv');
// output_estimated_tokens = output_tokens のうち文字数から推定して上乗せした分（2026-10-05 追加。それ以前の行は空欄）
const HEADER = 'run_id,timestamp,theme,file,model,input_tokens,output_tokens,cache_write_tokens,cache_read_tokens,cost_usd,output_estimated_tokens';

const log = (...a) => { if (process.env.USAGE_HOOK_DEBUG) console.error('[usage-hook]', ...a); };

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(c => (c && c.text) || '').join('');
  return '';
}

// /report の起動を検出する。スラッシュコマンドはログ上 <command-name> タグで記録されることがあるため両対応
function detectReport(obj) {
  if (obj.isSidechain || !obj.message) return null;
  if (obj.type === 'user') {
    const t = textOf(obj.message.content);
    const tag = t.match(/<command-name>\s*\/?report\s*<\/command-name>/);
    if (tag) {
      const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/);
      return (args && args[1].trim()) || '(無題)';
    }
    const plain = t.trim().match(/^\/report(?:\s+([\s\S]*))?$/);
    if (plain) return (plain[1] || '').trim() || '(無題)';
  }
  // 「〇〇をレポートにして」のように自然文でスキルが呼ばれた場合（Skillツール呼び出し）
  if (obj.type === 'assistant' && Array.isArray(obj.message.content)) {
    for (const c of obj.message.content) {
      if (c && c.type === 'tool_use' && c.name === 'Skill' && /\breport\b/.test(JSON.stringify(c.input || {}))) {
        return '(スキル自動起動)';
      }
    }
  }
  return null;
}

function main() {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return; }

  // Windows ではシェルツール名が PowerShell になる場合があるので両方見る
  if (!['Bash', 'PowerShell'].includes(input.tool_name)) return;
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!/\bgit\s+push\b/.test(command)) return;

  // push が失敗していたら記録しない
  const resp = JSON.stringify(input.tool_response || '');
  if (/rejected|fatal:|error:/i.test(resp)) { log('push failed, skip'); return; }

  const cwd = input.cwd || process.cwd();
  const transcriptPath = input.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) { log('no transcript'); return; }

  const lines = readJsonl(transcriptPath);
  let startTime = null, theme = null;
  for (const obj of lines) {
    const found = detectReport(obj);
    if (found) {
      startTime = obj.timestamp;
      // 自然文起動の場合は、その直前のユーザー発言をテーマとして使う
      if (found === '(スキル自動起動)') {
        const prevUser = [...lines].reverse().find(o =>
          o.type === 'user' && !o.isSidechain && Date.parse(o.timestamp) <= Date.parse(obj.timestamp) &&
          typeof o.message?.content === 'string');
        theme = prevUser ? prevUser.message.content.trim().slice(0, 80) : found;
      } else {
        theme = found;
      }
    }
  }
  if (!startTime) { log('no /report found'); return; }
  const startMs = Date.parse(startTime);
  const sessionId = input.session_id || path.basename(transcriptPath, '.jsonl');
  const runId = `${sessionId}@${startTime}`;

  const csvPath = path.join(cwd, CSV_REL);
  if (fs.existsSync(csvPath) && fs.readFileSync(csvPath, 'utf8').includes(`"${runId}"`)) {
    log('already logged'); return; // 同じ /report を二重に記録しない
  }

  // 1つの応答がログ上で複数行に分割記録されるため、message.id 単位で最大値だけを採用（二重計上防止）
  // あわせて、最終値が記録されたか（stop_reason のある行があるか）と生成文字数も応答ごとに持つ
  const perMessage = new Map();
  const collect = (obj, agentId = null) => {
    if (obj.type !== 'assistant' || !obj.message || !obj.message.usage) return;
    if (Date.parse(obj.timestamp) < startMs) return;
    const m = obj.message;
    const key = `${m.id || obj.uuid}:${obj.requestId || ''}`;
    const e = perMessage.get(key) || { model: m.model, usage: m.usage, final: false, blocks: new Set(), agentId, time: 0 };
    if ((m.usage.output_tokens || 0) >= (e.usage.output_tokens || 0)) e.usage = m.usage;
    if (m.stop_reason) e.final = true;
    e.time = Math.max(e.time, Date.parse(obj.timestamp));
    for (const c of Array.isArray(m.content) ? m.content : []) e.blocks.add(JSON.stringify(c)); // 同じブロックが重複記録されても1回だけ数える
    perMessage.set(key, e);
  };
  lines.filter(o => !o.isSidechain).forEach(o => collect(o));
  lines.filter(o => o.isSidechain).forEach(o => collect(o)); // 古い形式: 同じファイル内にサブエージェント分がある場合

  // 新しい形式: <セッションID>/subagents/agent-<agentId>.jsonl にサブエージェント分がある
  const subDir = path.join(path.dirname(transcriptPath), path.basename(transcriptPath, '.jsonl'), 'subagents');
  if (fs.existsSync(subDir)) {
    for (const f of fs.readdirSync(subDir)) {
      if (!f.endsWith('.jsonl')) continue;
      const agentId = (f.match(/^agent-(.+)\.jsonl$/) || [])[1] || null;
      readJsonl(path.join(subDir, f)).forEach(o => collect(o, agentId));
    }
  }

  // サブエージェントの「最後の応答」だけは、親ログに正確な usage が残っている
  //   フォアグラウンド起動: Agent ツール結果 toolUseResult.usage（最後の応答の usage そのもの）
  //   バックグラウンド起動: 完了通知 attachment.usage.totalTokens（最後の応答の 入力＋キャッシュ＋出力 の合計）
  const finalByAgent = new Map();
  for (const o of lines) {
    const t = o.toolUseResult;
    if (t && typeof t === 'object' && t.agentId && t.usage && t.usage.output_tokens != null) {
      finalByAgent.set(t.agentId, { output: t.usage.output_tokens });
    }
    const a = o.type === 'attachment' && o.attachment;
    if (a && a.usage && a.usage.totalTokens != null) {
      const id = (String(a.prompt || '').match(/<task-id>([^<]+)<\/task-id>/) || [])[1];
      // ツール結果の値を優先。通知が複数回ある（再開した）場合は最新のものを使う
      if (id && (finalByAgent.get(id) || {}).output == null) finalByAgent.set(id, { total: a.usage.totalTokens });
    }
  }
  const lastByAgent = new Map();
  for (const e of perMessage.values()) {
    if (e.agentId && (!lastByAgent.has(e.agentId) || e.time > lastByAgent.get(e.agentId).time)) lastByAgent.set(e.agentId, e);
  }
  for (const [agentId, e] of lastByAgent) {
    const f = finalByAgent.get(agentId);
    if (!f || e.final) continue;
    const u = e.usage;
    const exact = f.output != null ? f.output
      : f.total - (u.input_tokens || 0) - (u.cache_creation_input_tokens || 0) - (u.cache_read_input_tokens || 0);
    if (exact >= (u.output_tokens || 0)) {
      e.usage = { ...u, output_tokens: exact };
      e.final = true;
      log('exact final output for', agentId, exact);
    }
  }

  const byModel = {};
  for (const e of perMessage.values()) {
    const { model, usage } = e;
    if (!model || model === '<synthetic>') continue;
    const b = byModel[model] ||= { input: 0, output: 0, cw: 0, cr: 0, est: 0 };
    let output = usage.output_tokens || 0;
    if (!e.final) {
      let chars = 0;
      for (const s of e.blocks) {
        const c = JSON.parse(s);
        if (c.type === 'text') chars += (c.text || '').length;
        else if (c.type === 'thinking') chars += (c.thinking || '').length;
        else if (c.type === 'tool_use') chars += JSON.stringify(c.input || {}).length;
      }
      const est = Math.round(chars * OUTPUT_TOKENS_PER_CHAR);
      if (est > output) { b.est += est - output; output = est; }
    }
    b.input += usage.input_tokens || 0;
    b.output += output;
    b.cw += usage.cache_creation_input_tokens || 0;
    b.cr += usage.cache_read_input_tokens || 0;
  }
  if (!Object.keys(byModel).length) { log('no usage'); return; }

  let reportFile = '';
  try {
    const diff = execFileSync('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], { cwd, encoding: 'utf8', stdio: 'pipe' });
    reportFile = diff.split(/\r?\n/).find(l => /^reports\/.+\.html$/.test(l) && !l.endsWith('index.html')) || '';
  } catch { /* ignore */ }

  const now = new Date().toISOString();
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  let total = 0;
  const rows = Object.entries(byModel).map(([model, b]) => {
    const p = PRICING[model] || { input: 0, output: 0 };
    const cost = (b.input * p.input + b.output * p.output + b.cw * p.input * 1.25 + b.cr * p.input * 0.1) / 1e6;
    total += cost;
    return [runId, now, theme, reportFile, model, b.input, b.output, b.cw, b.cr, cost.toFixed(4), b.est].map(q).join(',');
  });

  if (!fs.existsSync(csvPath)) {
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, HEADER + '\n', 'utf8');
  } else {
    // 列追加前のCSVなら、見出し行だけ新しいものに差し替える（データ行には触らない）
    const cur = fs.readFileSync(csvPath, 'utf8');
    const nl = cur.indexOf('\n');
    const first = (nl < 0 ? cur : cur.slice(0, nl)).replace(/\r$/, '');
    if (first !== HEADER && HEADER.startsWith(first + ',')) {
      fs.writeFileSync(csvPath, HEADER + (nl < 0 ? '\n' : cur.slice(nl)), 'utf8');
    }
  }
  fs.appendFileSync(csvPath, rows.join('\n') + '\n', 'utf8');
  log('logged', rows.length, 'rows, total', total.toFixed(4));

  try {
    const csvGitPath = CSV_REL.split(path.sep).join('/');
    execFileSync('git', ['add', csvGitPath], { cwd, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', `log usage: ${theme.slice(0, 50)} ($${total.toFixed(4)})`], { cwd, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd, timeout: 25000, stdio: 'pipe' });
  } catch (e) {
    log('git step failed (ローカルには記録済み、次回pushでまとめて送られる):', e.message);
  }
}

try { main(); } catch (e) { log('unexpected', e.message); }
process.exit(0); // どんな場合もメインの作業を止めない
