#!/usr/bin/env node
/**
 * Small helper for reading reskin capture files without dumping megabytes.
 *
 *   node .reskin/tools/summary.mjs .reskin/baseline/pages.json
 *   node .reskin/tools/summary.mjs .reskin/baseline/pages.json .reskin/current/pages.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const [a, b] = process.argv.slice(2);
if (!a) {
  console.error('usage: summary.mjs <pages.json> [pages.json]');
  process.exit(1);
}

const load = async (p) => JSON.parse(await fs.readFile(path.resolve(p), 'utf8'));

const base = await load(a);
const cur = b ? await load(b) : null;

for (const [route, page] of Object.entries(base.pages || {})) {
  console.log(`\n=== ${route} ===`);
  if (page.skipped) {
    console.log(`skipped: ${page.skipped}`);
    continue;
  }
  for (const [viewport, key] of [['desktop', 'desktop'], ['mobile', 'mobile']]) {
    const v = page[key];
    if (!v) continue;
    console.log(`${viewport}: words=${v.meta.bodyTextLength} tokens=${v.words.length} classes=${v.classTokens.length} fp=${v.fingerprint.length} h1=${v.meta.h1Count}`);
    console.log(`  landmarks: ${v.landmarks.map((l) => `${l.tag}:${l.role || '-'}`).join(' > ')}`);
    console.log(`  headings: ${v.headings.map((h) => h.tag).join(',')}`);
    console.log(`  contrast: ${v.contrast.length}/${v.contrastChecked}`);
    if (v.contrast.length) console.log(`    ${JSON.stringify(v.contrast.slice(0, 3))}`);
  }
  if (cur) {
    const c = cur.pages?.[route];
    console.log(`  current: ${c ? `${c.status} fp=${c.desktop?.fingerprint?.length} lm=${c.desktop?.landmarks?.length}` : 'missing'}`);
  }
}
