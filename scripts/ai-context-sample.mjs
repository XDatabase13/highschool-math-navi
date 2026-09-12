// AI-context JSON 生成の試作スクリプト（検証用・使い捨て）。
//
// 目的：ThinkingFlow単位のAI質問機能に向けて、公開Markdownスナップショット
// （src/content/quadratic27・src/content/trig4）から、DOM/生成HTMLを経由せず、
// 正本Markdownの見出し構造をそのまま反映したAI-context JSONを生成できるか
// 代表3問だけで検証する。
//
// 見出し階層のグルーピング（##→###→####の再帰的な分割、(1)のようなpart番号抽出、
// ThinkingFlow見出しの☆マーク処理）は、src/utils/markdownSections.ts の
// parseMarkdownSections / groupByDepth / buildSections、および
// src/utils/prepareQuadratic27Entry.ts の parseStepTitle と同じアルゴリズムを
// 再利用する。ただし本番側はKaTeX適用後のHTMLを返すのに対し、ここでは
// remark-parseのposition情報を使って元のMarkdownソースをそのままスライスし、
// 生LaTeXを保持したテキストを返す点だけが異なる。
//
// 本番buildパイプラインには組み込まない。commit/push・全95問への展開もまだ行わない。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// 第1弾（M1-QF-001／M1-QF-017／M1-TR-017）で生成した3ファイルは変更しないため、
// このtargets配列は特殊Markdownパターン検証用の3問だけに絞ってある。
// 第1弾と同じ関数・同じスクリプトを使い回すことで「変換ロジックの再利用」を保つ。
const targets = [
  { id: 'M1-QF-047', collection: 'quadratic27' }, // ## 問題の言い換え を持つ代表
  { id: 'M1-TR-008', collection: 'trig4' }, // パイプ表（remark-gfm）を持つ代表
  { id: 'M1-TR-015', collection: 'trig4' }, // 生HTML（<p style="...">）を持つ代表
];

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

function headingText(node) {
  let text = '';
  const walk = (n) => {
    if (n.type === 'text' || n.type === 'inlineMath') text += n.value;
    else if (n.children) n.children.forEach(walk);
  };
  node.children.forEach(walk);
  return text.trim();
}

function groupByDepth(nodes, depth) {
  const groups = [];
  let current = null;
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === depth) {
      current = { title: headingText(node), nodes: [] };
      groups.push(current);
    } else if (current) {
      current.nodes.push(node);
    }
  }
  return groups;
}

function rawTextOf(nodes, source) {
  if (nodes.length === 0) return '';
  const start = nodes[0].position.start.offset;
  const end = nodes[nodes.length - 1].position.end.offset;
  return source.slice(start, end).trim();
}

// markdownSections.ts の buildSections と同じ再帰分割。html化する代わりに
// 元ソースをスライスしたrawTextを返す。
function buildRawSections(nodes, depth, source) {
  const groups = groupByDepth(nodes, depth);
  return groups.map((group) => {
    const deeperIdx = group.nodes.findIndex((n) => n.type === 'heading' && n.depth === depth + 1);
    const hasDeeper = deeperIdx !== -1;
    const ownNodes = hasDeeper ? group.nodes.slice(0, deeperIdx) : group.nodes;
    const subsections = hasDeeper ? buildRawSections(group.nodes, depth + 1, source) : [];
    const partMatch = group.title.match(/^\((\d+)\)/);
    return {
      title: group.title,
      rawText: rawTextOf(ownNodes, source),
      subsections,
      partNumber: partMatch ? Number(partMatch[1]) : undefined,
    };
  });
}

function findSection(sections, title) {
  return sections.find((s) => s.title === title);
}

// prepareQuadratic27Entry.ts の parseStepTitle と同じ、☆マーク検出・除去ロジック。
const MARKER_PATTERN = /^(\d+\.\s*)(☆☆|☆|（技）☆)\s*(.*)$/;
function parseStepTitle(title) {
  const match = title.match(MARKER_PATTERN);
  if (!match) return { displayTitle: title, highlighted: false };
  const [, prefix, , rest] = match;
  return { displayTitle: `${prefix}${rest}`, highlighted: true };
}

function normalizeAsset(a) {
  return {
    file: a.file ?? null,
    placement: a.placement ?? null,
    part: a.part ?? null,
    flow: a.flow ?? null,
    type: a.type ?? null,
    purpose: a.purpose || null,
    must_show: a.must_show ?? [],
    must_not_show: a.must_not_show ?? [],
  };
}

