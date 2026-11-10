#!/usr/bin/env node
/**
 * reskin verification.
 *
 *   node scripts/verify.mjs baseline --project .   # before editing
 *   node scripts/verify.mjs check    --project .   # after editing
 *
 * Baseline: builds, renders every static route, freezes text/attributes/structure/
 * screenshots into .reskin/baseline/.
 * Check: proves content parity, skeleton replacement, palette distance, route
 * health, responsiveness, contrast, keyboard access, labels, images and axe WCAG.
 *
 * Exit code 1 means at least one gate failed. The agent must fix and rerun.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { analyzeProject, contractDiff } from './inventory-next.mjs';
import { capturePages } from './lib/browser.mjs';
import {
  anchorAccent, chromaticColors, classOverlap, deltaE, jaccard, lcsSimilarity,
  multisetDiff, numericSummary, splitWords,
} from './lib/compare.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(HERE, '..');
const DEFAULT_PORT = 4317;

const THRESHOLDS = {
  maxStructureSimilarity: 0.50,
  maxLandmarkSimilarity: 0.68,
  maxClassOverlap: 0.10,
  minAccentDistance: 30,
  maxContrastFailures: 0,
  maxAxeSerious: 0,
};

const normalizeSlashes = (p) => p.replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const args = {
    mode: argv[0] && !argv[0].startsWith('--') ? argv[0] : 'check',
    project: process.cwd(),
    out: '.reskin',
    port: DEFAULT_PORT,
    url: null,
    build: true,
    force: false,
  };
  const start = args.mode === argv[0] ? 1 : 0;
  for (let i = start; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--project' || a === '-p') args.project = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a === '--url') args.url = argv[++i];
    else if (a === '--no-build') args.build = false;
    else if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function detectNpm() {
  if (process.platform !== 'win32') return 'npm';
  const candidates = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'npm.cmd'),
    'npm.cmd',
  ];
  for (const candidate of candidates) {
    if (candidate === 'npm.cmd') return candidate;
    if (await exists(candidate)) return candidate;
  }
  return 'npm.cmd';
}

async function findNpmCli() {
  const candidates = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    '/usr/lib/node_modules/npm/bin/npm-cli.js',
    '/usr/local/lib/node_modules/npm/bin/npm-cli.js',
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

async function runPackageScript(projectRoot, script, extraArgs, logPath, timeoutMs = 240000) {
  const npmCli = await findNpmCli();
  if (npmCli) {
    return runProcess(process.execPath, [npmCli, 'run', script, ...(extraArgs.length ? ['--', ...extraArgs] : [])], {
      cwd: projectRoot,
      logPath,
      timeoutMs,
    });
  }
  return runProcess(await detectNpm(), ['run', script, ...(extraArgs.length ? ['--', ...extraArgs] : [])], {
    cwd: projectRoot,
    logPath,
    shell: process.platform === 'win32',
    timeoutMs,
  });
}

async function runProcess(cmd, args, { cwd, logPath, shell = false, timeoutMs = 240000 } = {}) {
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  const fd = await fs.open(logPath, 'w');
  const child = spawn(cmd, args, {
    cwd,
    shell,
    stdio: ['ignore', fd.fd, fd.fd],
    windowsHide: true,
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  });
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs);
  });
  const code = await Promise.race([
    new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (exitCode) => resolve(exitCode));
    }),
    timeout,
  ]).finally(() => clearTimeout(timer));
  await fd.close();
  if (code === 'timeout') {
    try { child.kill(); } catch { /* ignore */ }
    throw new Error(`${cmd} timed out after ${timeoutMs} ms. See ${logPath}`);
  }
  return { code, logPath };
}

async function tail(logPath, chars = 1800) {
  try {
    const text = await fs.readFile(logPath, 'utf8');
    return text.slice(-chars);
  } catch {
    return '';
  }
}

