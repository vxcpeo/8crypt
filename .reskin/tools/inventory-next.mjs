#!/usr/bin/env node
/**
 * Next.js/React adaptation of the reskin inventory.
 *
 * The reskin skill's own inventory parses Vue SFCs. This target is a Next.js 15
 * App Router site, so this module extracts the same decision inputs (routes,
 * palette, design signals, archetype, and a source content contract) from TSX,
 * CSS and package metadata while keeping the skill's contract shape.
 *
 * Usage:
 *   node .reskin/tools/inventory-next.mjs --project . --out .reskin --baseline
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const TEXT_EXT = new Set(['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.css', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.reskin', '.git', 'dist', 'build', 'coverage']);
const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&nbsp;': ' ', '&times;': '×',
  '&rarr;': '→', '&larr;': '←', '&middot;': '·', '&bull;': '•',
};

function parseArgs(argv) {
  const args = { project: process.cwd(), out: '.reskin', baseline: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--project' || a === '-p') args.project = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--baseline') args.baseline = true;
    else if (a === '--force') args.force = true;
  }
  return args;
}

const normalizeSlashes = (p) => p.replace(/\\/g, '/');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeText(value) {
  let out = String(value || '');
  for (const [entity, char] of Object.entries(ENTITIES)) out = out.split(entity).join(char);
  out = out.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  out = out.replace(/\\n/g, ' ').replace(/\\t/g, ' ');
  return out.replace(/\s+/g, ' ').trim();
}

const hasWordLike = (value) => /[\p{L}\p{N}]/u.test(value);
const inc = (map, key, meta = {}) => {
  if (!key) return;
  const current = map.get(key) || { ...meta, count: 0 };
  current.count += 1;
  map.set(key, current);
};

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function walk(root, rel = '', out = []) {
  const dir = path.join(root, rel);
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(root, path.join(rel, entry.name), out);
    } else if (entry.isFile()) {
      out.push(normalizeSlashes(path.join(rel, entry.name)));
    }
  }
  return out;
}

function hexFromColor(match) {
  const raw = match.replace('#', '');
  if (raw.length === 3 || raw.length === 4) return `#${raw.split('').map((c) => c + c).join('').slice(0, 6).toLowerCase()}`;
  if (raw.length === 6 || raw.length === 8) return `#${raw.slice(0, 6).toLowerCase()}`;
  return null;
}

function parseColors(text, map) {
  const re = /#([0-9a-fA-F]{3,8})\b|rgba?\(\s*([^)]+)\)/g;
  let m;
  while ((m = re.exec(text))) {
    let hex = null;
    if (m[1]) {
      hex = hexFromColor(`#${m[1]}`);
    } else if (m[2]) {
      const parts = m[2].split(',').map((p) => Number.parseFloat(p.trim()));
      const alpha = parts.length > 3 ? parts[3] : 1;
      if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite) && alpha > 0.25) {
        hex = `#${parts.slice(0, 3).map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
      }
    }
    if (hex) inc(map, hex, { hex });
  }
}

function isProseText(value) {
  if (!value || value.length < 2) return false;
  if (!/[\p{L}\p{N}]/u.test(value)) return false;
  if (/[=;()[\]{}<>|&"`]/.test(value)) return false;
  if (/\b(const|return|function|useState|useEffect|className|offer\.|card\.|wallet\.)/.test(value)) return false;
  if (/=>|===|!==/.test(value)) return false;
  return true;
}

function isCopyString(value) {
  if (value.length < 8 || value.length > 400) return false;
  if (!/\s/.test(value)) return false;
  if (!/[\p{L}]/u.test(value)) return false;
  if (/[_]/.test(value)) return false;
  if (/[{}<>;=()[\]\\|&]/.test(value)) return false;
  if (value.includes('`') || value.includes('"')) return false;
  if (/(^|\s)'[^']*'($|\s)/.test(value)) return false;
  if (/\b(const|return|function|useState|useEffect|className)\b/.test(value)) return false;
  if (value.includes('://')) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (value.startsWith('/') || value.startsWith('@') || value.startsWith('.') || value.startsWith('#')) return false;
  if (/^[\w-]+$/.test(value)) return false;
  return true;
}

function extractCopyLiterals(text) {
  const values = [];
  const re = /\b(title|body|q|a|description|label|heading|eyebrow|kicker|placeholder|alt)\s*:\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[2] ?? m[3] ?? m[4] ?? '';
    const value = normalizeText(raw.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/&apos;/g, "'"));
    if (isCopyString(value)) values.push(value);
  }
  return values;
}

function extractJsxText(text) {
  const withoutComments = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
  const values = [];
  for (const m of withoutComments.matchAll(/>([^<>{}]+)</g)) {
    const value = normalizeText(m[1]);
    if (value.length >= 2 && hasWordLike(value) && isProseText(value)) values.push(value);
  }
  return values;
}

function collectAttributes(text, map) {
  const re = /\b(alt|title|placeholder)="([^"{}]+)"/g;
  let m;
  while ((m = re.exec(text))) {
    const value = normalizeText(m[2]);
    if (value) inc(map, `${m[1]}\u0000${value}`, { name: m[1], value });
  }
}

function extractRoutes(files) {
  const paths = new Map();
  for (const rel of files) {
    const m = rel.match(/^app\/(.*\/)?page\.tsx$/);
    if (!m) continue;
    const segments = rel.replace(/^app\//, '').replace(/\/?page\.tsx$/, '');
    const parts = segments ? segments.split('/') : [];
    const dynamic = parts.some((part) => part.startsWith('['));
    paths.set('/' + parts.join('/'), { path: '/' + parts.join('/'), dynamic });
  }
  const order = ['/', '/app', '/offers', '/docs'];
  const list = [...paths.values()];
  list.sort((a, b) => {
    const ai = order.indexOf(a.path); const bi = order.indexOf(b.path);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.path.localeCompare(b.path);
  });
  return list.length ? list : [{ path: '/', dynamic: false }];
}

function detectArchetype(sources, cssTexts) {
  const all = [...sources.values()].join('\n');
  const lower = all.toLowerCase();
  const css = cssTexts.join('\n').toLowerCase();
  const split = /tx-aside/.test(all) && /position:\s*sticky/.test(css) && /tx-shell/.test(all);
  // Console skeleton: a sticky status bar + hairline pane grid + mono chrome.
  const consoleShell =
    /gx-console/.test(all)
    && /gx-status/.test(all)
    && /gx-pane/.test(all)
    && /grid-template-columns:\s*220px/.test(css);
  const traits = {
    split,
    statusbar: /gx-status/.test(all),
    console: /gx-console/.test(all),
    panes: /gx-pane/.test(all),
    sticky: /position:\s*sticky/.test(css),
    sidebar: split,
    hero: /\bhero\b|\bplate\b|\bgx-title\b/.test(lower),
    cards: /\bcard\b|\btile\b|\bpanel\b/.test(lower),
    ledger: /gx-band|gx-table|gx-spec/.test(all),
    table: /<table\b/.test(all),
    grid: /display\s*:\s*grid|grid-template/.test(css),
    monoChrome: /--gx-mono/.test(all) && /letter-spacing:\s*0\.1em/.test(css),
  };
  if (consoleShell) return { id: 'terminal-console', family: 'linear', traits };
  if (split) return { id: 'split-stage', family: 'spatial', traits };
  return { id: 'topnav-marketing', family: 'marketing', traits };
}

export async function analyzeProject(projectDir) {
  const root = path.resolve(projectDir);
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const allFiles = await walk(root);
  const sourceFiles = allFiles.filter((rel) => !rel.startsWith('public/') && TEXT_EXT.has(path.extname(rel).toLowerCase()));
  const sources = new Map();
  const paletteMap = new Map();
  const fontMap = new Map();
  const colorVars = [];
  const visibleText = new Map();
  const attributes = new Map();
  const api = new Set();
  const env = new Set();
  const cssTexts = [];

  for (const rel of sourceFiles) {
    let text;
    try { text = await fs.readFile(path.join(root, rel), 'utf8'); } catch { continue; }
    sources.set(rel, text);
    const ext = path.extname(rel).toLowerCase();
    if (ext === '.css') {
      cssTexts.push(text);
      parseColors(text, paletteMap);
      const fontRe = /font-family\s*:\s*([^;}]+)/gi;
      let fm;
      while ((fm = fontRe.exec(text))) {
        const value = fm[1].replace(/\s+/g, ' ').trim();
        if (value && !value.startsWith('var(')) inc(fontMap, value, { value });
      }
      const varRe = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g;
      let vm;
      while ((vm = varRe.exec(text))) colorVars.push({ name: vm[1], value: vm[2].startsWith('#') ? hexFromColor(vm[2]) : vm[2] });
    }
    if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
      for (const value of extractJsxText(text)) inc(visibleText, value, { value, source: rel });
      for (const value of extractCopyLiterals(text)) inc(visibleText, value, { value, source: rel });
      collectAttributes(text, attributes);
      for (const am of text.matchAll(/fetch\(\s*[`'"]([^`'"]*\/api\/[^`'"]*)[`'"]/g)) api.add(am[1]);
      for (const em of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]{2,})/g)) env.add(em[1]);
    }
  }

  const routes = extractRoutes(allFiles);
  const archetype = detectArchetype(sources, cssTexts);
  const contract = {
    schemaVersion: 1,
    meta: { projectName: pkg.name || path.basename(root), title: 'Gradix — swap graded Pokémon cards, no selling first', lang: 'en' },
    routes: routes.map((r) => r.path),
    visibleText: [...visibleText.values()].map(({ value, count }) => ({ value, count })),
    hiddenText: [],
    attributes: [...attributes.values()].map(({ name, value, count }) => ({ name, value, count })),
    bindings: [],
    events: [],
    links: [],
    assets: [],
    forms: [],
    i18n: [],
    i18nKeys: [],
    i18nFiles: [],
    api: [...api].sort(),
    env: [...env].sort(),
  };
  const contractHash = sha256(stableStringify(contract));

  // The site is dark with a red accent; expose the two anchors explicitly for
  // the deterministic style selector even if a stylesheet reorders colors.
  const seenVars = new Set();
  const paletteVars = colorVars
    .filter((v) => {
      if (!v.value || !String(v.value).startsWith('#') || seenVars.has(v.name)) return false;
      seenVars.add(v.name);
      return true;
    })
    .slice(0, 120);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: {
      root: normalizeSlashes(root),
      name: pkg.name || path.basename(root),
      vueVersion: null,
      nuxt: false,
      framework: 'next',
      dependencies: Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).sort(),
      packageManager: await exists(path.join(root, 'package-lock.json')) ? 'npm' : 'npm',
      scripts: pkg.scripts || {},
      frameworks: ['next', 'react'],
    },
    stats: {
      filesScanned: sourceFiles.length,
      vueFiles: 0,
      routes: routes.length,
      staticTextTokens: [...visibleText.values()].reduce((n, v) => n + v.count, 0),
      bindingTokens: 0,
      eventTokens: 0,
      classNames: 0,
      colors: [...paletteMap.values()].reduce((n, v) => n + v.count, 0),
    },
    routes,
    unresolvedRoutes: [],
    archetype,
    palette: [...paletteMap.values()].sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex)).slice(0, 32),
    fonts: [...fontMap.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    classNames: [],
    designSignals: {
      frameworks: ['next', 'react'],
      cssVars: [...new Set(colorVars.map((v) => v.name))].slice(0, 240),
      colorVars: paletteVars,
      mediaQueries: [],
      darkMode: true,
    },
    structure: { tagCounts: {}, depthHistogram: {}, maxDepth: 0, topLevelTags: [], skeletonSample: [] },
    contentContract: contract,
    contentContractHash: contractHash,
  };
}

export function contractDiff(baseline, current, { allowAdditions = true } = {}) {
  const issues = [];
  const warnings = [];
  const compareCounts = (label, baseArr, curArr, keyFn) => {
    const base = new Map(baseArr.map((x) => [keyFn(x), x]));
    const cur = new Map(curArr.map((x) => [keyFn(x), x]));
    for (const [key, item] of base) {
      const now = cur.get(key);
      if (!now) issues.push(`${label}: removed "${key}"`);
      else if (now.count < item.count) issues.push(`${label}: "${key}" count ${item.count} -> ${now.count}`);
      else if (now.count > item.count) warnings.push(`${label}: "${key}" count increased ${item.count} -> ${now.count}`);
    }
    for (const [key] of cur) {
      if (!base.has(key)) {
        if (allowAdditions) warnings.push(`${label}: added "${key}"`);
        else issues.push(`${label}: added "${key}"`);
      }
    }
  };
  // React components legitimately move copy between files and render them in
  // multiple places. The source gate therefore locks presence (no copy lost or
  // invented); per-route duplication is enforced by the rendered DOM multiset.
  const proseOnly = (items) => [...new Set(items
    .filter((item) => typeof item.value === 'string' && /\p{L}/u.test(item.value))
    .map((item) => item.value))].sort();
  const attributeOnly = (items) => [...new Set(items
    .filter((item) => typeof item.value === 'string' && /\p{L}/u.test(item.value))
    .map((item) => `${item.name}=${item.value}`))].sort();
  compareCounts('visibleText', proseOnly(baseline.visibleText || []).map((value) => ({ value, count: 1 })), proseOnly(current.visibleText || []).map((value) => ({ value, count: 1 })), (x) => x.value);
  compareCounts('attributes', attributeOnly(baseline.attributes || []).map((value) => ({ value, count: 1 })), attributeOnly(current.attributes || []).map((value) => ({ value, count: 1 })), (x) => x.value);
  for (const r of baseline.routes || []) if (!(current.routes || []).includes(r)) issues.push(`route removed: ${r}`);
  for (const r of current.routes || []) if (!(baseline.routes || []).includes(r)) warnings.push(`route added: ${r}`);
  for (const a of baseline.api || []) if (!(current.api || []).includes(a)) issues.push(`api endpoint removed: ${a}`);
  for (const e of baseline.env || []) if (!(current.env || []).includes(e)) issues.push(`env var removed: ${e}`);
  return { issues, warnings };
}

export async function writeInventory(inventory, outDir, { baseline = false, force = false } = {}) {
  await fs.mkdir(outDir, { recursive: true });
  const inventoryPath = path.join(outDir, 'inventory.json');
  const contractPath = path.join(outDir, 'content-contract.json');
  await fs.writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  await fs.writeFile(contractPath, `${JSON.stringify(inventory.contentContract, null, 2)}\n`, 'utf8');
  if (baseline) {
    const baseDir = path.join(outDir, 'baseline');
    await fs.mkdir(baseDir, { recursive: true });
    const baseInventory = path.join(baseDir, 'inventory.json');
    if (!force && await exists(baseInventory)) {
      console.warn(`Baseline inventory already exists at ${normalizeSlashes(baseInventory)}; keeping it.`);
    } else {
      await fs.writeFile(baseInventory, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
      await fs.writeFile(path.join(baseDir, 'content-contract.json'), `${JSON.stringify(inventory.contentContract, null, 2)}\n`, 'utf8');
    }
  }
  await fs.writeFile(path.join(outDir, 'INVENTORY.md'), renderInventoryMarkdown(inventory), 'utf8');
  return { inventoryPath, contractPath };
}

export function renderInventoryMarkdown(inv) {
  const topColors = (inv.palette || []).slice(0, 10).map((c) => `\`${c.hex}\` (${c.count})`).join(' · ');
  const routes = (inv.routes || []).map((r) => `- \`${r.path}\`${r.dynamic ? ' _(dynamic)_' : ''}`).join('\n');
  const traits = Object.entries(inv.archetype?.traits || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none';
  return `# Reskin inventory — ${inv.project.name}

Generated: ${inv.generatedAt}

## Project

| Field | Value |
|---|---|
| Root | \`${inv.project.root}\` |
| Framework | Next.js (App Router) / React |
| Package manager | ${inv.project.packageManager} |
| CSS frameworks | ${inv.project.frameworks.join(', ') || 'none detected'} |
| Files scanned | ${inv.stats.filesScanned} |

## Original skeleton

- Archetype: **${inv.archetype.id}** (${inv.archetype.family})
- Traits: ${traits}

The replacement skeleton must not be \`${inv.archetype.id}\` and must not be in the same family (\`${inv.archetype.family}\`).

## Routes

${routes || '- \`/\`'}

## Palette (most used first)

${topColors || '_No colors found._'}

## Content lock

- Source visible-text tokens: **${inv.stats.staticTextTokens}**
- Contract hash: \`${inv.contentContractHash}\`

Everything in \`.reskin/baseline/content-contract.json\` is immutable: visible copy, metadata, placeholders, alt/title text, routes, API endpoints and env names. A reskin may move these tokens to new markup but may not rewrite, remove or hide them. Rendered copy is additionally compared word-for-word per route by the browser gate.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inventory = await analyzeProject(args.project);
  const outDir = path.resolve(inventory.project.root, args.out);
  const { inventoryPath } = await writeInventory(inventory, outDir, { baseline: args.baseline, force: args.force });
  console.log(`Reskin inventory: ${inventoryPath}`);
  console.log(`Project: ${inventory.project.name} (Next.js)`);
  console.log(`Routes: ${inventory.routes.map((r) => r.path).join(', ')}`);
  console.log(`Archetype: ${inventory.archetype.id} (${inventory.archetype.family})`);
  console.log(`Content contract: ${inventory.stats.staticTextTokens} text tokens, hash ${inventory.contentContractHash.slice(0, 12)}`);
  console.log(`Palette: ${inventory.palette.slice(0, 8).map((c) => c.hex).join(' ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => { console.error(`reskin inventory failed: ${err.message}`); process.exitCode = 1; });
}
