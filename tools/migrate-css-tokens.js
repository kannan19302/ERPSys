const fs = require('fs');
const path = require('path');

const DIR_TO_PROCESS = path.join(__dirname, '../apps/web/app/(dashboard)');

// Helper for exact string replacement globally
function replaceAll(str, mapObj) {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(Object.keys(mapObj).map(escapeRegExp).join('|'), 'gi');
  
  // Create a lowercase version of the map keys for lookup
  const lowerMapObj = {};
  for (const key in mapObj) {
    lowerMapObj[key.toLowerCase()] = mapObj[key];
  }

  return str.replace(regex, function(matched) {
    return lowerMapObj[matched.toLowerCase()];
  });
}

// Map of replacements to perform
const REPLACEMENTS = {
  // Border Radius
  "borderRadius: '4px'": "borderRadius: 'var(--radius-sm)'",
  'borderRadius: "4px"': 'borderRadius: "var(--radius-sm)"',
  "borderRadius: '8px'": "borderRadius: 'var(--radius-md)'",
  'borderRadius: "8px"': 'borderRadius: "var(--radius-md)"',
  "borderRadius: '12px'": "borderRadius: 'var(--radius-lg)'",
  'borderRadius: "12px"': 'borderRadius: "var(--radius-lg)"',
  "borderRadius: '16px'": "borderRadius: 'var(--radius-xl)'",
  'borderRadius: "16px"': 'borderRadius: "var(--radius-xl)"',
  
  // Padding combinations
  "padding: '2px 8px'": "padding: 'var(--space-1) var(--space-2)'",
  "padding: '4px 10px'": "padding: 'var(--space-1) var(--space-2.5)'",
  "padding: '4px 8px'": "padding: 'var(--space-1) var(--space-2)'",
  "padding: '2px 6px'": "padding: 'var(--space-1) var(--space-1.5)'",
  "padding: '6px 12px'": "padding: 'var(--space-1.5) var(--space-3)'",
  
  // Single spacing properties (padding, gap, margins)
  "padding: '4px'": "padding: 'var(--space-1)'",
  "padding: '8px'": "padding: 'var(--space-2)'",
  "padding: '12px'": "padding: 'var(--space-3)'",
  "padding: '16px'": "padding: 'var(--space-4)'",
  "padding: '24px'": "padding: 'var(--space-6)'",
  "padding: '32px'": "padding: 'var(--space-8)'",

  "gap: '4px'": "gap: 'var(--space-1)'",
  "gap: '8px'": "gap: 'var(--space-2)'",
  "gap: '12px'": "gap: 'var(--space-3)'",
  "gap: '16px'": "gap: 'var(--space-4)'",
  
  "marginTop: '4px'": "marginTop: 'var(--space-1)'",
  "marginBottom: '4px'": "marginBottom: 'var(--space-1)'",
  "marginTop: '8px'": "marginTop: 'var(--space-2)'",
  "marginBottom: '8px'": "marginBottom: 'var(--space-2)'",

  // Colors
  "'#ffffff'": "'var(--color-bg-elevated)'",
  '"#ffffff"': '"var(--color-bg-elevated)"',
  "'#fff'": "'var(--color-bg-elevated)'",
  '"#fff"': '"var(--color-bg-elevated)"',
  
  "'#6366f1'": "'var(--color-primary)'",
  '"#6366f1"': '"var(--color-primary)"',
  
  "'#22c55e'": "'var(--color-success)'",
  '"#22c55e"': '"var(--color-success)"',
  
  "'#f59e0b'": "'var(--color-warning)'",
  '"#f59e0b"': '"var(--color-warning)"',
  
  "'#ef4444'": "'var(--color-danger)'",
  '"#ef4444"': '"var(--color-danger)"',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Apply simple string replacements
  newContent = replaceAll(newContent, REPLACEMENTS);

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated CSS tokens in: ${filePath.replace(__dirname, '')}`);
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

console.log('Starting CSS Token Migration...');
walkDir(DIR_TO_PROCESS);
console.log('Migration Complete.');