async function findFreePort(start) {
  for (let port = start; port < start + 40; port += 1) {
    const free = await new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => server.close(() => resolve(true)));
      server.listen(port, '127.0.0.1');
    });
    if (free) return port;
  }
  throw new Error(`No free port found near ${start}.`);
}

async function waitForServer(baseUrl, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return true;
    } catch { /* not ready */ }
    await sleep(700);
  }
  return false;
}

async function readPackage(projectRoot) {
  return readJson(path.join(projectRoot, 'package.json'));
}

async function buildProject(projectRoot, outDir) {
  const pkg = await readPackage(projectRoot);
  const vite = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const logPath = path.join(outDir, 'logs', 'build.log');
  if (await exists(vite)) {
    console.log('Building with local Vite...');
    const result = await runProcess(process.execPath, [vite, 'build', '--logLevel', 'warn'], { cwd: projectRoot, logPath });
    if (result.code !== 0) throw new Error(`Build failed (exit ${result.code}).\n${await tail(logPath)}`);
    console.log(`Build passed — ${normalizeSlashes(logPath)}`);
    return;
  }
  if (!pkg.scripts?.build) {
    console.log('No build script found; skipping production build.');
    return;
  }
  console.log('Building with package script...');
  const result = await runPackageScript(projectRoot, 'build', [], logPath);
  if (result.code !== 0) throw new Error(`Build failed (exit ${result.code}).\n${await tail(logPath)}`);
  console.log(`Build passed — ${normalizeSlashes(logPath)}`);
}

async function prepareServer({ projectRoot, outDir, port, externalUrl, build }) {
  if (externalUrl) {
    return { baseUrl: externalUrl.replace(/\/$/, '') + '/', close: async () => {}, external: true };
  }
  if (build) await buildProject(projectRoot, outDir);
  const pkg = await readPackage(projectRoot);
  const vite = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const chosenPort = await findFreePort(port);
  const logPath = path.join(outDir, 'logs', 'server.log');
  let child;
  if (await exists(nextBin)) {
    // Next.js: `next start` serves the production build on an explicit port.
    const fd = await fs.open(logPath, 'w');
    child = spawn(process.execPath, [nextBin, 'start', '-p', String(chosenPort), '-H', '127.0.0.1'], {
      cwd: projectRoot,
      stdio: ['ignore', fd.fd, fd.fd],
      windowsHide: true,
      env: { ...process.env, NODE_ENV: 'production' },
    });
  } else if (await exists(vite)) {
    child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(chosenPort), '--strictPort'], {
      cwd: projectRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
      windowsHide: true,
    });
  } else if (pkg.scripts?.preview || pkg.scripts?.dev) {
    const script = pkg.scripts?.preview ? 'preview' : 'dev';
    const fd = await fs.open(logPath, 'w');
    const npmCli = await findNpmCli();
    const args = ['run', script, '--', '--host', '127.0.0.1', '--port', String(chosenPort)];
    child = npmCli
      ? spawn(process.execPath, [npmCli, ...args], {
        cwd: projectRoot,
        stdio: ['ignore', fd.fd, fd.fd],
        windowsHide: true,
      })
      : spawn(await detectNpm(), args, {
        cwd: projectRoot,
        shell: process.platform === 'win32',
        stdio: ['ignore', fd.fd, fd.fd],
        windowsHide: true,
      });
    // fd is owned by the child for its lifetime.
  } else {
    throw new Error('No local Vite and no preview/dev script. Pass --url <running-app-url>.');
  }
  const baseUrl = `http://127.0.0.1:${chosenPort}/`;
  if (!await waitForServer(baseUrl)) {
    await killTree(child.pid);
    throw new Error(`Server did not become ready at ${baseUrl}. See ${logPath}${await tail(logPath) ? `\n${await tail(logPath)}` : ''}`);
  }
  console.log(`Preview server: ${baseUrl}`);
  return {
    baseUrl,
    external: false,
    close: async () => {
      await killTree(child.pid);
      await sleep(300);
    },
  };
}

