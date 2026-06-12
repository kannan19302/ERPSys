const fs = require('fs');
const path = require('path');

const DIR_TO_PROCESS = path.join(__dirname, '../apps/web/app/(dashboard)');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Remove <Plus size={...} /> or <PlusCircle size={...} /> when next to text in a button
  // E.g. `<Plus size={16} /> Create Invoice` -> `Create Invoice`
  newContent = newContent.replace(/<Plus(?:Circle)?\s+size=\{[0-9]+\}\s*\/>\s*/g, '');
  newContent = newContent.replace(/<Filter\s+size=\{[0-9]+\}\s*\/>\s*(Filter)/g, '$1');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Cleaned icons in: ${filePath.replace(__dirname, '')}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

console.log("Starting Hicks Law Icon Cleanup...");
walkDir(DIR_TO_PROCESS);
console.log("Cleanup Complete.");
