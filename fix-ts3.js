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
  if (!filePath.endsWith('.spec.ts')) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace Record<string, unknown> with never for all mock return values
  content = content.replace(/as unknown as Record<string, unknown>/g, 'as never');

  // But if it's mocking a service or object that has properties called on it, 
  // 'never' will throw "Property ... does not exist on type 'never'"
  // We can change 'as never' to 'as unknown as Record<string, jest.Mock>' for those
  content = content.replace(/const service\s*=\s*(\{[\s\S]*?\})\s*as never/g, 'const service = $1 as unknown as Record<string, import("vitest").Mock>');
  content = content.replace(/const mocks\s*=\s*(\{[\s\S]*?\})\s*as never/g, 'const mocks = $1 as unknown as Record<string, import("vitest").Mock>');

  // In advanced-finance.service.spec.ts, it was:
  // prisma.user = { findMany: vi.fn() } as never;
  content = content.replace(/(\w+)\s*=\s*(\{[\s\S]*?\})\s*as never;/g, '$1 = $2 as unknown as Record<string, import("vitest").Mock>;');

  // advanced-finance controller tests specific:
  content = content.replace(/as unknown as AdvancedFinanceService/g, 'as never'); // wait, if it was manually casted, leave it alone.
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

walkDir(path.join(__dirname, 'apps', 'api', 'src'), fixFile);
console.log('Fixed typescript mock issues pass 3');
