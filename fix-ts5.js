const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

const dir = path.join(__dirname, 'apps', 'api', 'src');

// advanced-finance.controller.spec.ts
replaceInFile(path.join(dir, 'modules', 'advanced-finance', 'tests', 'advanced-finance.controller.spec.ts'), [
  [/const service = (\{[\s\S]*?\}) as unknown as Record<string, import\("vitest"\)\.Mock>;/g, 'const service = $1 as unknown as AdvancedFinanceService;'],
  [/\(service as never\)\[method\]/g, '(service as Record<string, import("vitest").Mock>)[method]'],
  [/service\[method\]/g, '(service as Record<string, import("vitest").Mock>)[method]']
]);

// advanced-finance.service.spec.ts
replaceInFile(path.join(dir, 'modules', 'advanced-finance', 'tests', 'advanced-finance.service.spec.ts'), [
  [/\(prisma as never\)\[key\]/g, '(prisma as Record<string, Record<string, import("vitest").Mock>>)[key]'],
  [/\(service as never\)\[method\]/g, '(service as Record<string, import("vitest").Mock>)[method]']
]);

// api-platform.service.ts
replaceInFile(path.join(dir, 'modules', 'api-platform', 'api-platform.service.ts'), [
  [/events: JSON\.stringify\(dto\.events\) as unknown,/g, 'events: JSON.stringify(dto.events) as never,']
]);

// finance.controller.spec.ts
replaceInFile(path.join(dir, 'modules', 'finance', 'tests', 'finance.controller.spec.ts'), [
  [/service = \{[\s\S]*?\} as unknown as Record<string, import\("vitest"\)\.Mock>;/g, 'service = { getInvoices: vi.fn(), createInvoice: vi.fn(), createPayment: vi.fn() } as unknown as FinanceService;'],
  [/const dto: CreateInvoiceInput = \{\} as unknown as Record<string, import\("vitest"\)\.Mock>;/g, 'const dto = {} as never;'],
  [/const dto: CreatePaymentInput = \{\} as unknown as Record<string, import\("vitest"\)\.Mock>;/g, 'const dto = {} as never;'],
  [/import \{ CreateInvoiceInput, CreatePaymentInput \} from '@unerp\/shared';\n/g, '']
]);

// finance.service.spec.ts
replaceInFile(path.join(dir, 'modules', 'finance', 'tests', 'finance.service.spec.ts'), [
  [/defaultDto as unknown/g, 'defaultDto as never']
]);

// saas.service.ts
replaceInFile(path.join(dir, 'modules', 'saas', 'saas.service.ts'), [
  [/const tenantId = \(session as Record<string, unknown>\)\.client_reference_id;/g, 'const tenantId = (session as Record<string, unknown>).client_reference_id as string;'],
  [/const stripePriceId = \(\(session as Record<string, unknown>\)\.metadata as Record<string, unknown>\)\?\.stripePriceId;/g, 'const stripePriceId = ((session as Record<string, unknown>).metadata as Record<string, unknown>)?.stripePriceId as string;']
]);

console.log('Fixed typescript issues pass 5');
