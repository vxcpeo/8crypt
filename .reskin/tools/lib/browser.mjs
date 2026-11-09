/**
 * Browser capture and usability auditing for reskin.
 *
 * Uses playwright-core when available. If it is missing, provisions it into
 * <project>/.reskin/tools without touching the target project's manifests.
 * Uses an installed Chrome/Chromium/Edge; never downloads a browser.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const PLAYWRIGHT_VERSION = '1.55.0';
const AXE_VERSION = '4.10.3';

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function tryRequire(baseDir, id) {
  try {
    const req = createRequire(path.join(baseDir, 'package.json'));
    return req(id);
  } catch {
    return null;
  }
}

function resolveFrom(baseDir, id) {
  try {
    const req = createRequire(path.join(baseDir, 'package.json'));
    return req.resolve(id);
  } catch {
    return null;
  }
}

async function runInstall(toolsDir) {
  await fs.mkdir(toolsDir, { recursive: true });
  const pkgPath = path.join(toolsDir, 'package.json');
  if (!await exists(pkgPath)) {
    await fs.writeFile(pkgPath, `${JSON.stringify({ name: 'reskin-tools', private: true, version: '1.0.0' }, null, 2)}\n`, 'utf8');
  }
  const logPath = path.join(toolsDir, 'install.log');
  const fd = await fs.open(logPath, 'w');
  const npmCli = await findNpmCli();
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['install', `playwright-core@${PLAYWRIGHT_VERSION}`, `axe-core@${AXE_VERSION}`, '--no-save', '--no-package-lock', '--loglevel=error'];
  const command = npmCli ? process.execPath : npm;
  const commandArgs = npmCli ? [npmCli, ...args] : args;
  if (!npmCli && !npm) {
    await fd.close();
    throw new Error(`playwright-core is not installed and npm was not found. Install it manually: npm i -D playwright-core axe-core`);
  }
  const child = spawn(command, commandArgs, {
    cwd: toolsDir,
    shell: !npmCli && process.platform === 'win32',
    stdio: ['ignore', fd.fd, fd.fd],
    windowsHide: true,
  });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });
  await fd.close();
  if (code !== 0) {
    const tail = await fs.readFile(logPath, 'utf8').catch(() => '');
    throw new Error(`Could not provision playwright-core (exit ${code}). See ${logPath}\n${tail.slice(-1200)}`);
  }
}

async function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (await exists(candidate)) return candidate;
  }
  return null;
}

async function findNpmCli() {
  return firstExisting([
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    '/usr/lib/node_modules/npm/bin/npm-cli.js',
    '/usr/local/lib/node_modules/npm/bin/npm-cli.js',
  ]);
}

async function findChromium() {
  const envCandidates = [process.env.RESKIN_CHROME, process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, process.env.CHROME_PATH];
  const direct = await firstExisting(envCandidates.filter(Boolean));
  if (direct) return direct;

  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const msPlaywright = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(local, 'ms-playwright');
  const browsers = [];
  try {
    const entries = await fs.readdir(msPlaywright, { withFileTypes: true });
    const versioned = entries
      .filter((e) => e.isDirectory() && /^chromium(?:-\d+)?$/.test(e.name))
      .map((e) => ({ name: e.name, n: Number(e.name.split('-')[1] || 0) }))
      .sort((a, b) => b.n - a.n);
    for (const entry of versioned) {
      const base = path.join(msPlaywright, entry.name);
      browsers.push(
        path.join(base, 'chrome-win64', 'chrome.exe'),
        path.join(base, 'chrome-win', 'chrome.exe'),
        path.join(base, 'chrome-linux', 'chrome'),
        path.join(base, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      );
    }
    const shells = entries
      .filter((e) => e.isDirectory() && /^chromium_headless_shell-\d+$/.test(e.name))
      .map((e) => ({ name: e.name, n: Number(e.name.split('-')[2] || 0) }))
      .sort((a, b) => b.n - a.n);
    for (const entry of shells) {
      const base = path.join(msPlaywright, entry.name);
      browsers.push(
        path.join(base, 'chrome-win', 'headless_shell.exe'),
        path.join(base, 'chrome-linux', 'headless_shell'),
      );
    }
  } catch { /* no playwright cache */ }

  browsers.push(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  );
  return firstExisting(browsers);
}

