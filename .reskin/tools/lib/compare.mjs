/** Comparison helpers for reskin verification. */

export function jaccard(a = [], b = []) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size && !setB.size) return 1;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
}

export function classOverlap(a = [], b = []) {
  return jaccard(a, b);
}

export function lcsSimilarity(a = [], b = []) {
  if (!a.length && !b.length) return 1;
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m] / Math.max(n, m);
}

export function multisetDiff(base = [], cur = [], keyName = 'key') {
  const baseMap = new Map(base.map((x) => [x[keyName], x.count]));
  const curMap = new Map(cur.map((x) => [x[keyName], x.count]));
  const missing = [];
  const extra = [];
  for (const [key, count] of baseMap) {
    const now = curMap.get(key) || 0;
    if (now < count) missing.push({ key, expected: count, actual: now });
  }
  for (const [key, count] of curMap) {
    const was = baseMap.get(key) || 0;
    if (count > was) extra.push({ key, expected: was, actual: count });
  }
  return { missing, extra };
}

export function splitWords(words = []) {
  const stable = [];
  const numeric = [];
  for (const item of words) {
    if (/[\p{L}]/u.test(item.word)) stable.push(item);
    else numeric.push(item);
  }
  return { stable, numeric };
}

export function numericSummary(words = []) {
  const numeric = words.filter((w) => !/[\p{L}]/u.test(w.word));
  return {
    tokens: numeric.length,
    total: numeric.reduce((n, w) => n + w.count, 0),
  };
}

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length < 6) return [0, 0, 0];
  return [Number.parseInt(full.slice(0, 2), 16), Number.parseInt(full.slice(2, 4), 16), Number.parseInt(full.slice(4, 6), 16)];
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

export function srgbToLinear(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x); const fy = f(y); const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE(hexA, hexB) {
  const a = rgbToLab(hexToRgb(hexA));
  const b = rgbToLab(hexToRgb(hexB));
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function saturation(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

export function lightness(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

export function chromaticColors(palette = [], limit = 6) {
  return palette
    .filter((c) => saturation(c.hex) >= 0.35 && lightness(c.hex) > 0.15 && lightness(c.hex) < 0.86)
    .sort((a, b) => (b.count * (0.2 + saturation(b.hex) ** 2)) - (a.count * (0.2 + saturation(a.hex) ** 2)))
    .slice(0, limit);
}

export function anchorAccent(palette = [], inventory = null) {
  const accentVar = (inventory?.designSignals?.colorVars || [])
    .find((v) => /(?:^|[-_])(accent|primary|brand|highlight)(?:[-_]|$)/i.test(v.name))?.value;
  if (accentVar && saturation(accentVar) >= 0.3 && lightness(accentVar) < 0.9) return accentVar;
  return chromaticColors(palette, 1)[0]?.hex || '#4f46e5';
}
