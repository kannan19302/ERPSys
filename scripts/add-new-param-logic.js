const fs = require('fs');
const path = require('path');

const pages = [
  'erp/forms/page.tsx',
  'erp/workflows/page.tsx',
  'erp/dashboards/page.tsx',
  'erp/modules/page.tsx',
  'web/pages/page.tsx',
  'web/assets/page.tsx',
  'web/templates/page.tsx',
  'web/seo/page.tsx'
];

const basePath = path.join(__dirname, '../apps/web/app/(dashboard)/builder');

pages.forEach(page => {
  const filePath = path.join(basePath, page);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', filePath);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has searchParams logic
  if (content.includes("searchParams?.get('new')")) {
    console.log('Already updated:', page);
    return;
  }

  // 1. Import useSearchParams
  if (content.includes("import { useRouter } from 'next/navigation'")) {
    content = content.replace("import { useRouter } from 'next/navigation'", "import { useRouter, useSearchParams } from 'next/navigation'");
  } else if (!content.includes('useSearchParams')) {
    content = content.replace("from 'next/navigation';", "from 'next/navigation';\nimport { useSearchParams } from 'next/navigation';");
  }

  // 2. Add useSearchParams hook and useEffect inside component
  // Find "export default function"
  const compRegex = /export default function\s+\w+\(\)\s*\{/;
  const match = content.match(compRegex);
  if (match) {
    const insertPos = match.index + match[0].length;
    
    const codeToInsert = `
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);
`;
    content = content.slice(0, insertPos) + codeToInsert + content.slice(insertPos);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', page);
  } else {
    console.log('Could not find component declaration in', page);
  }
});