export async function provisionBrowser(projectRoot, outDir) {
  const toolsDir = path.join(outDir, 'tools');
  let playwright = tryRequire(projectRoot, 'playwright-core') || tryRequire(projectRoot, 'playwright');
  let source = 'project';
  if (!playwright) {
    playwright = tryRequire(toolsDir, 'playwright-core') || tryRequire(toolsDir, 'playwright');
    source = 'reskin-tools';
  }
  if (!playwright) {
    await runInstall(toolsDir);
    playwright = tryRequire(toolsDir, 'playwright-core') || tryRequire(toolsDir, 'playwright');
    source = 'reskin-tools';
  }
  if (!playwright) throw new Error('playwright-core could not be loaded after installation.');

  const executablePath = await findChromium();
  if (!executablePath) {
    throw new Error('No Chrome/Chromium/Edge executable found. Set RESKIN_CHROME to a browser executable.');
  }
  const axePath = resolveFrom(toolsDir, 'axe-core/axe.min.js')
    || resolveFrom(projectRoot, 'axe-core/axe.min.js')
    || null;
  return { playwright, source, executablePath, axePath, toolsDir };
}

function inPageAudit() {
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const isVisible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (Number.parseFloat(cs.opacity) < 0.06) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const add = (map, key) => { if (key) map.set(key, (map.get(key) || 0) + 1); };
  const selectorFor = (el) => {
    const parts = [];
    let node = el;
    for (let i = 0; i < 3 && node && node.nodeType === 1; i += 1) {
      let s = node.tagName.toLowerCase();
      if (node.id) { s += `#${node.id}`; parts.unshift(s); break; }
      const cls = [...node.classList].slice(0, 2);
      if (cls.length) s += `.${cls.join('.')}`;
      parts.unshift(s);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
  const parseColor = (str) => {
    if (!str || str === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const m = String(str).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] == null ? 1 : Number(m[4]) };
  };
  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const rgbToHex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
  const luminance = (c) => {
    const channel = (v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  };
  const ratio = (a, b) => {
    const la = luminance(a); const lb = luminance(b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
  };
  const effectiveBackground = (el) => {
    const layers = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.999) break;
      }
      // A photo/URL background has no reliable solid colour to measure against.
      // Gradients are approximated by their solid fallback (or the ancestor
      // colour); the visual review and axe still cover the rest.
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /url\(/i.test(cs.backgroundImage) && (!c || c.a === 0)) return null;
      node = node.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) bg = composite(layers[i], bg);
    return bg;
  };

  const words = new Map();
  const attrs = new Map();
  const links = new Map();
  const forms = new Map();
  const fieldIssues = [];
  const imageIssues = [];
  const interactiveIssues = [];
  const classTokens = new Set();
  const fingerprint = new Set();
  const landmarks = [];
  const colors = new Map();
  const headings = [];
  const navTargets = new Set();
  const textParents = new Map();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/i.test(parent.tagName)) continue;
    const text = norm(node.nodeValue);
    if (!text || !/[\p{L}\p{N}]/u.test(text)) continue;
    if (!isVisible(parent)) continue;
    const prev = textParents.get(parent) || [];
    prev.push(text);
    textParents.set(parent, prev);
    for (let token of text.split(/\s+/)) {
      token = token.replace(/^[^\p{L}\p{N}$€£¥#]+/u, '').replace(/[^\p{L}\p{N}%]+$/u, '');
      if (!token || !/[\p{L}\p{N}]/u.test(token)) continue;
      add(words, token);
    }
  }

  for (const el of document.querySelectorAll('[aria-label],[placeholder],[alt],[title]')) {
    if (!isVisible(el)) continue;
    for (const name of ['aria-label', 'placeholder', 'alt', 'title']) {
      const value = el.getAttribute(name);
      if (value && norm(value)) add(attrs, `${name}=${norm(value)}`);
    }
  }

  for (const a of document.querySelectorAll('a[href]')) {
    if (!isVisible(a)) continue;
    const href = a.getAttribute('href');
    if (!href) continue;
    add(links, href);
    const name = norm(a.getAttribute('aria-label') || a.innerText || a.getAttribute('title'));
    if (!name) interactiveIssues.push({ tag: 'a', issue: 'no accessible name', href });
    const parentNav = a.closest('header,nav,aside,footer,[role="navigation"],[role="contentinfo"]');
    if (parentNav && (href.startsWith('/') || href.startsWith('./') || href.startsWith('#'))) navTargets.add(href.split('?')[0].split('#')[0]);
  }

  for (const el of document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"]')) {
    if (!isVisible(el)) continue;
    const name = norm(el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title'));
    if (!name) interactiveIssues.push({ tag: el.tagName.toLowerCase(), issue: 'no accessible name', text: norm(el.innerText) });
  }

  for (const el of document.querySelectorAll('img')) {
    if (!isVisible(el)) continue;
    if (!el.hasAttribute('alt')) imageIssues.push({ src: el.getAttribute('src') || '', issue: 'missing alt attribute' });
  }

  for (const el of document.querySelectorAll('input,select,textarea')) {
    if (!isVisible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || (tag === 'select' ? 'select' : tag === 'textarea' ? 'textarea' : 'text')).toLowerCase();
    if (type === 'hidden') continue;
    const name = el.getAttribute('name') || '';
    add(forms, `${tag}:${name}:${type}`);
    const id = el.id;
    const hasLabel = Boolean(
      (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
      || el.closest('label')
      || el.getAttribute('aria-label')
      || el.getAttribute('aria-labelledby')
      || el.getAttribute('title'),
    );
    if (!hasLabel) fieldIssues.push({ tag, name, type, issue: 'no programmatic label' });
  }

  let elementCount = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (elementCount > 5000) break;
    if (!isVisible(el)) continue;
    elementCount += 1;
    for (const token of el.classList) if (token) classTokens.add(token);
    let depth = 0;
    let p = el;
    while (p) { depth += 1; p = p.parentElement; }
    const childBucket = el.children.length >= 4 ? '4+' : String(el.children.length);
    fingerprint.add(`${el.tagName.toLowerCase()}@${depth}:${childBucket}`);
    const cs = getComputedStyle(el);
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a > 0.05) add(colors, rgbToHex(bg));
    const fg = parseColor(cs.color);
    if (fg && fg.a > 0.05) add(colors, rgbToHex(fg));
    if (/^(H[1-6])$/.test(el.tagName)) headings.push({ tag: el.tagName.toLowerCase(), text: norm(el.innerText).slice(0, 120) });
    if (/^(HEADER|NAV|MAIN|ASIDE|FOOTER)$/.test(el.tagName) || /^(banner|navigation|main|complementary|contentinfo)$/.test(el.getAttribute('role') || '')) {
      const rect = el.getBoundingClientRect();
      landmarks.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }

  const contrast = [];
  const seenContrast = new Set();
  let contrastChecked = 0;
  for (const [el, texts] of textParents) {
    if (contrast.length >= 400) break;
    if (seenContrast.has(el)) continue;
    seenContrast.add(el);
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (Number.parseFloat(cs.opacity) < 0.5) continue;
    const fg = parseColor(cs.color);
    const bg = effectiveBackground(el);
    if (!fg || !bg) continue;
    contrastChecked += 1;
    const composed = fg.a < 1 ? composite(fg, bg) : fg;
    const r = ratio(composed, bg);
    const fontSize = Number.parseFloat(cs.fontSize) || 16;
    const weight = Number.parseInt(cs.fontWeight, 10) || 400;
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    if (r + 0.01 < required) {
      contrast.push({
        selector: selectorFor(el),
        text: norm(texts.join(' ')).slice(0, 100),
        ratio: Number(r.toFixed(2)),
        required,
        fontSize,
        weight,
        color: cs.color,
        background: rgbToHex(bg),
      });
    }
  }

  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (offenders.length >= 8) break;
    if (!isVisible(el)) continue;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (rect.right > clientWidth + 2 && cs.position !== 'fixed') {
      offenders.push({ selector: selectorFor(el), right: Math.round(rect.right), width: Math.round(rect.width) });
    }
  }

  const focusable = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => isVisible(el) && !el.disabled && el.getAttribute('aria-hidden') !== 'true');

  return {
    meta: {
      title: document.title,
      lang: document.documentElement.lang || '',
      h1Count: headings.filter((h) => h.tag === 'h1').length,
      bodyTextLength: norm(document.body.innerText).length,
      scrollWidth,
      clientWidth,
      focusableCount: focusable.length,
    },
    words: [...words.entries()].map(([word, count]) => ({ word, count })).sort((a, b) => a.word.localeCompare(b.word)),
    attrs: [...attrs.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key)),
    links: [...links.entries()].map(([href, count]) => ({ href, count })).sort((a, b) => a.href.localeCompare(b.href)),
    forms: [...forms.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key)),
    fieldIssues,
    imageIssues,
    interactiveIssues,
    classTokens: [...classTokens].sort(),
    fingerprint: [...fingerprint].sort(),
    landmarks,
    colors: [...colors.entries()].map(([hex, count]) => ({ hex, count })).sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex)).slice(0, 40),
    contrast,
    contrastChecked,
    headings,
    navTargets: [...navTargets].sort(),
    overflow: {
      documentOverflow: scrollWidth > clientWidth + 2,
      offenders,
    },
  };
}

