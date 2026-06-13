const fs = require('fs');

const file = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/advanced-finance.service.spec.ts';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(/\(prisma as Record<string, Record<string, import\("vitest"\)\.Mock>>\)/g, '(prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)');
content = content.replace(/\(service as Record<string, import\("vitest"\)\.Mock>\)/g, '(service as unknown as Record<string, import("vitest").Mock>)');
content = content.replace(/\]\.find/g, ']!.find');
content = content.replace(/\]\.create/g, ']!.create');
content = content.replace(/\]\.update/g, ']!.update');
content = content.replace(/\]\[method\]\(/g, ']![method]!(');
fs.writeFileSync(file, content);

const file2 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/advanced-finance.controller.spec.ts';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/\(controller as unknown as Record<string, Function>\)\[method\]!\(/g, '(controller as unknown as Record<string, import("vitest").Mock>)[method]!(');
content2 = content2.replace(/\(service as Record<string, import\("vitest"\)\.Mock>\)/g, '(service as unknown as Record<string, import("vitest").Mock>)');
fs.writeFileSync(file2, content2);
console.log('Fixed pass 7');
