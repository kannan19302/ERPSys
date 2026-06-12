const fs = require('fs');
let c = fs.readFileSync('apps/web/app/(dashboard)/layout.tsx', 'utf8');
c = c.replace(/\s*switchAppItem,/g, '');
fs.writeFileSync('apps/web/app/(dashboard)/layout.tsx', c);
console.log('Removed switchAppItem references.');