async function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const child = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      child.on('exit', resolve);
      child.on('error', resolve);
    });
  } else {
    try { process.kill(-pid, 'SIGTERM'); } catch { try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ } }
  }
}

function axeGate(entry) {
  const violations = entry.axe?.violations || [];
  const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast');
  const moderate = violations.filter((v) => !['serious', 'critical'].includes(v.impact) || v.id === 'color-contrast');
  return { serious, moderate };
}

function pageUsability(entry, baselineEntry, thresholds) {
  const failures = [];
  const warnings = [];
  if (!entry) return { passed: false, failures: ['page missing from current capture'], warnings };
  if (entry.loadError) failures.push(`load error: ${entry.loadError}`);
  if (entry.status != null && entry.status >= 400) failures.push(`HTTP ${entry.status}`);
  const consoleErrors = (entry.consoleErrors || []).concat(entry.pageErrors || [])
    .filter((msg) => !/favicon|Vue Devtools|Download the Vue Devtools/i.test(msg));
  for (const msg of consoleErrors.slice(0, 5)) failures.push(`console/page error: ${msg.slice(0, 220)}`);
  for (const req of (entry.failedRequests || []).slice(0, 3)) {
    if (!/favicon/i.test(req)) warnings.push(`request failed: ${req}`);
  }

  const desktop = entry.desktop;
  const mobile = entry.mobile;
  for (const [viewport, data] of [['desktop', desktop], ['mobile', mobile]]) {
    if (!data) { failures.push(`${viewport} capture missing`); continue; }
    if (data.overflow?.documentOverflow) failures.push(`${viewport}: horizontal overflow ${data.meta.scrollWidth}px > ${data.meta.clientWidth}px`);
    if ((data.contrast || []).length > thresholds.maxContrastFailures) {
      failures.push(`${viewport}: ${data.contrast.length} contrast failure(s), worst ${data.contrast[0]?.ratio}:1 (${data.contrast[0]?.text?.slice(0, 60)})`);
    }
    if ((data.imageIssues || []).length) failures.push(`${viewport}: ${data.imageIssues.length} image(s) without alt`);
    if ((data.fieldIssues || []).length) failures.push(`${viewport}: ${data.fieldIssues.length} form field(s) without label`);
    if ((data.interactiveIssues || []).length) failures.push(`${viewport}: ${data.interactiveIssues.length} control(s) without accessible name`);
    if (!data.meta?.title) warnings.push(`${viewport}: empty document title`);
    if (!data.meta?.h1Count) warnings.push(`${viewport}: no h1`);
    if ((data.headings || []).length && data.meta?.h1Count > 1) warnings.push(`${viewport}: ${data.meta.h1Count} h1 elements`);
  }

  const axe = axeGate(entry);
  if (axe.serious.length > thresholds.maxAxeSerious) {
    failures.push(`axe serious/critical: ${axe.serious.map((v) => `${v.id}(${v.nodes})`).join(', ')}`);
  }
  if (axe.moderate.length) warnings.push(`axe moderate: ${axe.moderate.map((v) => v.id).join(', ')}`);

  if (entry.mobileNav) {
    if (!entry.mobileNav.reachable) failures.push('mobile: route navigation is not reachable (no visible links or menu toggle)');
    const baselineTargets = baselineEntry?.mobileNav?.targets || [];
    const currentTargets = new Set(entry.mobileNav.targets || []);
    const lost = baselineTargets.filter((t) => !currentTargets.has(t));
    if (lost.length) warnings.push(`mobile nav: ${lost.length} baseline target(s) no longer visible (${lost.slice(0, 3).join(', ')})`);
  }
  if (entry.focus && !entry.focus.passed) failures.push('keyboard: no visible focus indicator during tab traversal');
  return { passed: failures.length === 0, failures, warnings, axe: { serious: axe.serious, moderate: axe.moderate } };
}

