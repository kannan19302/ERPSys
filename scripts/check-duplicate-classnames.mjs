import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT, 'apps', 'web', 'app', '(dashboard)');

function getTsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getTsxFiles(DASHBOARD_DIR);
let count = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  
  let index = 0;
  while (index < content.length) {
    const startIdx = content.indexOf('<', index);
    if (startIdx === -1) break;
    
    const nextChar = content.charAt(startIdx + 1);
    if (!/[a-zA-Z]/.test(nextChar)) {
      index = startIdx + 1;
      continue;
    }
    
    // Find matching '>' ignoring content in braces or quotes
    let endIdx = -1;
    let inQuotes = false;
    let quoteChar = '';
    let braceCount = 0;
    
    // We want to capture the attributes content of this tag, excluding any JSX blocks in attributes
    let attributeString = '';
    
    for (let i = startIdx + 1; i < content.length; i++) {
      const char = content.charAt(i);
      
      if (inQuotes) {
        if (char === quoteChar && content.charAt(i - 1) !== '\\') {
          inQuotes = false;
        }
      } else if (char === '"' || char === "'" || char === '`') {
        inQuotes = true;
        quoteChar = char;
        attributeString += char;
      } else if (char === '{') {
        braceCount++;
        // We omit the content inside the braces from attributeString to avoid nested JSX classNames
      } else if (char === '}') {
        braceCount--;
      } else if (char === '>' && braceCount === 0) {
        endIdx = i;
        break;
      } else {
        if (braceCount === 0) {
          attributeString += char;
        }
      }
    }
    
    if (endIdx !== -1) {
      // Check duplicate className in the stripped attribute string
      const classNameMatches = attributeString.match(/className\s*=\s*/g);
      if (classNameMatches && classNameMatches.length > 1) {
        const relPath = path.relative(DASHBOARD_DIR, file);
        console.log(`⚠️ Duplicate className in ${relPath}:`);
        console.log(`   Tag: ${content.substring(startIdx, endIdx + 1).trim().substring(0, 150)}...\n`);
        count++;
      }
      index = endIdx + 1;
    } else {
      index = startIdx + 1;
    }
  }
}

console.log(`Scan complete. Found ${count} tags with duplicate className attributes.`);
if (count > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
