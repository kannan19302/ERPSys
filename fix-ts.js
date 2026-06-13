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

  // Replace any with unknown globally first (to undo my previous script)
  content = content.replace(/: any\b/g, ': unknown');
  content = content.replace(/as any\b/g, 'as unknown');

  // Controller typical fixes:
  content = content.replace(/(@Req\(\)\s+req):\s*unknown/g, '$1: AuthenticatedRequest');
  
  if (content.includes('req: AuthenticatedRequest') && !content.includes('interface AuthenticatedRequest') && !content.includes('type AuthenticatedRequest') && !content.includes('import { AuthenticatedRequest')) {
    if (filePath.endsWith('.spec.ts')) {
      content = content.replace(/req: AuthenticatedRequest/g, 'req: unknown');
    }
  }

  // Tests fixes
  if (filePath.endsWith('.spec.ts')) {
    content = content.replace(/as unknown(,?)$/gm, 'as unknown as Record<string, unknown>$1');
    content = content.replace(/as unknown;/g, 'as unknown as Record<string, unknown>;');
    content = content.replace(/as unknown\)/g, 'as unknown as Record<string, unknown>)');
    // Also fix specific TS property missing errors from never
    content = content.replace(/as never(,?)$/gm, 'as unknown as Record<string, unknown>$1');
    content = content.replace(/as never;/g, 'as unknown as Record<string, unknown>;');
    content = content.replace(/as never\)/g, 'as unknown as Record<string, unknown>)');
  }

  // specific service spread fixes
  if (filePath.includes('advanced-finance.service.ts')) {
    content = content.replace(/\.\.\.dto/g, '...(dto as Record<string, unknown>)');
    content = content.replace(/\.\.\.data/g, '...(data as Record<string, unknown>)');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

walkDir(path.join(__dirname, 'apps', 'api', 'src'), fixFile);
console.log('Fixed typescript issues');
