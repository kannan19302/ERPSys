const fs = require('fs');

const file = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/advanced-finance.controller.ts';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(/req\.user\.orgId/g, "(req.user.orgId || 'org-system-default')");
// wait, if I replace all req.user.orgId with (req.user.orgId || 'org-system-default'), I might end up with ((req.user.orgId || 'org-system-default') || 'org-system-default').
content = content.replace(/req\.user\.orgId \|\| 'org-system-default'/g, "req.user.orgId"); // revert
content = content.replace(/req\.user\.orgId/g, "(req.user.orgId || 'org-system-default')"); // replace all
fs.writeFileSync(file, content);

const file2 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/advanced-finance.service.spec.ts';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/\)\[key\]!\.findMany\)/g, ')[key]!.findMany!)');
content2 = content2.replace(/\)\[key\]!\.create\)/g, ')[key]!.create!)');
content2 = content2.replace(/\)\[key\]!\.findFirst\)/g, ')[key]!.findFirst!)');
content2 = content2.replace(/\)\[key\]!\.update\)/g, ')[key]!.update!)');
fs.writeFileSync(file2, content2);

console.log('Fixed pass 9');
