#!/usr/bin/env node
/**
 * generate-module-inventory.mjs — Generates the single filewise module inventory table
 * in .ai/MODULE_REGISTRY.md.
 *
 * Scans every ERP module in the monorepo, calculating:
 * - Module Name & ID
 * - Phase & Status
 * - Endpoint Feature Count
 * - Net Lines of Code (LOC)
 * - UI Files Count (Next.js pages & module components)
 * - API Controller Count (*.controller.ts)
 * - API Service Count (*.service.ts)
 * - API DTO Count (*.dto.ts)
 * - Total Module Files Count
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiModulesDir = path.join(root, 'apps', 'api', 'src', 'modules');
const webAppDir = path.join(root, 'apps', 'web', 'app', '(dashboard)');
const webCompDir = path.join(root, 'apps', 'web', 'src', 'components');

function countFileLines(filePath) {
  try {
    const src = readFileSync(filePath, 'utf8');
    return src.split('\n').length;
  } catch (e) {
    return 0;
  }
}

function scanFiles(dir) {
  let files = [];
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = statSync(p);
    if (stat.isDirectory()) {
      files.push(...scanFiles(p));
    } else {
      files.push(p);
    }
  }
  return files;
}

const moduleMapping = [
  { id: 'finance', name: 'Finance & Accounting', phase: 'Phase 1 — Complete' },
  { id: 'hr', name: 'Human Resources (HRM)', phase: 'Phase 1 — Complete' },
  { id: 'crm', name: 'CRM & Sales Automation', phase: 'Phase 1 — Complete' },
  { id: 'inventory', name: 'Inventory & Stock Management', phase: 'Phase 1 — Complete' },
  { id: 'procurement', name: 'Procurement & Purchasing', phase: 'Phase 2 — Complete' },
  { id: 'sales', name: 'Sales & Order Management', phase: 'Phase 2 — Complete' },
  { id: 'supply-chain', name: 'Supply Chain Management (SCM)', phase: 'Phase 2 — Complete' },
  { id: 'projects', name: 'Project Management & PSA', phase: 'Phase 3 — Complete' },
  { id: 'manufacturing', name: 'Manufacturing (MRP II)', phase: 'Phase 3 — Complete' },
  { id: 'asset-management', name: 'Asset Management (EAM)', phase: 'Phase 4 — Complete' },
  { id: 'quality-management', name: 'Quality Management (QMS)', phase: 'Phase 4 — Complete' },
  { id: 'field-service', name: 'Field Service Management (FSM)', phase: 'Phase 4 — Complete' },
  { id: 'builder', name: 'Builder Studio (No-Code)', phase: 'Phase M — Complete' },
  { id: 'analytics', name: 'Executive Analytics & BI', phase: 'Phase M — Complete' },
  { id: 'communication', name: 'Communication & Connect', phase: 'Phase M — Complete' },
  { id: 'documents', name: 'Document Management (Drive)', phase: 'Phase M — Complete' },
  { id: 'ecommerce', name: 'E-Commerce Platform', phase: 'Phase M — Complete' },
  { id: 'education', name: 'Education & School ERP', phase: 'Phase M — Complete' },
  { id: 'healthcare', name: 'Healthcare & Clinical ERP', phase: 'Phase M — Complete' },
  { id: 'fleet-management', name: 'Fleet Management', phase: 'Phase M — Complete' },
  { id: 'real-estate', name: 'Real Estate & Property', phase: 'Phase M — Complete' },
  { id: 'telecommunications', name: 'Telecom & ISP Management', phase: 'Phase M — Complete' },
  { id: 'pos', name: 'POS & Retail Systems', phase: 'Phase M — Complete' },
  { id: 'blockchain', name: 'Blockchain Audit & Ledger', phase: 'Phase M — Complete' },
  { id: 'saas', name: 'SaaS Platform & Multi-Tenancy', phase: 'Phase M — Complete' },
  { id: 'developer', name: 'Developer Platform & Webhooks', phase: 'Phase M — Complete' },
  { id: 'risk-compliance', name: 'Risk & Compliance (GRC)', phase: 'Phase M — Complete' },
  { id: 'outbox', name: 'Transactional Outbox', phase: 'Foundation — Sealed' },
];

const HTTP = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

const inventoryData = moduleMapping.map((mod) => {
  const apiDir = path.join(apiModulesDir, mod.id);
  const webPageDir = path.join(webAppDir, mod.id);
  const webModuleCompDir = path.join(webCompDir, mod.id);

  const apiFiles = scanFiles(apiDir);
  const uiPageFiles = scanFiles(webPageDir);
  const uiCompFiles = scanFiles(webModuleCompDir);

  const uiFiles = [...uiPageFiles, ...uiCompFiles];
  const allFiles = [...apiFiles, ...uiFiles];

  let controllers = 0;
  let services = 0;
  let dtos = 0;
  let features = 0;
  let netLoc = 0;

  for (const f of allFiles) {
    netLoc += countFileLines(f);
  }

  for (const f of apiFiles) {
    const filename = path.basename(f);
    if (filename.endsWith('.controller.ts')) {
      controllers++;
      const src = readFileSync(f, 'utf8');
      const lines = src.split('\n');
      for (const l of lines) {
        if (HTTP.some((m) => l.includes(`@${m}(`))) {
          features++;
        }
      }
    }
    if (filename.endsWith('.service.ts')) services++;
    if (filename.endsWith('.dto.ts') || f.includes(path.join('dto'))) dtos++;
  }

  return {
    ...mod,
    features,
    netLoc,
    uiFilesCount: uiFiles.length,
    controllerCount: controllers,
    serviceCount: services,
    dtoCount: dtos,
    totalFiles: allFiles.length,
  };
});

let markdownTable = `## 📊 Monorepo Filewise Module Inventory

| Module Name | Phase & Status | Endpoints / Features | Net LOC | UI Files | Controllers | Services | DTO Files | Total Files |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

let totalFeatures = 0;
let totalNetLoc = 0;
let totalUiFiles = 0;
let totalControllers = 0;
let totalServices = 0;
let totalDtos = 0;
let totalFilesSum = 0;

for (const row of inventoryData) {
  markdownTable += `| **${row.name}** (\`${row.id}\`) | ${row.phase} | ${row.features} | ${row.netLoc.toLocaleString()} | ${row.uiFilesCount} | ${row.controllerCount} | ${row.serviceCount} | ${row.dtoCount} | ${row.totalFiles} |\n`;
  totalFeatures += row.features;
  totalNetLoc += row.netLoc;
  totalUiFiles += row.uiFilesCount;
  totalControllers += row.controllerCount;
  totalServices += row.serviceCount;
  totalDtos += row.dtoCount;
  totalFilesSum += row.totalFiles;
}

markdownTable += `| **TOTAL (All 28 Modules)** | **System Total** | **${totalFeatures}** | **${totalNetLoc.toLocaleString()}** | **${totalUiFiles}** | **${totalControllers}** | **${totalServices}** | **${totalDtos}** | **${totalFilesSum}** |\n`;

console.log(markdownTable);

// Update MODULE_REGISTRY.md with the table
const registryPath = path.join(root, '.ai', 'MODULE_REGISTRY.md');
if (existsSync(registryPath)) {
  let registryContent = readFileSync(registryPath, 'utf8');

  const headerMarker = '## 📊 Monorepo Filewise Module Inventory';
  if (registryContent.includes(headerMarker)) {
    const parts = registryContent.split(headerMarker);
    const afterTable = parts[1].slice(parts[1].indexOf('\n\n') + 2);
    registryContent = parts[0] + markdownTable + '\n' + afterTable;
  } else {
    // Insert after dashboard summary section
    registryContent = registryContent.replace(
      '## 📊 Module Dashboard & Status Overview',
      `${markdownTable}\n\n## 📊 Module Dashboard & Status Overview`
    );
  }

  writeFileSync(registryPath, registryContent, 'utf8');
  console.log(`Successfully updated ${registryPath} with latest module inventory!`);
}