async function auditMobileNav(page, routeCount) {
  const targets = async () => page.$$eval('a[href]', (els) => {
    const visible = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) < 0.06) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    return [...new Set(els.filter(visible).map((a) => a.getAttribute('href')).filter((h) => h && (h.startsWith('/') || h.startsWith('#'))).map((h) => h.split('?')[0].split('#')[0]))];
  });
  let list = await targets();
  let opened = false;
  if (list.length < Math.min(routeCount, 3)) {
    const toggle = page.locator('header button[aria-expanded], nav button[aria-expanded], [class*="menu"] button, button[aria-label*="menu" i], button[aria-label*="navigation" i]').first();
    if (await toggle.count()) {
      try {
        await toggle.click({ timeout: 2000 });
        await page.waitForTimeout(350);
        list = await targets();
        opened = true;
        await page.keyboard.press('Escape').catch(() => {});
      } catch { /* not a menu */ }
    }
  }
  return { opened, targets: list, reachable: list.length >= Math.min(routeCount, 2) };
}

async function auditFocus(page) {
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  const samples = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(40);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const text = String(el.getAttribute('aria-label') || el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      return {
        tag: el.tagName.toLowerCase(),
        text,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
        borderColor: cs.borderColor,
        backgroundColor: cs.backgroundColor,
      };
    });
    if (info) samples.push(info);
  }
  const visibleFocus = samples.filter((s) => (
    (s.outlineStyle !== 'none' && s.outlineWidth !== '0px')
    || (s.boxShadow && s.boxShadow !== 'none')
  ));
  return { samples, visibleCount: visibleFocus.length, passed: samples.length === 0 || visibleFocus.length > 0 };
}

