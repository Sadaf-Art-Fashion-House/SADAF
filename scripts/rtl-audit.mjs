#!/usr/bin/env node
/**
 * SADAF | RTL Audit — automatic scan for Right-To-Left layout risks.
 *
 * Scans every .ts/.tsx file under src/ and counts:
 *   - Physical positioning utilities   (left-x / right-x / inset-x)
 *   - Physical margin/padding          (ml-x / mr-x / pl-x / pr-x)
 *   - Non-flipping space-x/divide-x
 *   - Physical text alignment          (text-left / text-right)
 *   - Physical borders/corners         (border-l/r, rounded-l/r, rounded-tl/tr/bl/br)
 *   - Truncation utilities             (truncate, line-clamp-N)
 *   - Physical transforms              (translate-x-N)
 *   - Directional icons                (ArrowLeft/Right, ChevronLeft/Right, …)
 *   - Logical utilities                (ms-x / me-x / ps-x / pe-x / text-start/end) — GOOD
 *
 * Run: node .freebuff/rtl-audit.mjs [--json] [--top N]
 * Writes a full report to docs/rtl-audit-report.md unless --no-report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const isRepoScripts = path.basename(scriptDir) === 'scripts';
const ROOT = path.resolve(scriptDir, '..');
// From scripts/ (repo checkout) the repo IS the root; from .freebuff/ the
// project lives one level deeper under sadaf-frontend/.
const SRC = isRepoScripts ? path.join(ROOT, 'src') : path.join(ROOT, 'sadaf-frontend', 'src');
const REPORT = isRepoScripts ? path.join(ROOT, '..', 'docs', 'rtl-audit-report.md') : path.join(ROOT, 'docs', 'rtl-audit-report.md');

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const writeReport = !args.has('--no-report');
const topN = Number(args.has('--top') ? process.argv[process.argv.indexOf('--top') + 1] : 15) || 15;
// CI guard: `--max N` fails (exit 1) when the risky total exceeds N.
const maxIdx = process.argv.indexOf('--max');
const maxRisks = maxIdx > -1 ? Number(process.argv[maxIdx + 1]) : null;

/** Physical, RTL-risky class patterns → category. */
const PATTERNS = [
    { key: 'positioning', label: 'Positioning left-x/right-x', re: /\b-?(?:left|right)-[a-zA-Z0-9._/[\]-]+/g },
    { key: 'marginPadding', label: 'Physical margin/padding ml-x/mr-x/pl-x/pr-x', re: /\b(?:ml|mr|pl|pr)-[a-zA-Z0-9._/[\]-]+/g },
    { key: 'spaceDivide', label: 'space-x-x/divide-x-x (no RTL flip)', re: /\bspace-x-(?!reverse)|\bdivide-x-(?!reverse)/g },
    { key: 'textAlign', label: 'Physical text-align text-left/right', re: /\btext-(?:left|right)\b/g },
    { key: 'borders', label: 'Physical borders/corners border-l/r · rounded-l/r', re: /\b(?:border-[lr]|rounded-[lr]|rounded-[tb][lr])-[a-zA-Z0-9._/[\]-]+|\bborder-[lr]\b/g },
    { key: 'truncate', label: 'truncate (Arabic word-cut risk)', re: /\btruncate\b/g },
    { key: 'lineClamp', label: 'line-clamp-N (Arabic word-cut risk)', re: /\bline-clamp-\d+\b/g },
    { key: 'translateX', label: 'translate-x-N (physical transform)', re: /\b-?translate-x-[a-zA-Z0-9._/[\]-]+/g },
    { key: 'logical', label: 'Logical utilities ms-x/me-x/ps-x/pe-x/start-x/end-x (GOOD)', re: /\b(?:ms|me|ps|pe)-[a-zA-Z0-9._/[\]-]+|\b(?:start|end)-[a-zA-Z0-9._/[\]-]+|\btext-(?:start|end)\b/g },
];

const ICONS = [
    'ArrowLeft', 'ArrowRight', 'ChevronLeft', 'ChevronRight', 'ChevronsLeft', 'ChevronsRight',
    'MoveLeft', 'MoveRight', 'AlignLeft', 'AlignRight', 'ListStart', 'ListEnd',
    'ArrowUpLeft', 'ArrowUpRight', 'ArrowDownLeft', 'ArrowDownRight',
    'Undo2', 'Redo2', 'SkipBack', 'SkipForward', 'PanelLeft', 'PanelRight',
    'CircleChevronLeft', 'CircleChevronRight', 'CornerDownLeft', 'CornerDownRight',
];

const files = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(entry.name)) files.push(p);
    }
}
walk(SRC);

const results = [];
const iconTotals = Object.fromEntries(ICONS.map((i) => [i, 0]));
const categoryTotals = Object.fromEntries(PATTERNS.map((p) => [p.key, 0]));
let localizedFiles = 0;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const cat = { positioning: [], marginPadding: [], spaceDivide: [], textAlign: [], borders: [], truncate: [], lineClamp: [], translateX: [], logical: [], icons: [] };
    const iconCount = {};

    lines.forEach((line, idx) => {
        for (const p of PATTERNS) {
            const matches = line.match(p.re);
            if (matches) cat[p.key].push({ line: idx + 1, count: matches.length, sample: matches.slice(0, 4) });
        }
        for (const icon of ICONS) {
            const n = (line.match(new RegExp(`\\b${icon}\\b`, 'g')) || []).length;
            if (n > 0) iconCount[icon] = (iconCount[icon] ?? 0) + n;
        }
    });

    const hasLang = /\buseLanguage\b|\bLanguageProvider\b/.test(content);
    if (hasLang) localizedFiles += 1;

    const relative = path.relative(isRepoScripts ? ROOT : path.join(ROOT, 'sadaf-frontend'), file).replace(/\\/g, '/');
    results.push({ file: relative, cat, iconCount });
}