function comparePage({ route, base, cur, thresholds }) {
  const failures = [];
  const warnings = [];
  const content = { missing: [], extra: [], numeric: {} };
  const structure = {};
  if (!base) return { route, passed: false, failures: ['baseline page missing'], warnings, content, structure };
  if (!cur) return { route, passed: false, failures: ['current page missing'], warnings, content, structure };
  if (base.skipped || cur.skipped) return { route, passed: true, skipped: true, failures, warnings, content, structure };

  const baseDesktop = base.desktop || {};
  const curDesktop = cur.desktop || {};
  const baseWords = splitWords(baseDesktop.words || []);
  const curWords = splitWords(curDesktop.words || []);
  const wordDiff = multisetDiff(baseWords.stable, curWords.stable, 'word');
  content.missing = wordDiff.missing.slice(0, 20);
  content.extra = wordDiff.extra.slice(0, 20);
  for (const item of content.missing) failures.push(`content removed/changed: "${item.key}" (${item.expected} -> ${item.actual})`);
  for (const item of content.extra) failures.push(`visible content added/changed: "${item.key}" (${item.expected} -> ${item.actual})`);
  const baseNums = numericSummary(baseDesktop.words || []);
  const curNums = numericSummary(curDesktop.words || []);
  content.numeric = { baseline: baseNums, current: curNums };
  if (baseNums.total !== curNums.total) warnings.push(`numeric token count changed: ${baseNums.total} -> ${curNums.total} (dynamic values may differ)`);

  const attrDiff = multisetDiff(baseDesktop.attrs || [], curDesktop.attrs || [], 'key');
  for (const item of attrDiff.missing) {
    if (item.key.startsWith('aria-')) warnings.push(`aria attribute changed/removed: ${item.key}`);
    else failures.push(`attribute content removed/changed: ${item.key}`);
  }
  for (const item of attrDiff.extra) {
    const name = item.key.split('=')[0];
    if (name.startsWith('aria-')) warnings.push(`aria attribute added: ${item.key}`);
    else failures.push(`attribute content added: ${item.key}`);
  }

  const linkDiff = multisetDiff(baseDesktop.links || [], curDesktop.links || [], 'href');
  for (const item of linkDiff.missing) warnings.push(`link target no longer rendered: ${item.key}`);
  for (const item of linkDiff.extra) warnings.push(`link target added: ${item.key}`);

  const formDiff = multisetDiff(baseDesktop.forms || [], curDesktop.forms || [], 'key');
  for (const item of formDiff.missing) failures.push(`form field removed/changed: ${item.key}`);
  for (const item of formDiff.extra) failures.push(`form field added: ${item.key}`);

  if (baseDesktop.meta?.title && curDesktop.meta?.title !== baseDesktop.meta.title) {
    failures.push(`document title changed: "${baseDesktop.meta.title}" -> "${curDesktop.meta?.title}"`);
  }

  const fingerprintSim = jaccard(baseDesktop.fingerprint || [], curDesktop.fingerprint || []);
  const landmarkSim = lcsSimilarity(
    (baseDesktop.landmarks || []).map((l) => `${l.tag}:${l.role}`),
    (curDesktop.landmarks || []).map((l) => `${l.tag}:${l.role}`),
  );
  const classes = classOverlap(baseDesktop.classTokens || [], curDesktop.classTokens || []);
  structure.fingerprintSimilarity = Number(fingerprintSim.toFixed(3));
  structure.landmarkSimilarity = Number(landmarkSim.toFixed(3));
  structure.classOverlap = Number(classes.toFixed(3));
  if (fingerprintSim > thresholds.maxStructureSimilarity) failures.push(`skeleton too similar: DOM fingerprint ${structure.fingerprintSimilarity} > ${thresholds.maxStructureSimilarity}`);
  if (landmarkSim > thresholds.maxLandmarkSimilarity) failures.push(`landmark layout too similar: ${structure.landmarkSimilarity} > ${thresholds.maxLandmarkSimilarity}`);
  if (classes > thresholds.maxClassOverlap) failures.push(`CSS class reuse too high: ${structure.classOverlap} > ${thresholds.maxClassOverlap}`);

  const usabilityDesktop = pageUsability(cur, base, thresholds);
  if (!usabilityDesktop.passed) failures.push(...usabilityDesktop.failures);
  warnings.push(...usabilityDesktop.warnings);

  return {
    route,
    passed: failures.length === 0,
    failures,
    warnings,
    content,
    structure,
    usability: usabilityDesktop,
  };
}