async function runAxe(page, axePath) {
  if (!axePath) return { skipped: true, violations: [] };
  try {
    await page.addScriptTag({ path: axePath });
    const result = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        resultTypes: ['violations'],
      });
    });
    return {
      skipped: false,
      violations: (result.violations || []).map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 4).map((n) => n.target?.join(' ') || ''),
      })),
    };
  } catch (err) {
    return { skipped: true, error: String(err.message || err), violations: [] };
  }
}

function slugRoute(route) {
  if (route === '/') return 'home';
  return route.replace(/^\/+|\/+$/g, '').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'route';
}

export async function capturePages({
  projectRoot,
  outDir,
  baseUrl,
  routes,
  label,
  axePath,
  width = 1440,
  height = 900,
}) {
  const provision = await provisionBrowser(projectRoot, outDir);
  const { chromium } = provision.playwright;
  const shotDir = path.join(outDir, label === 'baseline' ? 'baseline' : 'current');
  await fs.mkdir(shotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: provision.executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const failedResponses = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
  page.on('response', (res) => {
    if (res.status() >= 400) failedResponses.push({ url: res.url(), status: res.status() });
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText || '';
    if (!/ERR_ABORTED/i.test(failure)) failedRequests.push(`${req.method()} ${req.url()} — ${failure}`);
  });

  const result = {
    schemaVersion: 1,
    label,
    generatedAt: new Date().toISOString(),
    baseUrl,
    browser: { executablePath: provision.executablePath, playwrightSource: provision.source, axe: Boolean(provision.axePath) },
    pages: {},
  };

  try {
    for (const routeInfo of routes) {
      const route = typeof routeInfo === 'string' ? routeInfo : routeInfo.path;
      const dynamic = typeof routeInfo === 'object' && routeInfo.dynamic;
      if (dynamic) {
        result.pages[route] = { route, skipped: 'dynamic route — needs a concrete fixture path' };
        continue;
      }
      consoleErrors.length = 0;
      pageErrors.length = 0;
      failedRequests.length = 0;
      failedResponses.length = 0;
      const url = new URL(route, baseUrl).href;
      const entry = { route, url };
      let response;
      try {
        response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (err) {
        entry.loadError = String(err.message || err);
        entry.consoleErrors = [...consoleErrors];
        entry.pageErrors = [...pageErrors];
        result.pages[route] = entry;
        continue;
      }
      entry.status = response?.status() ?? null;
      await page.waitForTimeout(500);
      await page.waitForFunction(() => {
        const app = document.querySelector('#app') || document.body;
        return app && app.children.length > 0;
      }, null, { timeout: 8000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
      await page.evaluate(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await sleep(60);
        }
        window.scrollTo(0, 0);
        await sleep(120);
        if (document.fonts?.ready) await document.fonts.ready;
      }).catch(() => {});

      const desktop = await page.evaluate(inPageAudit);
      const axe = await runAxe(page, axePath);
      entry.desktop = desktop;
      entry.axe = axe;
      const onlyFaviconFailure = failedResponses.length > 0 && failedResponses.every((r) => /favicon/i.test(r.url));
      entry.consoleErrors = consoleErrors.filter((msg) => !(onlyFaviconFailure && /Failed to load resource/i.test(msg)));
      entry.pageErrors = [...pageErrors];
      entry.failedRequests = [...failedRequests];
      entry.failedResponses = failedResponses.slice(0, 10);
      const desktopShot = path.join(shotDir, `${slugRoute(route)}-desktop.png`);
      await page.screenshot({ path: desktopShot, fullPage: true }).catch(() => {});
      entry.screenshots = { desktop: path.relative(outDir, desktopShot).replace(/\\/g, '/') };

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(350);
      const mobile = await page.evaluate(inPageAudit);
      const mobileNav = await auditMobileNav(page, routes.filter((r) => !(typeof r === 'object' && r.dynamic)).length);
      const mobileShot = path.join(shotDir, `${slugRoute(route)}-mobile.png`);
      await page.screenshot({ path: mobileShot, fullPage: true }).catch(() => {});
      entry.mobile = mobile;
      entry.mobileNav = mobileNav;
      entry.screenshots.mobile = path.relative(outDir, mobileShot).replace(/\\/g, '/');

      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);
      if (route === (routes[0]?.path || '/')) {
        entry.focus = await auditFocus(page);
      }

      result.pages[route] = entry;
      const failures = [
        ...entry.consoleErrors,
        ...entry.pageErrors,
      ].filter((msg) => !/favicon|Vue Devtools|Download the Vue Devtools/i.test(msg));
      console.log(`  ${route}: ${entry.status ?? 'ERR'} | words ${entry.desktop?.words?.length ?? 0} | axe ${axe.violations.length} | contrast ${entry.desktop?.contrast?.length ?? 0}/${entry.desktop?.contrastChecked ?? 0} | console ${failures.length}`);
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return result;
}