// Totals
for (const r of results) {
    for (const p of PATTERNS) categoryTotals[p.key] += r.cat[p.key].reduce((s, m) => s + m.count, 0);
    for (const [icon, n] of Object.entries(r.iconCount)) iconTotals[icon] += n;
}

const RISKY_KEYS = ['positioning', 'marginPadding', 'spaceDivide', 'textAlign', 'borders', 'truncate', 'lineClamp', 'translateX'];
const riskyFiles = results.filter((r) => RISKY_KEYS.some((k) => r.cat[k].length > 0)).sort((a, b) => {
    const ra = RISKY_KEYS.reduce((s, k) => s + a.cat[k].reduce((x, m) => x + m.count, 0), 0);
    const rb = RISKY_KEYS.reduce((s, k) => s + b.cat[k].reduce((x, m) => x + m.count, 0), 0);
    return rb - ra;
});

const riskyTotal = Object.entries(categoryTotals).filter(([k]) => k !== 'logical').reduce((s, [, v]) => s + v, 0);
const logicalTotal = categoryTotals.logical;

if (asJson) {
    console.log(JSON.stringify({ filesScanned: files.length, localizedFiles, riskyTotal, logicalTotal, categoryTotals, iconTotals, riskyFiles: riskyFiles.slice(0, topN) }, null, 2));
    if (maxRisks !== null && riskyTotal > maxRisks) {
        console.error(`RTL audit FAILED: ${riskyTotal} risky matches exceed the ${maxRisks} limit.`);
        process.exit(1);
    }
    process.exit(0);
}

// ── Human-readable report ───────────────────────────────────────────────────
const linesOut = [];
linesOut.push('# SADAF — RTL Layout Audit');
linesOut.push('');
linesOut.push(`_Auto-generated: ${new Date().toISOString()} · ${files.length} files scanned · ${localizedFiles} localized (use LanguageProvider)_`);
linesOut.push('');
linesOut.push('## Summary');
linesOut.push('');
linesOut.push('| Metric | Count |');
linesOut.push('|---|---|');
linesOut.push(`| Physical (RTL-risky) matches | **${riskyTotal}** |`);
linesOut.push(`| Logical utilities (correct) | **${logicalTotal}** |`);
linesOut.push(`| Files with ≥1 risky match | **${riskyFiles.length}** |`);
linesOut.push('');
linesOut.push('## By category');
linesOut.push('');
linesOut.push('| Category | Occurrences |');
linesOut.push('|---|---|');
for (const p of PATTERNS) linesOut.push(`| ${p.label} | ${categoryTotals[p.key]} |`);
linesOut.push('');
linesOut.push('## Top files');
linesOut.push('');
linesOut.push('| File | left/right | ml/mr/pl/pr | space-x | text-align | borders | truncate | line-clamp | translate-x | logical |');
linesOut.push('|---|---|---|---|---|---|---|---|---|---|');
for (const r of riskyFiles.slice(0, topN)) {
    const c = r.cat;
    linesOut.push(`| ${r.file} | ${c.positioning.reduce((s, m) => s + m.count, 0)} | ${c.marginPadding.reduce((s, m) => s + m.count, 0)} | ${c.spaceDivide.reduce((s, m) => s + m.count, 0)} | ${c.textAlign.reduce((s, m) => s + m.count, 0)} | ${c.borders.reduce((s, m) => s + m.count, 0)} | ${c.truncate.reduce((s, m) => s + m.count, 0)} | ${c.lineClamp.reduce((s, m) => s + m.count, 0)} | ${c.translateX.reduce((s, m) => s + m.count, 0)} | ${c.logical.reduce((s, m) => s + m.count, 0)} |`);
}
linesOut.push('');
linesOut.push('## Directional icons (imported/used)');
linesOut.push('');
linesOut.push('| Icon | Occurrences |');
linesOut.push('|---|---|');
for (const [icon, n] of Object.entries(iconTotals).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])) linesOut.push(`| ${icon} | ${n} |`);
linesOut.push('');
linesOut.push('## Detailed matches — physical utilities & truncation');
linesOut.push('');
linesOut.push('```');
for (const r of riskyFiles) {
    const entries = Object.entries(r.cat).filter(([k, v]) => v.length > 0 && k !== 'logical' && k !== 'icons');
    if (entries.length === 0) continue;
    linesOut.push(`# ${r.file}`);
    for (const [k, matches] of entries) {
        const p = PATTERNS.find((x) => x.key === k);
        linesOut.push(`  ${p.label}: ${matches.reduce((s, m) => s + m.count, 0)} x`);
        for (const m of matches.slice(0, 40)) linesOut.push(`    L${m.line}: ${m.sample.join(' | ')}`);
    }
}
linesOut.push('```');
linesOut.push('');

if (writeReport) {
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, linesOut.join('\n'), 'utf8');
    console.log(`Report written to docs/rtl-audit-report.md`);
}
console.log(linesOut.slice(0, 55).join('\n'));
