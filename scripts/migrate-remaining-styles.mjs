/**
 * UI Migration — final sweep codemod.
 * Extracts static style={{...}} props into per-file CSS Modules across ALL of
 * apps/web/app (dashboard, auth, public, storefront, root pages).
 *
 * Improvements over migrate-phase8-styles.mjs:
 *  - walks the whole app tree instead of a hardcoded target list
 *  - APPENDS to existing .module.css files: dedupes against existing .sN rules
 *    and continues numbering after the highest existing index
 *  - property-aware hex→token mapping (color: #fff → text token, background:
 *    #fff → bg token); deliberate multi-hue palettes (calendar/brand colors)
 *    are left untouched
 *
 * Usage:
 *   node scripts/migrate-remaining-styles.mjs --dry-run
 *   node scripts/migrate-remaining-styles.mjs --apply
 *   node scripts/migrate-remaining-styles.mjs --apply --only=apps/web/app/(auth)
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;
const root = process.cwd();
const appDir = path.join(root, 'apps', 'web', 'app');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = args.find(a => a.startsWith('--only='))?.split('=')[1];

const unitless = new Set([
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth',
  'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns', 'fillOpacity', 'flex',
  'flexGrow', 'flexNegative', 'flexOrder', 'flexPositive', 'flexShrink', 'floodOpacity', 'fontWeight',
  'gridArea', 'gridColumn', 'gridColumnEnd', 'gridColumnStart', 'gridRow', 'gridRowEnd', 'gridRowStart',
  'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans', 'scale', 'stopOpacity', 'strokeDasharray',
  'strokeDashoffset', 'strokeMiterlimit', 'strokeOpacity', 'strokeWidth', 'tabSize', 'widows', 'zIndex', 'zoom'
]);

// Reverse map of the light-theme token palette plus system-ish near-misses.
// Property-aware: the same hex maps differently for text vs background vs border.
// Deliberate multi-hue palettes (Google calendar colors, brand marks, charts)
// are intentionally NOT mapped.
const TEXT_KEYS = new Set(['color', 'caretColor', 'fill', 'stroke']);
const BG_KEYS = new Set(['background', 'backgroundColor']);
const BORDER_KEYS = new Set(['borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor']);

const hexToToken = (hex, key) => {
  const h = hex.toLowerCase();
  const isText = TEXT_KEYS.has(key);
  const isBg = BG_KEYS.has(key);
  const isBorder = BORDER_KEYS.has(key);

  // whites — depends on property
  if (h === '#fff' || h === '#ffffff') {
    if (isText) return 'var(--color-text-inverse)';
    if (isBg) return 'var(--color-bg-elevated)';
    return null;
  }

  const map = {
    // primary family (indigo/violet)
    '#6366f1': 'var(--color-primary)',
    '#4f46e5': 'var(--color-primary-active)',
    '#5457e5': 'var(--color-primary-hover)',
    '#818cf8': 'var(--color-primary)',
    '#7c3aed': 'var(--color-primary)',
    '#8b5cf6': 'var(--color-primary)',
    '#eef2ff': 'var(--color-primary-light)',
    '#ede9fe': 'var(--color-primary-light)',
    // success (greens)
    '#10b981': 'var(--color-success)',
    '#22c55e': 'var(--color-success)',
    '#16a34a': 'var(--color-success-hover)',
    '#059669': 'var(--color-success-hover)',
    '#4ade80': 'var(--color-success)',
    '#34d399': 'var(--color-success)',
    '#15803d': 'var(--color-success-hover)',
    '#dcfce7': 'var(--color-success-light)',
    '#ecfdf5': 'var(--color-success-light)',
    '#d1fae5': 'var(--color-success-light)',
    '#065f46': 'var(--color-success-text)',
    // danger (reds/rose)
    '#f43f5e': 'var(--color-danger)',
    '#ef4444': 'var(--color-danger)',
    '#dc2626': 'var(--color-danger-hover)',
    '#e11d48': 'var(--color-danger-hover)',
    '#b91c1c': 'var(--color-danger-hover)',
    '#f87171': 'var(--color-danger)',
    '#fee2e2': 'var(--color-danger-light)',
    '#fff1f2': 'var(--color-danger-light)',
    '#fef2f2': 'var(--color-danger-light)',
    '#9f1239': 'var(--color-danger-text)',
    '#991b1b': 'var(--color-danger-text)',
    // warning (ambers)
    '#f59e0b': 'var(--color-warning)',
    '#d97706': 'var(--color-warning-hover)',
    '#fbbf24': 'var(--color-warning)',
    '#b45309': 'var(--color-warning-hover)',
    '#fef3c7': 'var(--color-warning-light)',
    '#fffbeb': 'var(--color-warning-light)',
    '#92400e': 'var(--color-warning-text)',
    // info (blues/cyans)
    '#0ea5e9': 'var(--color-info)',
    '#3b82f6': 'var(--color-info)',
    '#2563eb': 'var(--color-info-hover)',
    '#0284c7': 'var(--color-info-hover)',
    '#0891b2': 'var(--color-info-hover)',
    '#06b6d4': 'var(--color-info)',
    '#38bdf8': 'var(--color-info)',
    '#60a5fa': 'var(--color-info)',
    '#dbeafe': 'var(--color-info-light)',
    '#f0f9ff': 'var(--color-info-light)',
    '#e0f2fe': 'var(--color-info-light)',
    '#075985': 'var(--color-info-text)',
    '#1e40af': 'var(--color-info-text)',
    // neutrals — text
    '#1a1a2e': 'var(--color-text)',
    '#111827': 'var(--color-text)',
    '#1f2937': 'var(--color-text)',
    '#374151': 'var(--color-text-secondary)',
    '#4b5563': 'var(--color-text-secondary)',
    '#555b67': 'var(--color-text-secondary)',
    '#64748b': 'var(--color-text-secondary)',
    '#6b7280': 'var(--color-text-tertiary)',
    '#9ca3af': 'var(--color-text-tertiary)',
    '#94a3b8': 'var(--color-text-tertiary)',
  };

  if (map[h]) return map[h];

  // neutral greys — property-aware
  const lightGreys = new Set(['#f3f4f6', '#f9fafb', '#f8fafc', '#f1f5f9', '#f1f3f5', '#fafbfc']);
  const borderGreys = new Set(['#e5e7eb', '#e2e8f0', '#d1d5db', '#cbd5e1']);
  if (lightGreys.has(h)) return isBg ? 'var(--color-bg-sunken)' : null;
  if (borderGreys.has(h)) {
    if (isBorder) return h === '#d1d5db' || h === '#cbd5e1' ? 'var(--color-border-strong)' : 'var(--color-border)';
    if (isBg) return 'var(--color-bg-active)';
    return null;
  }
  return null;
};

const kebab = value => value.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

const getCSSValue = (node, key) => {
  if (node.type === 'StringLiteral') {
    let v = node.value;
    // map hex colors inside the value (handles '#fff' and '1px solid #e5e7eb')
    if (HEX_RE.test(v)) {
      v = v.replace(/#[0-9a-fA-F]{3,8}\b/g, hex => {
        // inside composite values like borders treat as border-ish
        const mapped = hexToToken(hex, key === 'border' || key.startsWith('border') || key === 'outline' ? 'borderColor' : key);
        return mapped ?? hex;
      });
    }
    return v;
  }
  if (node.type === 'NumericLiteral') {
    return node.value === 0 || unitless.has(key) ? String(node.value) : `${node.value}px`;
  }
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'NumericLiteral') {
    return `-${node.argument.value}px`;
  }
  return null;
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

// Parse an existing module.css: return { map: styleKey→className, maxIndex, raw }
function readExistingCss(cssFile) {
  const map = new Map();
  let maxIndex = 0;
  let raw = '';
  if (fs.existsSync(cssFile)) {
    raw = fs.readFileSync(cssFile, 'utf8');
    const ruleRe = /^\.(s(\d+))\s*\{\s*(.*?)\s*\}\s*$/gm;
    let m;
    while ((m = ruleRe.exec(raw)) !== null) {
      const idx = Number(m[2]);
      if (idx > maxIndex) maxIndex = idx;
      // normalize body: 'k: v; k2: v2;' — reconstruct sorted key to match generator
      const body = m[3].trim();
      const parts = body.split(';').map(s => s.trim()).filter(Boolean).map(s => `${s};`);
      const styleKey = parts.sort().join(' ');
      if (!map.has(styleKey)) map.set(styleKey, m[1]);
    }
    // account for any non-sN class names so numbering never collides
    const anyClassRe = /^\.s(\d+)\b/gm;
    let c;
    while ((c = anyClassRe.exec(raw)) !== null) {
      const idx = Number(c[1]);
      if (idx > maxIndex) maxIndex = idx;
    }
  }
  return { map, maxIndex, raw };
}

let filesChanged = 0;
let stylesExtracted = 0;
let filesFailed = 0;

let files = walk(appDir);
if (ONLY) {
  const onlyAbs = path.resolve(root, ONLY);
  files = files.filter(f => f.startsWith(onlyAbs));
}

for (const filename of files) {
  let source = fs.readFileSync(filename, 'utf8');
  if (!source.includes('style={{')) continue;

  let ast;
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (err) {
    console.error(`PARSE FAIL ${path.relative(appDir, filename)}: ${err.message}`);
    filesFailed++;
    continue;
  }

  // if the file imports an identifier `styles` from a non-module-css source, skip
  const foreignStyles = /import\s+styles\s+from\s+(?!['"]\.\/[^'"]*\.module\.css['"])/.test(source);
  if (foreignStyles) {
    console.error(`SKIP (foreign 'styles' import) ${path.relative(appDir, filename)}`);
    continue;
  }

  const cssFile = filename.replace(/\.tsx$/, '.module.css');
  const { map: styleToClassNameMap, maxIndex, raw: existingCss } = readExistingCss(cssFile);
  let nextIndex = maxIndex + 1;

  const edits = [];
  const newRules = [];

  // lucide-react icons and next/link, next/image forward className, so they
  // are safe to transform
  const lucideNames = new Set();
  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      if (src === 'lucide-react' || src === 'next/link' || src === 'next/image') {
        for (const spec of p.node.specifiers) {
          if (spec.local?.name) lucideNames.add(spec.local.name);
        }
      }
    }
  });

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      // only touch host elements (<div>, <span>, ...) and lucide icons —
      // other custom components may not forward className, so their style
      // props stay inline
      const tag = nodePath.node.name;
      if (tag.type !== 'JSXIdentifier') return;
      if (!/^[a-z]/.test(tag.name) && !lucideNames.has(tag.name)) return;

      const attrs = nodePath.node.attributes;
      const styleIndex = attrs.findIndex(attr => attr.type === 'JSXAttribute' && attr.name.name === 'style');
      if (styleIndex < 0) return;

      const styleAttr = attrs[styleIndex];
      if (!styleAttr.value || styleAttr.value.type !== 'JSXExpressionContainer' || styleAttr.value.expression.type !== 'ObjectExpression') return;

      const properties = styleAttr.value.expression.properties;
      if (!properties.length) return;

      const staticProps = [];
      const dynamicProps = [];

      for (const prop of properties) {
        if (prop.type !== 'ObjectProperty' || prop.computed || prop.key.type !== 'Identifier') {
          dynamicProps.push(prop);
          continue;
        }
        const val = getCSSValue(prop.value, prop.key.name);
        if (val === null) {
          dynamicProps.push(prop);
        } else {
          staticProps.push({ key: prop.key.name, val });
        }
      }

      if (staticProps.length === 0) return;

      const styleKey = staticProps.map(p => `${kebab(p.key)}: ${p.val};`).sort().join(' ');
      let classNameVal = styleToClassNameMap.get(styleKey);
      if (!classNameVal) {
        classNameVal = `s${nextIndex++}`;
        styleToClassNameMap.set(styleKey, classNameVal);
        newRules.push(`.${classNameVal} { ${styleKey} }`);
      }

      const classIndex = attrs.findIndex(attr => attr.type === 'JSXAttribute' && attr.name.name === 'className');
      let classNameEdit = null;

      if (classIndex >= 0) {
        const clsAttr = attrs[classIndex];
        if (clsAttr.value.type === 'StringLiteral') {
          classNameEdit = {
            start: clsAttr.start,
            end: clsAttr.end,
            text: `className={\`${clsAttr.value.value} \${styles.${classNameVal}}\`}`
          };
        } else if (clsAttr.value.type === 'JSXExpressionContainer') {
          const exprSrc = source.slice(clsAttr.value.expression.start, clsAttr.value.expression.end);
          if (clsAttr.value.expression.type === 'TemplateLiteral') {
            const inner = source.slice(clsAttr.value.expression.start + 1, clsAttr.value.expression.end - 1);
            classNameEdit = {
              start: clsAttr.start,
              end: clsAttr.end,
              text: `className={\`${inner} \${styles.${classNameVal}}\`}`
            };
          } else {
            classNameEdit = {
              start: clsAttr.start,
              end: clsAttr.end,
              text: `className={\`\${${exprSrc}} \${styles.${classNameVal}}\`}`
            };
          }
        }
      }

      let styleEdit = null;
      if (dynamicProps.length === 0) {
        if (classIndex >= 0) {
          styleEdit = { start: styleAttr.start, end: styleAttr.end, text: '' };
        } else {
          styleEdit = { start: styleAttr.start, end: styleAttr.end, text: `className={styles.${classNameVal}}` };
        }
      } else {
        const propStrings = dynamicProps.map(prop => {
          if (prop.type === 'SpreadElement') {
            return source.slice(prop.start, prop.end);
          }
          const keyStr = source.slice(prop.key.start, prop.key.end);
          const valStr = source.slice(prop.value.start, prop.value.end);
          return `${keyStr}: ${valStr}`;
        });
        const styleReconstructed = `style={{ ${propStrings.join(', ')} }}`;
        if (classIndex >= 0) {
          styleEdit = { start: styleAttr.start, end: styleAttr.end, text: styleReconstructed };
        } else {
          styleEdit = { start: styleAttr.start, end: styleAttr.end, text: `${styleReconstructed} className={styles.${classNameVal}}` };
        }
      }

      if (classNameEdit) edits.push(classNameEdit);
      if (styleEdit) edits.push(styleEdit);
    }
  });

  if (edits.length === 0) continue;

  edits.sort((a, b) => b.start - a.start);
  for (const edit of edits) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }

  const basename = path.basename(filename);
  const cssImportName = `./${basename.replace(/\.tsx$/, '')}.module.css`;
  const cssImport = `import styles from '${cssImportName}';`;

  const hasUseClient = source.includes("'use client'") || source.includes('"use client"');
  const hasNocheck = source.includes('// @ts-nocheck');

  let cleanSource = source
    .replace(/(['"])use client\1;?\r?\n?/g, '')
    .replace(/\/\/ @ts-nocheck\r?\n?/g, '')
    .replace(/import styles from\s*['"]\.\/.*?\.module\.css['"];?\r?\n?/g, '');

  let header = '';
  if (hasNocheck) header += `// @ts-nocheck\n`;
  if (hasUseClient) header += `'use client';\n`;
  header += `${cssImport}\n`;

  const finalSource = header + cleanSource.trimStart();

  filesChanged++;
  stylesExtracted += edits.length;

  if (APPLY) {
    if (newRules.length > 0) {
      const joined = (existingCss ? existingCss.replace(/\n*$/, '\n') : '') + newRules.join('\n') + '\n';
      fs.writeFileSync(cssFile, joined);
    }
    fs.writeFileSync(filename, finalSource);
  }
  console.log(`${APPLY ? 'APPLIED' : 'DRY'} ${path.relative(appDir, filename)} — ${newRules.length} new rules`);
}

console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${filesChanged} files, ${stylesExtracted} edits, ${filesFailed} parse failures`);
