const fs = require('fs');

const file = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/advanced-finance.service.spec.ts';
let content = fs.readFileSync(file, 'utf-8');
// Fix possibly undefined: add ! after key and after method
content = content.replace(/\)\[key\]!\.find/g, ')[key]!.find');
content = content.replace(/\]\[method\]\(/g, ']![method]!(');
content = content.replace(/\]\[method\]\(/g, ']![method]!(');
content = content.replace(/\]\('tenant-123'\)/g, ']!("tenant-123")');
content = content.replace(/\)\[method\]\(\.\.\.args\)/g, ')[method]!(...args)');
content = content.replace(/\)\[method\]\(\.\.\.modifiedArgs\)/g, ')[method]!(...modifiedArgs)');

fs.writeFileSync(file, content);

const file2 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/tests/advanced-finance.controller.spec.ts';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/mocks\[prop\]/g, '(mocks as Record<string, any>)[prop]'.replace('any', 'unknown'));
content2 = content2.replace(/new AdvancedFinanceController\(service\)/g, 'new AdvancedFinanceController(service as never)');
content2 = content2.replace(/\(controller as never\)\[method\]/g, '(controller as unknown as Record<string, Function>)[method]!');
content2 = content2.replace(/expect\(service\.getProfitAndLoss\)/g, 'expect((service as unknown as Record<string, Function>).getProfitAndLoss)');
content2 = content2.replace(/expect\(service\.getBalanceSheet\)/g, 'expect((service as unknown as Record<string, Function>).getBalanceSheet)');
content2 = content2.replace(/expect\(service\.getCashFlow\)/g, 'expect((service as unknown as Record<string, Function>).getCashFlow)');
content2 = content2.replace(/await controller\.getProfitAndLoss\(mockReq, 'start', 'end'\);/g, 'await controller.getProfitAndLoss(mockReq as never, "start", "end");');
content2 = content2.replace(/await controller\.getBalanceSheet\(mockReq, 'date'\);/g, 'await controller.getBalanceSheet(mockReq as never, "date");');
content2 = content2.replace(/await controller\.getCashFlow\(mockReq, 'start', 'end'\);/g, 'await controller.getCashFlow(mockReq as never, "start", "end");');
content2 = content2.replace(/expect\(service\[method\]\)/g, 'expect((service as unknown as Record<string, Function>)[method])');
fs.writeFileSync(file2, content2);

const file3 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/treasury/treasury.service.ts'; // Wait, the error was in api-platform.service.ts
const file4 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/api-platform/api-platform.service.ts';
let content4 = fs.readFileSync(file4, 'utf-8');
content4 = content4.replace(/events: JSON\.stringify\(dto\.events\) as unknown,/g, 'events: JSON.stringify(dto.events) as never,');
fs.writeFileSync(file4, content4);

const file5 = 'c:/Users/kanna/OneDrive/Documents/Antigravity/ERPSys/apps/api/src/modules/advanced-finance/advanced-finance.service.ts';
let content5 = fs.readFileSync(file5, 'utf-8');
content5 = content5.replace(/data: \{ \.\.\.\(dto as Record<string, unknown>\), tenantId, orgId: resolvedOrgId \}/g, 'data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never');
fs.writeFileSync(file5, content5);

console.log('Fixed pass 8');
