#!/usr/bin/env node
/**
 * scripts/module-health.mjs — Computes and reports quantitative module health scores.
 *
 * Scans every module, calculates health scoring (0-100) based on features, test coverage,
 * decorator compliance, CRUD coverage, and documentation. Updates the System Progress Dashboard
 * in .ai/MODULE_REGISTRY.md.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiModulesDir = path.join(root, 'apps', 'api', 'src', 'modules');
const registryPath = path.join(root, '.ai', 'MODULE_REGISTRY.md');

// Helper to walk directory for controller files
function walk(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const files = readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (statSync(p).isDirectory()) {
      walk(p, fileList);
    } else if (file.endsWith('.controller.ts')) {
      fileList.push(p);
    }
  }
  return fileList;
}

// 1. Scan and compute statistics for each module
const modules = {};

const HTTP_VERBS = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

const apiModuleNames = readdirSync(apiModulesDir).filter(name => {
  return statSync(path.join(apiModulesDir, name)).isDirectory();
});

let registryContent = '';
if (existsSync(registryPath)) {
  registryContent = readFileSync(registryPath, 'utf8');
}

for (const name of apiModuleNames.sort()) {
  const moduleDir = path.join(apiModulesDir, name);
  const controllerFiles = walk(moduleDir);
  const testsDir = path.join(moduleDir, 'tests');
  const hasTests = existsSync(testsDir) && readdirSync(testsDir).length > 0;

  let totalFeatures = 0;
  let permissionGuardedFeatures = 0;
  let trackedFeatures = 0;
  
  const verbsFound = new Set();
  let directDbAccessLines = 0;
  let eslintBypasses = 0;

  for (const file of controllerFiles) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');

    // Count endpoints and decorators
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for HTTP method decorators
      const verbMatch = line.match(/@(Get|Post|Put|Patch|Delete)\s*\(/i);
      if (verbMatch) {
        totalFeatures++;
        const verb = verbMatch[1].toLowerCase();
        verbsFound.add(verb === 'put' || verb === 'patch' ? 'update' : verb);

        // Look nearby (6 lines before/after) for @Permissions and @TrackChanges
        let hasPermission = false;
        let hasTrack = false;
        for (let j = Math.max(0, i - 6); j <= Math.min(lines.length - 1, i + 6); j++) {
          if (lines[j].includes('@Permissions(')) hasPermission = true;
          if (lines[j].includes('@TrackChanges(')) hasTrack = true;
          if (j > i && lines[j].includes('){')) break;
        }

        if (hasPermission) permissionGuardedFeatures++;
        if (hasTrack) trackedFeatures++;
      }

      // Check bad patterns
      if (line.includes('eslint-disable')) eslintBypasses++;
      if (line.includes('prisma') && (line.includes('findMany') || line.includes('create') || line.includes('update') || line.includes('delete'))) {
        directDbAccessLines++;
      }
    }
  }

  // Calculate scores
  // A. Feature Points Score (Max 25 points) - target 500 features
  const featureScore = Math.min(25, (totalFeatures / 500) * 25);

  // B. Test Presence (Max 20 points)
  const testScore = hasTests ? 20 : 0;

  // C. Decorator Compliance (Max 30 points)
  // - Permissions: 15 points (pro-rated by guarded vs total)
  // - TrackChanges: 15 points (pro-rated by tracked vs total)
  const permGuardedRatio = totalFeatures > 0 ? (permissionGuardedFeatures / totalFeatures) : 1.0;
  const trackedRatio = totalFeatures > 0 ? (trackedFeatures / totalFeatures) : 1.0;
  const decoratorScore = (permGuardedRatio * 15) + (trackedRatio * 15);

  // D. CRUD Completeness (Max 15 points)
  // Check if has get, post, update (put/patch), delete
  const expectedVerbs = ['get', 'post', 'update', 'delete'];
  const verbsCount = expectedVerbs.filter(v => verbsFound.has(v)).length;
  const crudScore = (verbsCount / expectedVerbs.length) * 15;

  // E. Documentation presence (Max 10 points)
  // Check if module is mentioned in registry under its own section
  const hasDocSection = registryContent.toLowerCase().includes(`## ${name}`) || 
                         registryContent.toLowerCase().includes(`### ${name}`);
  const docScore = hasDocSection ? 10 : 0;

  // Penalties
  let penalties = 0;
  if (eslintBypasses > 0) penalties += Math.min(5, eslintBypasses * 1);
  if (directDbAccessLines > 0) penalties += Math.min(10, directDbAccessLines * 2);

  const healthScore = Math.max(0, Math.round(featureScore + testScore + decoratorScore + crudScore + docScore - penalties));

  // Determine maturity tier
  let tier = 'Skeleton';
  if (totalFeatures >= 500) tier = 'Complete';
  else if (totalFeatures >= 200) tier = 'Competitive';
  else if (totalFeatures >= 50) tier = 'Functional';
  else if (totalFeatures >= 10) tier = 'MVM';

  modules[name] = {
    features: totalFeatures,
    hasTests,
    healthScore,
    tier,
    verbsFound: Array.from(verbsFound),
    eslintBypasses,
    directDbAccessLines,
  };
}

// Compute cumulative statistics
const totalFeatures = Object.values(modules).reduce((sum, m) => sum + m.features, 0);
const moduleCount = apiModuleNames.length;
const skeletonCount = Object.values(modules).filter(m => m.tier === 'Skeleton').length;
const mvmCount = Object.values(modules).filter(m => m.tier === 'MVM').length;
const functionalCount = Object.values(modules).filter(m => m.tier === 'Functional').length;
const competitiveCount = Object.values(modules).filter(m => m.tier === 'Competitive').length;
const completeCount = Object.values(modules).filter(m => m.tier === 'Complete').length;
const overallCompletionPercent = ((totalFeatures / (moduleCount * 500)) * 100).toFixed(1);

// Generate progress dashboard markdown
const dashboardMarkdown = [
  '## System Progress Dashboard',
  '',
  `*Generated on: ${new Date().toISOString()}*`,
  '',
  '| Metric | Value | Target | Progress |',
  '|:---|:---|:---|:---|',
  `| **Total Features** | ${totalFeatures} | ${moduleCount * 500} | ${overallCompletionPercent}% |`,
  `| **Modules in Skeleton (<10)** | ${skeletonCount} | 0 | - |`,
  `| **Modules at MVM (10-50)** | ${mvmCount} | 0 | - |`,
  `| **Modules at Functional (50-200)** | ${functionalCount} | 0 | - |`,
  `| **Modules at Competitive (200-500)** | ${competitiveCount} | 0 | - |`,
  `| **Modules at Complete (500+)** | ${completeCount} | ${moduleCount} | ${(completeCount / moduleCount * 100).toFixed(1)}% |`,
  `| **Average Features per Module** | ${Math.round(totalFeatures / moduleCount)} | 500 | ${(totalFeatures / moduleCount / 500 * 100).toFixed(1)}% |`,
  '',
  '### Module Health List',
  '',
  '| Module | Features | Health Score | Maturity Tier | Tests | Status |',
  '|:---|---:|---:|:---|:---|:---|',
  ...Object.entries(modules).map(([mName, m]) => {
    let statusIcon = '🔴';
    if (m.tier === 'Complete') statusIcon = '👑';
    else if (m.tier === 'Competitive') statusIcon = '🟢';
    else if (m.tier === 'Functional') statusIcon = '🟡';
    else if (m.tier === 'MVM') statusIcon = '🔵';

    return `| \`${mName}\` | ${m.features} | ${m.healthScore}/100 | ${m.tier} | ${m.hasTests ? '✅' : '❌'} | ${statusIcon} |`;
  }),
  ''
].join('\n');

console.log('\n======================================================');
console.log('                 UNIERP MODULE HEALTH REPORT');
console.log('======================================================');
console.log(`Total Features: ${totalFeatures} / ${moduleCount * 500} (${overallCompletionPercent}%)`);
console.log(`Complete (500+): ${completeCount} | Competitive (200-500): ${competitiveCount}`);
console.log(`Functional (50-200): ${functionalCount} | MVM (10-50): ${mvmCount} | Skeleton (<10): ${skeletonCount}`);
console.log('======================================================\n');

// 2. Inject or update the dashboard in MODULE_REGISTRY.md
if (registryContent) {
  // Let's find if "## System Progress Dashboard" exists.
  const startMarker = '## System Progress Dashboard';
  const endMarker = '## Collab Board'; // We target the next major section

  const startIndex = registryContent.indexOf(startMarker);
  const endIndex = registryContent.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const updatedContent = registryContent.slice(0, startIndex) +
                           dashboardMarkdown + '\n' +
                           registryContent.slice(endIndex);
    writeFileSync(registryPath, updatedContent, 'utf8');
    console.log(`Updated System Progress Dashboard in ${registryPath}`);
  } else {
    // If not found, let's prepend it before Collab Board
    const collabIndex = registryContent.indexOf('## Collab Board');
    if (collabIndex !== -1) {
      const updatedContent = registryContent.slice(0, collabIndex) +
                             dashboardMarkdown + '\n' +
                             registryContent.slice(collabIndex);
      writeFileSync(registryPath, updatedContent, 'utf8');
      console.log(`Injected System Progress Dashboard in ${registryPath}`);
    } else {
      console.warn('Could not locate standard headers in MODULE_REGISTRY.md to auto-inject dashboard.');
    }
  }
} else {
  console.warn('MODULE_REGISTRY.md not found or empty.');
}
