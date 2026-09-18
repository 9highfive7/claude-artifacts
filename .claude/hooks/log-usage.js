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
  'claude-opus-5':   { input: 5.00, output: 25.00 },
  'claude-sonnet-5': { input: 2.00, output: 10.00 }, // 要確認: $3/$15 とする情報もある
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
};
const CSV_REL = path.join('reports', 'usage-log.csv');
const HEADER = 'run_id,timestamp,theme,file,model,input_tokens,output_tokens,cache_write_tokens,cache_read_tokens,cost_usd';

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
  const perMessage = new Map();
  const collect = (obj) => {
    if (obj.type !== 'assistant' || !obj.message || !obj.message.usage) return;
    if (Date.parse(obj.timestamp) < startMs) return;
    const m = obj.message;
    const key = `${m.id || obj.uuid}:${obj.requestId || ''}`;
    const prev = perMessage.get(key);
    if (!prev || (m.usage.output_tokens || 0) >= (prev.usage.output_tokens || 0)) {
      perMessage.set(key, { model: m.model, usage: m.usage });
    }
  };
  lines.filter(o => !o.isSidechain).forEach(collect);
  lines.filter(o => o.isSidechain).forEach(collect); // 古い形式: 同じファイル内にサブエージェント分がある場合

  // 新しい形式: <セッションID>/subagents/*.jsonl にサブエージェント分がある
  const subDir = path.join(path.dirname(transcriptPath), path.basename(transcriptPath, '.jsonl'), 'subagents');
  if (fs.existsSync(subDir)) {
    for (const f of fs.readdirSync(subDir)) {
      if (f.endsWith('.jsonl')) readJsonl(path.join(subDir, f)).forEach(collect);
    }
  }

  const byModel = {};
  for (const { model, usage } of perMessage.values()) {
    if (!model || model === '<synthetic>') continue;
    const b = byModel[model] ||= { input: 0, output: 0, cw: 0, cr: 0 };
    b.input += usage.input_tokens || 0;
    b.output += usage.output_tokens || 0;
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
    return [runId, now, theme, reportFile, model, b.input, b.output, b.cw, b.cr, cost.toFixed(4)].map(q).join(',');
  });

  if (!fs.existsSync(csvPath)) {
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, HEADER + '\n', 'utf8');
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
