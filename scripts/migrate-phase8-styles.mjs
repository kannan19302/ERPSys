import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;
const root = process.cwd();
const dashboard = path.join(root, 'apps', 'web', 'app', '(dashboard)');

const targets = [
  'builder/page.tsx',
  'builder/erp/page.tsx',
  'builder/erp/apps/[id]/page.tsx',
  'builder/erp/customize/page.tsx',
  'builder/erp/dashboards/page.tsx',
  'builder/erp/dashboards/new/page.tsx',
  'builder/erp/data/page.tsx',
  'builder/erp/forms/page.tsx',
  'builder/erp/logic/page.tsx',
  'builder/erp/modules/[id]/page.tsx',
  'builder/erp/modules/page.tsx',
  'builder/erp/workflows/page.tsx',
  'builder/erp/workflows/new/page.tsx',
  'builder/web/page.tsx',
  'builder/web/assets/page.tsx',
  'builder/web/canvas/page.tsx',
  'builder/web/collections/page.tsx',
  'builder/web/menus/page.tsx',
  'builder/web/pages/page.tsx',
  'builder/web/seo/page.tsx',
  'builder/web/templates/page.tsx',
  'builder/web/settings/page.tsx',
  'builder/web/sites/page.tsx',
  'builder/web/sites/[id]/page.tsx',
  'builder/manage/access/page.tsx',
  'builder/manage/connectors/page.tsx',
  'builder/manage/environments/page.tsx',
  'builder/manage/git/page.tsx',
  'builder/manage/mobile-export/page.tsx',
  'builder/manage/releases/page.tsx',
  'builder/marketplace/page.tsx',
  'builder/web/domains/page.tsx',
  'apps/page.tsx',
  'apps/store/page.tsx',
  'apps/store/[slug]/page.tsx',
  'apps/store/collections/page.tsx',
  'apps/store/collections/[slug]/page.tsx',
  'apps/installed/page.tsx',
  'apps/settings/page.tsx'
];

const unitless = new Set([
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth',
  'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns', 'fillOpacity', 'flex',
  'flexGrow', 'flexNegative', 'flexOrder', 'flexPositive', 'flexShrink', 'floodOpacity', 'fontWeight',
  'gridArea', 'gridColumn', 'gridColumnEnd', 'gridColumnStart', 'gridRow', 'gridRowEnd', 'gridRowStart',
  'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans', 'scale', 'stopOpacity', 'strokeDasharray',
  'strokeDashoffset', 'strokeMiterlimit', 'strokeOpacity', 'strokeWidth', 'tabSize', 'widows', 'zIndex', 'zoom'
]);

const hexTokens = {
  '#fff': 'var(--color-bg-elevated)',
  '#ffffff': 'var(--color-bg-elevated)',
  '#f3f4f6': 'var(--color-bg-subtle)',
  '#dcfce7': 'var(--color-success-bg)',
  '#16a34a': 'var(--color-success)',
  '#6b7280': 'var(--color-text-secondary)',
  '#9ca3af': 'var(--color-text-tertiary)',
  '#ef4444': 'var(--color-danger)',
  '#f59e0b': 'var(--color-warning)',
  '#3b82f6': 'var(--color-primary)',
};

const kebab = value => value.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);

const getCSSValue = (node, key) => {
  if (node.type === 'StringLiteral') {
    const lower = node.value.toLowerCase();
    return hexTokens[lower] ?? node.value;
  }
  if (node.type === 'NumericLiteral') {
    return node.value === 0 || unitless.has(key) ? String(node.value) : `${node.value}px`;
  }
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'NumericLiteral') {
    return `-${node.argument.value}px`;
  }
  return null;
};

for (const target of targets) {
  const filename = path.join(dashboard, target);
  if (!fs.existsSync(filename)) {
    continue;
  }

  let source = fs.readFileSync(filename, 'utf8');
  let ast;
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (err) {
    console.error(`Failed to parse ${target}:`, err.message);
    continue;
  }

  const edits = [];
  const rules = [];
  const styleToClassNameMap = new Map();

  traverse(ast, {
    JSXOpeningElement(nodePath) {
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
        classNameVal = `s${styleToClassNameMap.size + 1}`;
        styleToClassNameMap.set(styleKey, classNameVal);
        rules.push(`.${classNameVal} { ${styleKey} }`);
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
          styleEdit = {
            start: styleAttr.start,
            end: styleAttr.end,
            text: ''
          };
        } else {
          styleEdit = {
            start: styleAttr.start,
            end: styleAttr.end,
            text: `className={styles.${classNameVal}}`
          };
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
          styleEdit = {
            start: styleAttr.start,
            end: styleAttr.end,
            text: styleReconstructed
          };
        } else {
          styleEdit = {
            start: styleAttr.start,
            end: styleAttr.end,
            text: `${styleReconstructed} className={styles.${classNameVal}}`
          };
        }
      }

      if (classNameEdit) edits.push(classNameEdit);
      if (styleEdit) edits.push(styleEdit);
    }
  });

  // Apply edits if any
  if (edits.length > 0) {
    edits.sort((a, b) => b.start - a.start);
    for (const edit of edits) {
      source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
    }
  }

  const basename = path.basename(filename);
  const isPage = basename === 'page.tsx';
  const cssFile = filename.replace(/\.tsx$/, '.module.css');
  const cssImport = isPage ? "import styles from './page.module.css';" : `import styles from './${basename.replace(/\.tsx$/, '')}.module.css';`;

  // Write CSS file if there are new rules
  if (rules.length > 0) {
    fs.writeFileSync(cssFile, rules.join('\n') + '\n');
  }

  // Always reform headers to ensure 'use client' is first
  const hasUseClient = source.includes("'use client'") || source.includes('"use client"');
  const hasNocheck = source.includes('// @ts-nocheck');
  const hasImport = source.includes('import styles from');
  const shouldImport = rules.length > 0 || hasImport;

  let cleanSource = source
    .replace(/(['"])use client\1;?\r?\n?/g, '')
    .replace(/\/\/ @ts-nocheck\r?\n?/g, '')
    .replace(/import styles from\s*['"]\.\/.*?\.module\.css['"];?\r?\n?/g, '');

  let header = '';
  if (hasNocheck) {
    header += `// @ts-nocheck\n`;
  }
  if (hasUseClient) {
    header += `'use client';\n`;
  }
  if (shouldImport) {
    header += `${cssImport}\n`;
  }

  const finalSource = header + cleanSource.trimStart();

  if (finalSource !== source) {
    fs.writeFileSync(filename, finalSource);
    console.log(`${target}: formatted headers / applied styles`);
  } else {
    console.log(`${target}: already clean`);
  }
}
