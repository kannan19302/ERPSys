import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const pagesDir = path.join(rootDir, 'apps', 'web', 'app', '(dashboard)');
const descriptorsDir = path.join(rootDir, 'apps', 'web', 'src', 'navigation', 'descriptors');
const componentsDir = path.join(rootDir, 'apps', 'web', 'src', 'components');

function findPageFiles(dir, relativePath = '') {
  let results = [];
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const rel = path.join(relativePath, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findPageFiles(fullPath, rel));
    } else if (name === 'page.tsx') {
      const routePath = ('/' + relativePath.replace(/\\/g, '/')).replace(/\/page\.tsx$/, '').replace(/\/$/, '');
      results.push({ fullPath, routePath: routePath || '/' });
    }
  }
  return results;
}

const pages = findPageFiles(pagesDir);

function readAllTextFiles(dir) {
  let text = '';
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      text += readAllTextFiles(fullPath);
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      text += readFileSync(fullPath, 'utf8') + '\n';
    }
  }
  return text;
}

const allWebSrcCode = readAllTextFiles(path.join(rootDir, 'apps', 'web', 'src'));
const allWebAppCode = readAllTextFiles(path.join(rootDir, 'apps', 'web', 'app'));
const allCode = allWebSrcCode + '\n' + allWebAppCode;

console.log(`Auditing ${pages.length} dashboard pages...`);

const unwiredPages = [];
for (const { fullPath, routePath } of pages) {
  if (routePath === '' || routePath === '/') continue;

  // Ignore dynamic parameter route templates like [id]
  const cleanRoute = routePath.replace(/\[[^\]]+\]/g, '[id]');
  const isDynamic = routePath.includes('[');

  // Check if routePath or base segment is mentioned in code
  const exactMatch = allCode.includes(`"${routePath}"`) || allCode.includes(`'${routePath}'`);
  const dynamicMatch = isDynamic && (allCode.includes(`"${cleanRoute}"`) || allCode.includes(`'${cleanRoute}'`) || allCode.includes(routePath.split('[')[0]));

  if (!exactMatch && !dynamicMatch) {
    unwiredPages.push(routePath);
  }
}

console.log(`Audit Complete. Found ${unwiredPages.length} unwired standalone pages:`);
console.log(JSON.stringify(unwiredPages, null, 2));