// flowAssetKey（prepareQuadratic27Entry.ts）と同じキー形式：
// part指定ありなら "part:flow"、なければ "flow"。
function flowKey(part, flow) {
  return part !== null && part !== undefined ? `${part}:${flow}` : `${flow}`;
}

function buildThinkingFlow(thinkingFlowSection) {
  if (!thinkingFlowSection) return [];
  const isNormal = thinkingFlowSection.subsections.every((s) => s.subsections.length === 0);
  const flows = [];
  if (isNormal) {
    thinkingFlowSection.subsections.forEach((step, idx) => {
      const flowNum = idx + 1;
      const { displayTitle, highlighted } = parseStepTitle(step.title);
      flows.push({
        part: null,
        flow: flowNum,
        flow_key: flowKey(null, flowNum),
        raw_title: step.title,
        title: displayTitle,
        highlighted,
        text: step.rawText,
      });
    });
  } else {
    thinkingFlowSection.subsections.forEach((part) => {
      const partNumber = part.partNumber ?? null;
      const { displayTitle: partDisplayTitle, highlighted: partHighlighted } = parseStepTitle(part.title);
      part.subsections.forEach((step, idx) => {
        const flowNum = idx + 1;
        const { displayTitle, highlighted } = parseStepTitle(step.title);
        flows.push({
          part: partNumber,
          flow: flowNum,
          flow_key: flowKey(partNumber, flowNum),
          part_raw_title: part.title,
          part_title: partDisplayTitle,
          part_highlighted: partHighlighted,
          raw_title: step.title,
          title: displayTitle,
          highlighted,
          text: step.rawText,
        });
      });
    });
  }
  return flows;
}

function attachAssets(flows, assets) {
  return flows.map((f) => ({
    ...f,
    assets: assets
      .filter((a) => a.placement === 'flow' && (a.part ?? null) === f.part && a.flow === f.flow)
      .map(normalizeAsset),
  }));
}

function buildTextBlock(section) {
  if (!section) return { text: '', parts: [] };
  return {
    text: section.rawText,
    parts: section.subsections.map((s) => ({
      part: s.partNumber ?? null,
      raw_title: s.title,
      text: s.rawText,
    })),
  };
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('frontmatterが見つかりません');
  return { frontmatter: yaml.load(match[1]) ?? {}, body: match[2] };
}

// 元Markdownファイルは変更せず、AI-context生成時（メモリ上の文字列）だけ
// CRLF/CRをLFへ正規化する。remark-parseのposition offsetは正規化後の文字列に
// 対して取り直すため、スライス結果とも整合する。
function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function countRawHeadings(thinkingFlowRaw, pattern) {
  const lines = thinkingFlowRaw.split(/\r?\n/);
  return lines.filter((line) => pattern.test(line)).length;
}

