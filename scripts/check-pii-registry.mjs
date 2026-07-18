#!/usr/bin/env node
// Track H.1: PII-declaration control. Any Prisma model with a PII-pattern
// field MUST have a treatment declared in scripts/pii-registry.json.
// Fails CI when a new PII-carrying model lacks a declaration, or the
// registry names a model that no longer exists.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(path.join(root, 'packages', 'database', 'prisma', 'schema.prisma'), 'utf8');
const registry = JSON.parse(readFileSync(path.join(root, 'scripts', 'pii-registry.json'), 'utf8'));

const PII_FIELD = /^(email|phone|mobile|firstName|lastName|fullName|dateOfBirth|dob|ssn|taxId|passport|nationalId|iban|bankAccount|salary|address(Line)?\d?|street|city|zip|postalCode)$/i;
const VALID_TREATMENTS = new Set(['erase', 'anonymize', 'retain-legal-hold']);

let model = null;
const piiModels = new Map();
for (const rawLine of schema.split(/\r?\n/)) {
  const open = rawLine.match(/^model\s+(\w+)\s*\{/);
  if (open) {
    model = open[1];
    continue;
  }
  if (rawLine.trim() === '}') {
    model = null;
    continue;
  }
  const field = model && rawLine.trim().match(/^(\w+)\s+(String|DateTime|Decimal|Int)/);
  if (field && PII_FIELD.test(field[1])) {
    if (!piiModels.has(model)) piiModels.set(model, []);
    piiModels.get(model).push(field[1]);
  }
}

const declared = new Set(Object.keys(registry.models));
const errors = [];

for (const [name, fields] of piiModels) {
  if (!declared.has(name)) {
    errors.push(`UNDECLARED PII model "${name}" (fields: ${fields.join(', ')}) — add it to scripts/pii-registry.json with a treatment`);
  }
}
for (const [name, entry] of Object.entries(registry.models)) {
  if (!VALID_TREATMENTS.has(entry.treatment)) {
    errors.push(`"${name}": invalid treatment "${entry.treatment}" (use erase | anonymize | retain-legal-hold)`);
  }
  if (!new RegExp(`^model\\s+${name}\\s*\\{`, 'm').test(schema)) {
    errors.push(`registry entry "${name}" has no matching model in schema.prisma — remove or rename it`);
  }
}

if (errors.length > 0) {
  console.error('PII registry check failed (Track H.1):');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`PII registry check passed — ${piiModels.size} PII-carrying model(s), all declared.`);
