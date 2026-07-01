/**
 * Converts Bootstrap utility classes to Tailwind CSS equivalents.
 * Keeps Bootstrap component classes required by bootstrap.bundle.js.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const BS_SPACING = { 0: '0', 1: '1', 2: '2', 3: '4', 4: '6', 5: '12' };

const KEEP_CLASSES = new Set([
  'modal', 'fade', 'show', 'collapse', 'collapsing', 'active',
  'modal-dialog', 'modal-dialog-centered', 'modal-dialog-scrollable', 'modal-content',
  'modal-body', 'modal-header', 'modal-title', 'modal-footer', 'modal-static',
  'modal-backdrop', 'modal-open',
  'carousel', 'slide', 'carousel-inner', 'carousel-item', 'carousel-fade',
  'navbar', 'navbar-expand-lg', 'navbar-collapse', 'navbar-nav', 'navbar-toggler',
  'navbar-toggler-icon', 'nav-item', 'nav-link',
  'btn-close', 'table', 'table-borderless', 'table-striped', 'table-sm', 'table-responsive',
  'alert', 'alert-danger', 'alert-success', 'alert-warning', 'alert-info',
  'alert-primary', 'alert-secondary', 'alert-dismissible', 'alert-modal-error',
  'badge', 'btn', 'btn-secondary', 'btn-primary', 'container',
]);

const DIRECT_MAP = {
  'd-none': 'hidden',
  'd-block': 'block',
  'd-flex': 'flex',
  'd-inline': 'inline',
  'd-inline-block': 'inline-block',
  'd-inline-flex': 'inline-flex',
  'd-grid': 'grid',
  'justify-content-between': 'justify-between',
  'justify-content-center': 'justify-center',
  'justify-content-end': 'justify-end',
  'justify-content-start': 'justify-start',
  'align-items-center': 'items-center',
  'align-items-start': 'items-start',
  'align-items-end': 'items-end',
  'align-items-stretch': 'items-stretch',
  'align-self-center': 'self-center',
  'flex-wrap': 'flex-wrap',
  'flex-nowrap': 'flex-nowrap',
  'flex-column': 'flex-col',
  'flex-row': 'flex-row',
  'flex-grow-1': 'grow',
  'flex-shrink-0': 'shrink-0',
  'w-100': 'w-full',
  'w-50': 'w-1/2',
  'w-75': 'w-3/4',
  'w-25': 'w-1/4',
  'h-100': 'h-full',
  'fw-bold': 'font-bold',
  'fw-normal': 'font-normal',
  'fw-semibold': 'font-semibold',
  'fw-600': 'font-semibold',
  'fw-bolder': 'font-bold',
  'fw-light': 'font-light',
  'text-center': 'text-center',
  'text-start': 'text-start',
  'text-end': 'text-end',
  'text-muted': 'text-bs-muted',
  'text-success': 'text-bs-success',
  'text-dark': 'text-bs-dark',
  'text-white': 'text-white',
  'text-danger': 'text-bs-danger',
  'text-decoration-line-through': 'line-through',
  'border-0': 'border-0',
  'border': 'border',
  'position-absolute': 'absolute',
  'position-relative': 'relative',
  'position-fixed': 'fixed',
  'position-sticky': 'sticky',
  'rounded-3': 'rounded-bs-3',
  'rounded': 'rounded-bs',
  'rounded-circle': 'rounded-full',
  'rounded-pill': 'rounded-full',
  'overflow-hidden': 'overflow-hidden',
  'overflow-auto': 'overflow-auto',
  'shadow': 'shadow',
  'shadow-sm': 'shadow-sm',
  'visually-hidden': 'sr-only',
  'order-first': 'order-first',
  'order-last': 'order-last',
  'float-start': 'float-left',
  'float-end': 'float-right',
  'clearfix': 'clearfix',
  'ratio': 'aspect-video',
  'object-fit-cover': 'object-cover',
  'object-fit-contain': 'object-contain',
  'sticky-top': 'sticky top-0',
  'fixed-top': 'fixed top-0',
  'vh-100': 'min-h-screen',
  'vw-100': 'w-screen',
  'opacity-50': 'opacity-50',
  'opacity-75': 'opacity-75',
  'pe-none': 'pointer-events-none',
  'user-select-none': 'select-none',
  'text-uppercase': 'uppercase',
  'text-lowercase': 'lowercase',
  'text-capitalize': 'capitalize',
  'text-nowrap': 'whitespace-nowrap',
  'text-truncate': 'truncate',
  'text-wrap': 'text-wrap',
  'text-break': 'break-words',
  'align-middle': 'align-middle',
  'align-top': 'align-top',
  'align-bottom': 'align-bottom',
};

const SPACING_PROPS = ['m', 'mt', 'mb', 'ms', 'me', 'mx', 'my', 'p', 'pt', 'pb', 'ps', 'pe', 'px', 'py', 'gap'];

const GUTTER_MAP = { 0: '0', 1: '1', 2: '2', 3: '4', 4: '6', 5: '12' };

const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', 'xxl'];

function mapSpacing(num) {
  return BS_SPACING[num] ?? num;
}

function mapGutter(num) {
  return GUTTER_MAP[num] ?? mapSpacing(num);
}

function transformSpacingClass(cls) {
  for (const bp of BREAKPOINTS) {
    for (const prop of SPACING_PROPS) {
      const re = new RegExp(`^${bp}:${prop}-(\\d+)$`);
      const m = cls.match(re);
      if (m) return `${bp}:${prop}-${mapSpacing(m[1])}`;
    }
  }

  for (const prop of SPACING_PROPS) {
    const re = new RegExp(`^${prop}-(\\d+)$`);
    const m = cls.match(re);
    if (m) return `${prop}-${mapSpacing(m[1])}`;
  }

  return null;
}

function transformDisplayClass(cls) {
  for (const bp of BREAKPOINTS) {
    const m = cls.match(new RegExp(`^${bp}:d-(none|block|flex|inline|inline-block|inline-flex|grid)$`));
    if (m) {
      const map = { none: 'hidden', block: 'block', flex: 'flex', inline: 'inline', 'inline-block': 'inline-block', 'inline-flex': 'inline-flex', grid: 'grid' };
      return `${bp}:${map[m[1]]}`;
    }
  }

  const m = cls.match(/^d-(none|block|flex|inline|inline-block|inline-flex|grid)$/);
  if (m) {
    const map = { none: 'hidden', block: 'block', flex: 'flex', inline: 'inline', 'inline-block': 'inline-block', 'inline-flex': 'inline-flex', grid: 'grid' };
    return map[m[1]];
  }

  return null;
}

function transformColClass(cls) {
  const rowColsMatch = cls.match(/^row-cols-(\d+)$/);
  if (rowColsMatch) return `grid-cols-${rowColsMatch[1]}`;

  for (const bp of BREAKPOINTS) {
    const rowCols = cls.match(new RegExp(`^${bp}:row-cols-(\\d+)$`));
    if (rowCols) return `${bp}:grid-cols-${rowCols[1]}`;

    const col = cls.match(new RegExp(`^${bp}:col-(\\d+)$`));
    if (col) return `${bp}:col-span-${col[1]}`;

    const colAuto = cls.match(new RegExp(`^${bp}:col-auto$`));
    if (colAuto) return `${bp}:col-auto`;

    const colBp = cls.match(new RegExp(`^${bp}:col$`));
    if (colBp) return null;
  }

  if (cls === 'col') return null;
  if (cls.match(/^col-\d+$/)) return null;
  if (cls.match(/^col-(sm|md|lg|xl|xxl)-\d+$/)) {
    const [, bp, span] = cls.match(/^col-(sm|md|lg|xl|xxl)-(\d+)$/) || [];
    if (bp === 'lg' && (span === '3' || span === '9')) return `${bp}:col-span-${span}`;
    return null;
  }
  if (cls.match(/^col-(sm|md|lg|xl|xxl)$/)) return null;

  return null;
}

function transformGutterClass(cls) {
  const gMatch = cls.match(/^g-(\d+)$/);
  if (gMatch) return `gap-${mapGutter(gMatch[1])}`;

  for (const bp of BREAKPOINTS) {
    const gBp = cls.match(new RegExp(`^${bp}:g-(\\d+)$`));
    if (gBp) return `${bp}:gap-${mapGutter(gBp[1])}`;
  }

  const gx = cls.match(/^gx-(\d+)$/);
  if (gx) return `gap-x-${mapGutter(gx[1])}`;
  const gy = cls.match(/^gy-(\d+)$/);
  if (gy) return `gap-y-${mapGutter(gy[1])}`;

  return null;
}

function transformOffsetClass(cls) {
  for (const bp of BREAKPOINTS) {
    const m = cls.match(new RegExp(`^${bp}:offset-(\\d+)$`));
    if (m) return `${bp}:col-start-${Number(m[1]) + 1}`;
  }
  const m = cls.match(/^offset-(\d+)$/);
  if (m) return `col-start-${Number(m[1]) + 1}`;
  return null;
}

function transformOrderClass(cls) {
  for (const bp of BREAKPOINTS) {
    const m = cls.match(new RegExp(`^${bp}:order-(\\d+)$`));
    if (m) return `${bp}:order-${m[1]}`;
  }
  const m = cls.match(/^order-(\d+)$/);
  if (m) return `order-${m[1]}`;
  return null;
}

function transformFsClass(cls) {
  const m = cls.match(/^fs-(\d+)$/);
  if (!m) return null;
  const map = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-2xl', 4: 'text-xl', 5: 'text-lg', 6: 'text-base' };
  return map[m[1]] ?? null;
}

function transformClassToken(cls) {
  if (!cls || cls === 'row') return null;

  if (KEEP_CLASSES.has(cls)) return cls;

  if (cls === 'md:col-span-6' || cls === 'col-md-6' || cls === 'col-md-12' || cls === 'col-md-4' || cls === 'col-md-3') {
    return null;
  }

  if (DIRECT_MAP[cls]) return DIRECT_MAP[cls];

  const display = transformDisplayClass(cls);
  if (display) return display;

  const spacing = transformSpacingClass(cls);
  if (spacing) return spacing;

  const col = transformColClass(cls);
  if (col !== null) return col;

  const gutter = transformGutterClass(cls);
  if (gutter) return gutter;

  const offset = transformOffsetClass(cls);
  if (offset) return offset;

  const order = transformOrderClass(cls);
  if (order) return order;

  const fs = transformFsClass(cls);
  if (fs) return fs;

  if (cls.startsWith('row-cols-') || cls.includes(':row-cols-')) {
    return transformColClass(cls);
  }

  return cls;
}

function inferGridCols(classes) {
  const rowCols = [];
  for (const cls of classes) {
    let m = cls.match(/^row-cols-(\d+)$/);
    if (m) {
      rowCols.push(`grid-cols-${m[1]}`);
      continue;
    }
    m = cls.match(/^row-cols-(sm|md|lg|xl|xxl)-(\d+)$/);
    if (m) {
      rowCols.push(`${m[1]}:grid-cols-${m[2]}`);
    }
  }
  return rowCols;
}

function inferGridFromChildren(html, rowStartIndex) {
  const colPattern = /class="[^"]*\b(?:col(?:-(?:sm|md|lg|xl|xxl))?(?:-\d+)?)\b[^"]*"/g;
  const slice = html.slice(rowStartIndex, rowStartIndex + 2000);
  const matches = [...slice.matchAll(colPattern)];
  const colClasses = matches.flatMap((m) => m[0].match(/\bcol(?:-(?:sm|md|lg|xl|xxl))?(?:-\d+)?\b/g) || []);

  const hasLg3 = colClasses.some((c) => c === 'col-lg-3');
  const hasLg9 = colClasses.some((c) => c === 'col-lg-9');
  if (hasLg3 && hasLg9) return ['grid-cols-1', 'lg:grid-cols-12'];

  const md6 = colClasses.filter((c) => c === 'col-md-6').length;
  const md12 = colClasses.some((c) => c === 'col-md-12');
  const md4 = colClasses.filter((c) => c === 'col-md-4').length;
  const md3 = colClasses.filter((c) => c === 'col-md-3').length;

  if (md6 >= 2) return ['grid-cols-1', 'md:grid-cols-2'];
  if (md4 >= 3) return ['grid-cols-1', 'md:grid-cols-3'];
  if (md3 >= 4) return ['grid-cols-1', 'md:grid-cols-4'];
  if (md12) return ['grid-cols-1'];

  return ['grid-cols-1'];
}

function transformClassAttribute(classValue, htmlContext = '', attrIndex = 0) {
  let classes = classValue.trim().split(/\s+/).filter(Boolean);
  const wasRow = classes.includes('row');

  if (wasRow) {
    const rowCols = inferGridCols(classes);
    const gutter = classes.map(transformGutterClass).find(Boolean) || 'gap-6';
    const inferred = rowCols.length ? rowCols : inferGridFromChildren(htmlContext, attrIndex);
    const other = classes
      .filter((c) => !c.startsWith('row') && !c.startsWith('g-') && !c.match(/^(?:sm|md|lg|xl|xxl):g-/) && !c.startsWith('row-cols'))
      .map(transformClassToken)
      .filter(Boolean);
    return ['grid', ...inferred, gutter, ...other].filter(Boolean).join(' ');
  }

  const transformed = classes.map(transformClassToken).filter(Boolean);
  return [...new Set(transformed)].join(' ');
}

function convertContent(content) {
  return content.replace(/class="([^"]*)"/g, (match, classValue, offset) => {
    const converted = transformClassAttribute(classValue, content, offset);
    return `class="${converted}"`;
  }).replace(/className="([^"]*)"/g, (match, classValue, offset) => {
    const converted = transformClassAttribute(classValue, content, offset);
    return `className="${converted}"`;
  }).replace(/className='([^']*)'/g, (match, classValue, offset) => {
    const converted = transformClassAttribute(classValue, content, offset);
    return `className='${converted}'`;
  }).replace(/class='([^']*)'/g, (match, classValue, offset) => {
    const converted = transformClassAttribute(classValue, content, offset);
    return `class='${converted}'`;
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const converted = convertContent(content);

  if (content !== converted) {
    fs.writeFileSync(filePath, converted);
    console.log(`Converted: ${path.relative(root, filePath)}`);
  }
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext);
    else if (entry.name.endsWith(ext)) processFile(full);
  }
}

const targets = [
  path.join(root, 'src', 'legacy'),
  path.join(root, 'public', 'js'),
  path.join(root, 'js'),
  path.join(root, 'src', 'utils'),
];

for (const dir of targets) walk(dir, '.html');
for (const dir of targets) walk(dir, '.js');
for (const dir of targets) walk(dir, '.jsx');

console.log('Bootstrap to Tailwind conversion complete.');