async function runBaseline({ projectRoot, outDir, args }) {
  const inventory = await readJson(path.join(outDir, 'inventory.json'));
  const baseDir = path.join(outDir, 'baseline');
  await fs.mkdir(baseDir, { recursive: true });
  const pagesPath = path.join(baseDir, 'pages.json');
  if (await exists(pagesPath) && !args.force) {
    throw new Error(`Baseline already exists at ${normalizeSlashes(pagesPath)}. Refusing to overwrite it. Delete .reskin/baseline and run again, or pass --force.`);
  }
  // Freeze the original inventory only once. Re-running baseline must not
  // silently replace the evidence of the pre-reskin site.
  if (!await exists(path.join(baseDir, 'inventory.json'))) {
    await fs.writeFile(path.join(baseDir, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }
  if (!await exists(path.join(baseDir, 'content-contract.json'))) {
    await fs.writeFile(path.join(baseDir, 'content-contract.json'), `${JSON.stringify(inventory.contentContract, null, 2)}\n`, 'utf8');
  }

  const server = await prepareServer({ projectRoot, outDir, port: args.port, externalUrl: args.url, build: args.build });
  try {
    console.log(`Capturing baseline for ${inventory.routes.length} route(s)...`);
    const pages = await capturePages({
      projectRoot,
      outDir,
      baseUrl: server.baseUrl,
      routes: inventory.routes,
      label: 'baseline',
    });
    pages.inventoryHash = inventory.contentContractHash;
    await fs.writeFile(path.join(baseDir, 'pages.json'), `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
    console.log(`Baseline saved: ${normalizeSlashes(path.join(baseDir, 'pages.json'))}`);
    console.log('Now rewrite the UI. Then run: node scripts/verify.mjs check');
  } finally {
    await server.close();
  }
}

async function runCheck({ projectRoot, outDir, args }) {
  const baselineDir = path.join(outDir, 'baseline');
  const baselinePages = await readJson(path.join(baselineDir, 'pages.json')).catch(() => null);
  const baselineInventory = await readJson(path.join(baselineDir, 'inventory.json')).catch(() => null)
    || await readJson(path.join(outDir, 'inventory.json')).catch(() => null);
  if (!baselinePages || !baselineInventory) {
    throw new Error('Missing baseline evidence. Run "node scripts/verify.mjs baseline" before editing.');
  }

  console.log('Auditing current source contract...');
  const currentInventory = await analyzeProject(projectRoot);
  const rawSourceDiff = contractDiff(baselineInventory.contentContract, currentInventory.contentContract, { allowAdditions: true });
  const sourceWarnings = [...rawSourceDiff.warnings];
  const sourceIssues = [...rawSourceDiff.issues];
  // Visible copy, form fields and locale values are content. Adding them is a
  // content change even if the new copy happens to live on an uncaptured route.
  for (let i = sourceWarnings.length - 1; i >= 0; i -= 1) {
    if (/^(visibleText|i18n|forms): (?:added|".*" count increased)/.test(sourceWarnings[i])) {
      sourceIssues.push(sourceWarnings.splice(i, 1)[0]);
    }
  }
  const sourcePassed = sourceIssues.length === 0;
  if (!sourcePassed) {
    for (const issue of sourceIssues.slice(0, 20)) console.log(`  CONTENT FAIL: ${issue}`);
  } else {
    console.log(`  contract intact (${sourceWarnings.length} additive warning(s))`);
  }

  const server = await prepareServer({ projectRoot, outDir, port: args.port, externalUrl: args.url, build: args.build });
  let pages;
  try {
    console.log('Capturing reskinned pages...');
    pages = await capturePages({
      projectRoot,
      outDir,
      baseUrl: server.baseUrl,
      routes: currentInventory.routes,
      label: 'current',
    });
    await fs.writeFile(path.join(outDir, 'current', 'pages.json'), `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
  } finally {
    await server.close();
  }

  const baseMap = new Map(Object.entries(baselinePages.pages || {}));
  const curMap = new Map(Object.entries(pages.pages || {}));
  const routes = [...new Set([...baseMap.keys(), ...curMap.keys()])];
  const routeResults = routes.map((route) => comparePage({
    route,
    base: baseMap.get(route),
    cur: curMap.get(route),
    thresholds: THRESHOLDS,
  }));

  const archetypeChanged = baselineInventory.archetype?.id !== currentInventory.archetype?.id
    && baselineInventory.archetype?.family !== currentInventory.archetype?.family;
  const baseAccent = anchorAccent(baselineInventory.palette || [], baselineInventory);
  const curAccent = anchorAccent(currentInventory.palette || [], currentInventory);
  const accentDistance = deltaE(baseAccent, curAccent);
  const palettePassed = accentDistance >= THRESHOLDS.minAccentDistance;
  const structureGate = archetypeChanged && palettePassed;

  const allFailures = [
    ...sourceIssues.map((x) => `source: ${x}`),
    ...(archetypeChanged ? [] : [`source: archetype still ${currentInventory.archetype?.id} (${currentInventory.archetype?.family}); expected a different skeleton family`]),
    ...(palettePassed ? [] : [`source: accent ${curAccent} is only ${accentDistance.toFixed(1)} ΔE from original ${baseAccent} (min ${THRESHOLDS.minAccentDistance})`]),
    ...(currentInventory.routes.some((r) => !baselineInventory.routes?.some((b) => b.path === r.path)) ? ['source: routes were added'] : []),
    ...routeResults.flatMap((r) => r.failures.map((f) => `${r.route}: ${f}`)),
  ];
  const allWarnings = [
    ...sourceWarnings.slice(0, 30),
    ...routeResults.flatMap((r) => (r.warnings || []).map((w) => `${r.route}: ${w}`)),
  ];
  const passed = allFailures.length === 0 && structureGate;

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: {
      root: normalizeSlashes(projectRoot),
      name: currentInventory.project.name,
      baseUrl: server.baseUrl,
    },
    passed,
    thresholds: THRESHOLDS,
    gates: {
      sourceContract: { passed: sourcePassed, issues: sourceIssues, warnings: sourceWarnings, hash: currentInventory.contentContractHash },
      skeleton: {
        passed: structureGate,
        original: baselineInventory.archetype,
        current: currentInventory.archetype,
        accent: { original: baseAccent, current: curAccent, deltaE: Number(accentDistance.toFixed(2)), min: THRESHOLDS.minAccentDistance },
      },
      pages: routeResults.map((r) => ({
        route: r.route,
        passed: r.passed,
        skipped: Boolean(r.skipped),
        failures: r.failures,
        warnings: r.warnings,
        structure: r.structure,
        content: r.content,
        usability: r.usability,
        screenshots: curMap.get(r.route)?.screenshots || {},
      })),
    },
    failures: allFailures,
    warnings: allWarnings,
    baseline: {
      generatedAt: baselinePages.generatedAt,
      routes: [...baseMap.keys()],
    },
  };

  await fs.writeFile(path.join(outDir, 'verification.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(outDir, 'VERIFICATION.md'), renderVerificationMarkdown(report), 'utf8');

  console.log('');
  if (passed) {
    console.log(`PASS — ${routes.length} route(s), content intact, skeleton replaced, usability clean.`);
  } else {
    console.log(`FAIL — ${allFailures.length} blocking issue(s):`);
    for (const issue of allFailures.slice(0, 25)) console.log(`  - ${issue}`);
    if (allFailures.length > 25) console.log(`  ... ${allFailures.length - 25} more in verification.json`);
  }
  console.log(`Report: ${normalizeSlashes(path.join(outDir, 'VERIFICATION.md'))}`);
  if (allWarnings.length) console.log(`Warnings: ${allWarnings.length} (non-blocking, review the report)`);
  if (!passed) process.exitCode = 1;
}

function renderVerificationMarkdown(report) {
  const rows = report.gates.pages.map((p) => {
    const s = p.structure || {};
    return `| \`${p.route}\` | ${p.passed ? 'PASS' : 'FAIL'} | ${s.fingerprintSimilarity ?? '—'} | ${s.landmarkSimilarity ?? '—'} | ${p.usability?.axe?.serious?.length ?? '—'} | ${p.screenshots?.desktop ? `[desktop](${p.screenshots.desktop})` : '—'} |`;
  }).join('\n');
  const failures = report.failures.length
    ? report.failures.map((f) => `- ${f}`).join('\n')
    : '- None.';
  const warnings = report.warnings.length
    ? report.warnings.slice(0, 40).map((w) => `- ${w}`).join('\n')
    : '- None.';
  return `# Reskin verification — ${report.passed ? 'PASS' : 'FAIL'}

Generated: ${report.generatedAt}

- Project: **${report.project.name}**
- URL: ${report.project.baseUrl}
- Original skeleton: \`${report.gates.skeleton.original?.id}\` (${report.gates.skeleton.original?.family})
- New skeleton: \`${report.gates.skeleton.current?.id}\` (${report.gates.skeleton.current?.family})
- Accent: ${report.gates.skeleton.accent.original} -> ${report.gates.skeleton.accent.current} (${report.gates.skeleton.accent.deltaE} ΔE; min ${report.gates.skeleton.accent.min})
- Source contract: ${report.gates.sourceContract.passed ? 'intact' : 'changed'} (\`${report.gates.sourceContract.hash.slice(0, 12)}\`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
${rows}

## Blocking issues

${failures}

## Warnings

${warnings}

## Thresholds

- DOM fingerprint similarity <= ${report.thresholds.maxStructureSimilarity}
- Landmark sequence similarity <= ${report.thresholds.maxLandmarkSimilarity}
- CSS class overlap <= ${report.thresholds.maxClassOverlap}
- Accent distance >= ${report.thresholds.minAccentDistance} ΔE
- Contrast failures <= ${report.thresholds.maxContrastFailures}
- Axe serious/critical <= ${report.thresholds.maxAxeSerious}

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage:');
    console.log('  node scripts/verify.mjs baseline [--project DIR] [--out .reskin] [--url URL] [--no-build] [--port N] [--force]');
    console.log('  node scripts/verify.mjs check    [--project DIR] [--out .reskin] [--url URL] [--no-build] [--port N]');
    return;
  }
  if (!['baseline', 'check'].includes(args.mode)) {
    throw new Error(`Unknown mode "${args.mode}". Use baseline or check.`);
  }
  const projectRoot = path.resolve(args.project);
  const outDir = path.resolve(projectRoot, args.out);
  if (args.mode === 'baseline') await runBaseline({ projectRoot, outDir, args });
  else await runCheck({ projectRoot, outDir, args });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => {
    console.error(`reskin verification failed: ${err.message}`);
    process.exitCode = 1;
  });
}
