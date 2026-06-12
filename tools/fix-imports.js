const fs = require('fs');

const files = [
  'apps/web/app/(dashboard)/admin/api-keys/page.tsx',
  'apps/web/app/(dashboard)/admin/localization/page.tsx',
  'apps/web/app/(dashboard)/admin/users/page.tsx',
  'apps/web/app/(dashboard)/analytics/advanced/page.tsx',
  'apps/web/app/(dashboard)/analytics/page.tsx',
  'apps/web/app/(dashboard)/communication/page.tsx',
  'apps/web/app/(dashboard)/crm/page.tsx',
  'apps/web/app/(dashboard)/documents/page.tsx',
  'apps/web/app/(dashboard)/field-service/page.tsx',
  'apps/web/app/(dashboard)/finance/page.tsx',
  'apps/web/app/(dashboard)/hr/page.tsx',
  'apps/web/app/(dashboard)/inventory/page.tsx',
  'apps/web/app/(dashboard)/procurement/page.tsx',
  'apps/web/app/(dashboard)/projects/page.tsx',
  'apps/web/app/(dashboard)/real-estate/page.tsx',
  'apps/web/app/(dashboard)/sales/page.tsx',
  'apps/web/app/(dashboard)/supply-chain/page.tsx'
];

files.forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\bPlus\b\s*,?/g, '');
  c = c.replace(/\bFilter\b\s*,?/g, '');
  c = c.replace(/\bPlusCircle\b\s*,?/g, '');
  fs.writeFileSync(p, c);
});
console.log('Fixed unused imports');
