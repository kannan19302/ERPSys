const fs = require('fs');
const path = require('path');

const files = [
  'modules/page.tsx', 
  'logic/page.tsx', 
  'forms/page.tsx'
].map(f => path.join('apps/web/app/(dashboard)/builder/erp', f))
.concat([
  'pages/page.tsx', 
  'blog/page.tsx', 
  'templates/page.tsx', 
  'menus/page.tsx', 
  'seo/page.tsx', 
  'assets/page.tsx'
].map(f => path.join('apps/web/app/(dashboard)/builder/web', f)));

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/\/\* eslint-disable \*\/\r?\n/g, '')
               .replace(/\/\/ @ts-nocheck\r?\n/g, '');
    fs.writeFileSync(f, text);
    console.log(`Processed ${f}`);
  } else {
    console.log(`Not found ${f}`);
  }
});
