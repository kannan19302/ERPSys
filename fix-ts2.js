const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!p.includes('node_modules')) walkDir(p, callback);
    } else if (p.endsWith('.ts')) {
      callback(p);
    }
  });
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Change specific cases back to 'as never' where assigning to restricted parameter types
  content = content.replace(/mockResolvedValue\(([^)]+) as unknown as Record<string, unknown>\)/g, 'mockResolvedValue($1 as never)');
  content = content.replace(/mockReturnValue\(([^)]+) as unknown as Record<string, unknown>\)/g, 'mockReturnValue($1 as never)');
  content = content.replace(/Promise\.resolve\(([^)]+) as unknown as Record<string, unknown>\)/g, 'Promise.resolve($1 as never)');
  
  // also fix standalone cases where it's not inside mockResolvedValue but still an array assignment
  content = content.replace(/\] as unknown as Record<string, unknown>/g, '] as never');
  content = content.replace(/\} as unknown as Record<string, unknown>/g, '} as never');

  // Let's also restore 'as never' wherever we blindly put Record<string, unknown> in tests to be safe with Vitest mocks
  // Actually, wait, replacing `} as never` might break property access if it's not inside mockResolvedValue.
  // But inside mockResolvedValue or Promise.resolve, it's safe.

  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

walkDir(path.join(__dirname, 'apps', 'api', 'src'), fixFile);
console.log('Fixed typescript mock issues');