function validate(target, output, rawBody) {
  const issues = [];

  if (output.problem_id !== target.id) {
    issues.push(`problem_idが不一致: expected ${target.id}, got ${output.problem_id}`);
  }
  if (!output.problem.text || output.problem.text.length === 0) {
    issues.push('問題文が空です');
  }
  if (!output.final_answer.text && output.final_answer.parts.length === 0) {
    issues.push('最終解答が空です');
  }

  // ThinkingFlowセクションの生テキストを取り出し、見出し行数を独立にカウントして
  // パース結果のFlow数と突き合わせる（同じgroupByDepthロジックを使い回さない
  // という意味での独立チェック）。
  const tfMatch = rawBody.match(/## ThinkingFlow\r?\n([\s\S]*?)(\r?\n## |$)/);
  const tfRaw = tfMatch ? tfMatch[1] : '';
  const hasParts = /^### \(\d+\)/m.test(tfRaw);
  const expectedFlowCount = hasParts
    ? countRawHeadings(tfRaw, /^#### \d+\./)
    : countRawHeadings(tfRaw, /^### \d+\./);
  if (expectedFlowCount !== output.thinking_flow.length) {
    issues.push(
      `Flow数が不一致: 生Markdownの見出しカウント=${expectedFlowCount}, JSON側=${output.thinking_flow.length}`,
    );
  }

  const fullJson = JSON.stringify(output);
  if (fullJson.includes('\\r')) {
    issues.push('LF正規化漏れ: 出力中に\\r（CR）が残っています');
  }

  const keys = output.thinking_flow.map((f) => f.flow_key);
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== keys.length) {
    issues.push(`flow_keyの重複があります: ${keys.join(', ')}`);
  }

  for (const flow of output.thinking_flow) {
    const dollarCount = (flow.text.match(/\$/g) ?? []).length;
    if (dollarCount % 2 !== 0) {
      issues.push(`flow_key=${flow.flow_key}: "$"の数が奇数（LaTeX破損の疑い）`);
    }
  }

  const totalFrontmatterFlowAssets = (
    Array.isArray(output._debugAssets) ? output._debugAssets : []
  ).filter((a) => a.placement === 'flow').length;
  const totalAttached = output.thinking_flow.reduce((sum, f) => sum + f.assets.length, 0);
  if (totalFrontmatterFlowAssets !== totalAttached) {
    issues.push(
      `flow紐付けasset数が不一致: frontmatter側=${totalFrontmatterFlowAssets}, 紐付け後=${totalAttached}`,
    );
  }

  return issues;
}

async function buildOne(target) {
  const filePath = path.join(repoRoot, 'src', 'content', target.collection, `${target.id}.md`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body: rawBody } = parseFrontmatter(raw);
  const body = normalizeLineEndings(rawBody);

  const tree = processor.parse(body);
  processor.runSync(tree);

  const topSections = buildRawSections(tree.children, 2, body);
  const problemSection = findSection(topSections, '問題');
  // 「## 問題の言い換え」は存在する問題だけに現れる任意セクション（本番UIの
  // paraphraseと同じ扱い）。問題IDで判定せず、セクションの有無だけで含めるかを決める。
  const paraphraseSection = findSection(topSections, '問題の言い換え');
  const thinkingFlowSection = findSection(topSections, 'ThinkingFlow');
  const finalAnswerSection = findSection(topSections, '最終解答');

  const assets = Array.isArray(frontmatter.assets) ? frontmatter.assets : [];
  const thinkingFlow = attachAssets(buildThinkingFlow(thinkingFlowSection), assets);

  const output = {
    problem_id: frontmatter.problem_id,
    subject: frontmatter.subject,
    unit: frontmatter.unit,
    section: frontmatter.section,
    problem: buildTextBlock(problemSection),
    // 存在しない問題が大半のため、必須構造にはせずnull許容にする
    // （AI利用時はproblem.textを問題全文として使えれば足りる想定）。
    paraphrase: paraphraseSection ? buildTextBlock(paraphraseSection) : null,
    thinking_flow: thinkingFlow,
    final_answer: buildTextBlock(finalAnswerSection),
    assets_problem: assets.filter((a) => a.placement === 'problem').map(normalizeAsset),
    assets_final_answer: assets.filter((a) => a.placement === 'final_answer').map(normalizeAsset),
    source_file: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
  };

  // 検証専用の内部フィールド（frontmatter生assetsをvalidateへ渡すだけ）。出力ファイルには含めない。
  const issues = validate(target, { ...output, _debugAssets: assets }, body);

  return { output, issues };
}

const results = [];
for (const target of targets) {
  const { output, issues } = await buildOne(target);
  const outPath = path.join(repoRoot, `ai_context_sample_${target.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  results.push({ target, outPath, output, issues });
}

console.log('=== AI-context JSON 試作：生成結果 ===');
for (const { target, outPath, output, issues } of results) {
  console.log(`\n[${target.id}] (${target.collection}) -> ${path.relative(repoRoot, outPath)}`);
  console.log(`  problem.parts: ${output.problem.parts.length}`);
  console.log(`  paraphrase: ${output.paraphrase ? `あり(parts:${output.paraphrase.parts.length})` : 'なし(null)'}`);
  console.log(`  thinking_flow: ${output.thinking_flow.length}件`);
  console.log(`  flow_keys: ${output.thinking_flow.map((f) => f.flow_key).join(', ')}`);
  console.log(`  final_answer.parts: ${output.final_answer.parts.length}`);
  console.log(`  assets_problem: ${output.assets_problem.length}件`);
  console.log(`  assets_final_answer: ${output.assets_final_answer.length}件`);
  console.log(
    `  flow内asset合計: ${output.thinking_flow.reduce((sum, f) => sum + f.assets.length, 0)}件`,
  );
  if (issues.length === 0) {
    console.log('  検証: 問題なし');
  } else {
    console.log('  検証: 要確認');
    issues.forEach((issue) => console.log(`    - ${issue}`));
  }
}
