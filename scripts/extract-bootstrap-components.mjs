/**
 * Extracts Bootstrap 5 component CSS required by bootstrap.bundle.js
 * (modals, collapse, carousel, navbar, nav, tables, alerts, badges, buttons).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bootstrapCss = fs.readFileSync(
  path.join(root, 'node_modules/bootstrap/dist/css/bootstrap.css'),
  'utf8'
);

const SELECTOR_PREFIXES = [
  ':root,',
  '[data-bs-theme',
  '.table',
  '.btn-secondary',
  '.btn-close',
  '.fade',
  '.collapse',
  '.collapsing',
  '.nav-link',
  '.nav-item',
  '.navbar',
  '.navbar-expand',
  '.badge',
  '.alert',
  '.modal',
  '.modal-backdrop',
  '.modal-open',
  '.carousel',
  '.show > .dropdown-menu',
];

function extractRules(css) {
  const lines = css.split('\n');
  const output = [];
  let capturing = false;
  let braceDepth = 0;
  let buffer = [];
  let inMedia = false;
  let mediaBuffer = [];
  let mediaBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!capturing && !inMedia) {
      const trimmed = line.trim();
      const isMatch = SELECTOR_PREFIXES.some((prefix) => {
        if (prefix === ':root,') return trimmed.startsWith(':root,');
        if (prefix === '[data-bs-theme') return trimmed.startsWith('[data-bs-theme');
        return trimmed.startsWith(prefix) || trimmed.includes(` ${prefix}`) || trimmed.includes(`,${prefix}`);
      });

      if (isMatch && trimmed.includes('{')) {
        capturing = true;
        buffer = [line];
        braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (braceDepth === 0) {
          output.push(buffer.join('\n'));
          capturing = false;
          buffer = [];
        }
        continue;
      }

      if (trimmed.startsWith('@media') && (
        trimmed.includes('min-width: 576px') ||
        trimmed.includes('min-width: 768px') ||
        trimmed.includes('min-width: 992px') ||
        trimmed.includes('min-width: 1200px') ||
        trimmed.includes('min-width: 1400px') ||
        trimmed.includes('prefers-reduced-motion')
      )) {
        inMedia = true;
        mediaBuffer = [line];
        mediaBraceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        continue;
      }
    } else if (inMedia) {
      mediaBuffer.push(line);
      mediaBraceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

      if (mediaBraceDepth === 0) {
        const block = mediaBuffer.join('\n');
        const hasRelevant = SELECTOR_PREFIXES.some((p) => {
          if (p === ':root,') return block.includes(':root');
          return block.includes(p);
        });
        if (hasRelevant) output.push(block);
        inMedia = false;
        mediaBuffer = [];
      }
      continue;
    } else if (capturing) {
      buffer.push(line);
      braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceDepth === 0) {
        output.push(buffer.join('\n'));
        capturing = false;
        buffer = [];
      }
    }
  }

  return output.join('\n\n');
}

const extracted = extractRules(bootstrapCss);
const header = `/* Bootstrap 5.3.2 component styles — required by bootstrap.bundle.js */\n`;
const outPath = path.join(root, 'src', 'styles', 'bootstrap-components.css');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + extracted);
console.log(`Wrote ${outPath} (${(header + extracted).length} bytes)`);
