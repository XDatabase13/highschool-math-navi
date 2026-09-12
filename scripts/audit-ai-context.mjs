// 本番AI-context JSON（npm run build後のdist/ai-context/*.json）の全件機械監査。
// 検証用スクリプト（本番buildパイプラインには組み込まない）。
// 公開Markdownスナップショット（src/content/quadratic27・trig4）と突き合わせる。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist', 'ai-context');

const collections = [
  { dir: path.join(repoRoot, 'src', 'content', 'quadratic27'), name: 'quadratic27', prefix: 'M1-QF-' },
  { dir: path.join(repoRoot, 'src', 'content', 'trig4'), name: 'trig4', prefix: 'M1-TR-' },
];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('frontmatterが見つかりません');
  return { frontmatter: yaml.load(match[1]) ?? {}, body: match[2] };
}

function countRawHeadings(text, pattern) {
  return text.split(/\r?\n/).filter((line) => pattern.test(line)).length;
}

const allIssues = [];
const problemIds = new Set();
let totalFlows = 0;
let totalFlowAssets = 0;
let paraphraseCount = 0;
let tableProblems = [];
let rawHtmlProblems = [];
let generatedCount = 0;
const perCollectionCount = { quadratic27: 0, trig4: 0 };

for (const col of collections) {
  const files = fs.readdirSync(col.dir).filter((f) => f.startsWith(col.prefix) && f.endsWith('.md'));
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const mdRaw = fs.readFileSync(path.join(col.dir, file), 'utf8');
    const { frontmatter, body: rawBody } = parseFrontmatter(mdRaw);
    const body = rawBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    if (frontmatter.verification_status !== '独立検算済み') {
      // 検算未了はAI-context生成の対象外。分母（95問想定）には数えない。
      continue;
    }

    const jsonPath = path.join(distDir, `${id}.json`);
    if (!fs.existsSync(jsonPath)) {
      allIssues.push({ id, field: '-', reason: `独立検算済みなのにdist/ai-context/${id}.jsonが生成されていない` });
      continue;
    }
    generatedCount += 1;
    perCollectionCount[col.name] += 1;

    const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
    let ctx;
    try {
      ctx = JSON.parse(jsonRaw);
    } catch (e) {
      allIssues.push({ id, field: '-', reason: `JSON parse失敗: ${e.message}` });
      continue;
    }

    // problem_id重複
    if (problemIds.has(ctx.problem_id)) {
      allIssues.push({ id, field: 'problem_id', reason: `problem_idの重複: ${ctx.problem_id}` });
    }
    problemIds.add(ctx.problem_id);

    if (ctx.problem_id !== id) {
      allIssues.push({ id, field: 'problem_id', reason: `ファイル名とproblem_idが不一致: ${ctx.problem_id}` });
    }

    // CRLF/CR残存
    if (jsonRaw.includes('\r')) {
      allIssues.push({ id, field: '-', reason: 'CR残存（LF正規化漏れ）' });
    }

    // 問題文
    if (!ctx.problem || !ctx.problem.text || ctx.problem.text.length === 0) {
      allIssues.push({ id, field: 'problem.text', reason: '問題文が空' });
    }

    // 最終解答（textが空でもparts、またはfinal_answer placementのassetがあればOK。
    // 例：M1-QF-002はグラフ描画のみが解答でテキストを持たない）。
    const faEmpty =
      (!ctx.final_answer.text || ctx.final_answer.text.length === 0) &&
      (!ctx.final_answer.parts || ctx.final_answer.parts.length === 0) &&
      ctx.assets_final_answer.length === 0;
    if (faEmpty) {
      allIssues.push({ id, field: 'final_answer', reason: '最終解答が空（text・parts・final_answer assetともに空）' });
    }

    // ThinkingFlow数の独立チェック
    const tfMatch = body.match(/## ThinkingFlow\n([\s\S]*?)(\n## |$)/);
    const tfRaw = tfMatch ? tfMatch[1] : '';
    // グループ見出し（###）が"(n)"形式かどうかではなく、実際に####（深い見出し）が
    // 存在するかどうかで判定する。M1-TR-021のように"(n)"形式でないグループ名
    // （"補助Flow：..."等）でも、####が存在すれば正しくネスト構造として数える。
    const hasNestedFlows = /^#### /m.test(tfRaw);
    const expectedFlowCount = hasNestedFlows
      ? countRawHeadings(tfRaw, /^#### \d+\./)
      : countRawHeadings(tfRaw, /^### \d+\./);
    if (expectedFlowCount !== ctx.thinking_flow.length) {
      allIssues.push({
        id,
        field: 'thinking_flow',
        reason: `Flow数不一致: 生Markdown見出しカウント=${expectedFlowCount}, JSON=${ctx.thinking_flow.length}`,
      });
    }
    totalFlows += ctx.thinking_flow.length;

    // context_key（AI用の一意識別子）：1からの連番"f1","f2",...で、表示順・重複なしを
    // 必須とする。flow_key（教材構造・asset対応のための既存キー）は、M1-TR-021のように
    // "(n)"形式でない複数グループが存在する問題では自然に重複しうるため、
    // ここでは異常扱いしない（一意性の判定はcontext_key側に一本化する）。
    const seenContextKeys = new Set();
    ctx.thinking_flow.forEach((flow, idx) => {
      const expectedContextKey = `f${idx + 1}`;
      if (!flow.context_key) {
        allIssues.push({ id, field: 'thinking_flow[].context_key', reason: 'context_keyが存在しない' });
      } else if (seenContextKeys.has(flow.context_key)) {
        allIssues.push({ id, field: 'thinking_flow[].context_key', reason: `context_key重複: ${flow.context_key}` });
      } else if (flow.context_key !== expectedContextKey) {
        allIssues.push({
          id,
          field: 'thinking_flow[].context_key',
          reason: `context_keyが表示順の連番になっていない: index=${idx}, context_key=${flow.context_key}, expected=${expectedContextKey}`,
        });
      }
      seenContextKeys.add(flow.context_key);

      if (flow.part !== null && (!Number.isInteger(flow.part) || flow.part < 1)) {
        allIssues.push({ id, field: 'thinking_flow[].part', reason: `partが不正: ${JSON.stringify(flow.part)}` });
      }
      if (!Number.isInteger(flow.flow) || flow.flow < 1) {
        allIssues.push({ id, field: 'thinking_flow[].flow', reason: `flowが不正: ${JSON.stringify(flow.flow)}` });
      }
      const expectedKey = flow.part !== null ? `${flow.part}:${flow.flow}` : `${flow.flow}`;
      if (flow.flow_key !== expectedKey) {
        allIssues.push({
          id,
          field: 'thinking_flow[].flow_key',
          reason: `flow_keyがpart/flowと不整合: flow_key=${flow.flow_key}, expected=${expectedKey}`,
        });
      }

      // 生LaTeXの$の数が偶数か（簡易チェック）
      const dollarCount = (flow.text.match(/\$/g) ?? []).length;
      if (dollarCount % 2 !== 0) {
        allIssues.push({
          id,
          field: `thinking_flow[flow_key=${flow.flow_key}].text`,
          reason: '"$"の数が奇数（LaTeX破損の疑い）',
        });
      }
    });

    // flow-placement asset紐付け
    const frontmatterAssets = Array.isArray(frontmatter.assets) ? frontmatter.assets : [];
    const flowAssetsInFrontmatter = frontmatterAssets.filter((a) => a.placement === 'flow').length;
    const flowAssetsAttached = ctx.thinking_flow.reduce((sum, f) => sum + f.assets.length, 0);
    if (flowAssetsInFrontmatter !== flowAssetsAttached) {
      allIssues.push({
        id,
        field: 'thinking_flow[].assets',
        reason: `flow-asset紐付け数不一致: frontmatter=${flowAssetsInFrontmatter}, JSON=${flowAssetsAttached}`,
      });
    }
    totalFlowAssets += flowAssetsAttached;

    // problem/final_answer placement asset
    const problemAssetsExpected = frontmatterAssets.filter((a) => a.placement === 'problem').length;
    const finalAnswerAssetsExpected = frontmatterAssets.filter((a) => a.placement === 'final_answer').length;
    if (problemAssetsExpected !== ctx.assets_problem.length) {
      allIssues.push({
        id,
        field: 'assets_problem',
        reason: `assets_problem数不一致: frontmatter=${problemAssetsExpected}, JSON=${ctx.assets_problem.length}`,
      });
    }
    if (finalAnswerAssetsExpected !== ctx.assets_final_answer.length) {
      allIssues.push({
        id,
        field: 'assets_final_answer',
        reason: `assets_final_answer数不一致: frontmatter=${finalAnswerAssetsExpected}, JSON=${ctx.assets_final_answer.length}`,
      });
    }

    // paraphrase
    const hasParaphraseInMd = /^## 問題の言い換え$/m.test(body);
    if (hasParaphraseInMd && ctx.paraphrase === null) {
      allIssues.push({ id, field: 'paraphrase', reason: '元Markdownに言い換えがあるのにJSONではnull' });
    }
    if (!hasParaphraseInMd && ctx.paraphrase !== null) {
      allIssues.push({ id, field: 'paraphrase', reason: '元Markdownに言い換えが無いのにJSONでnullでない' });
    }
    if (hasParaphraseInMd && ctx.paraphrase !== null) {
      paraphraseCount += 1;
      if (!ctx.paraphrase.text && ctx.paraphrase.parts.length === 0) {
        allIssues.push({ id, field: 'paraphrase', reason: '言い換えセクションはあるがtext/partsとも空' });
      }
    }

    // Markdown table
    const hasTableInMd = /^\s*\|.*\|\s*$/m.test(body);
    if (hasTableInMd) {
      tableProblems.push(id);
      const combinedText = [
        ctx.problem.text,
        ...ctx.problem.parts.map((p) => p.text),
        ctx.final_answer.text,
        ...ctx.final_answer.parts.map((p) => p.text),
        ...ctx.thinking_flow.map((f) => f.text),
      ].join('\n');
      if (!combinedText.includes('|')) {
        allIssues.push({ id, field: '-', reason: 'Markdown tableが元Markdownにあるが、JSON側に"|"が見当たらない' });
      }
    }

    // 生HTML：数式の不等号（"a>0"等）を誤検知しないよう、実在のHTMLタグ名限定・
    // 同一行内（改行を跨がない）でのタグ検出に絞る。
    const HTML_TAG_PATTERN = /<(p|div|span|table|thead|tbody|tr|td|th|br|hr|b|strong|em|i|ul|ol|li|a|img|h[1-6]|code|pre)[ >/][^\n]*?>/i;
    const hasRawHtmlInMd = HTML_TAG_PATTERN.test(body);
    if (hasRawHtmlInMd) {
      rawHtmlProblems.push(id);
      const combinedText = [
        ctx.problem.text,
        ...ctx.problem.parts.map((p) => p.text),
        ctx.final_answer.text,
        ...ctx.final_answer.parts.map((p) => p.text),
        ...ctx.thinking_flow.map((f) => f.text),
        ctx.paraphrase ? ctx.paraphrase.text : '',
      ].join('\n');
      if (!HTML_TAG_PATTERN.test(combinedText)) {
        allIssues.push({ id, field: '-', reason: '生HTMLが元Markdownにあるが、JSON側にタグが見当たらない' });
      }
    }
  }
}

console.log('=== AI-context 全件機械監査 ===');
console.log(`生成JSON数: ${generatedCount}（QF: ${perCollectionCount.quadratic27} / TR: ${perCollectionCount.trig4}）`);
console.log(`problem_idユニーク数: ${problemIds.size}`);
console.log(`総ThinkingFlow数: ${totalFlows}`);
console.log(`flow-asset紐付け総数: ${totalFlowAssets}`);
console.log(`paraphrase対象問題数: ${paraphraseCount}`);
console.log(`Markdown table問題数: ${tableProblems.length} (${tableProblems.join(', ')})`);
console.log(`生HTML問題数: ${rawHtmlProblems.length} (${rawHtmlProblems.join(', ')})`);
console.log('');
if (allIssues.length === 0) {
  console.log('監査結果: 問題なし（全チェック通過）');
} else {
  console.log(`監査結果: ${allIssues.length}件のissueあり`);
  for (const issue of allIssues) {
    console.log(`  [${issue.id}] ${issue.field}: ${issue.reason}`);
  }
}
