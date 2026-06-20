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
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Extract the inserted block
  const block = `  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);\n`;

  if (content.includes(block)) {
    // Remove the block
    content = content.replace(block, '');
    
    // Find where isModalOpen is declared
    const hookLineRegex = /const \[editingItem, setEditingItem\] = useState<any>\(null\);/g;
    const match = hookLineRegex.exec(content);
    if (match) {
      const insertPos = match.index + match[0].length;
      content = content.slice(0, insertPos) + '\n\n' + block + content.slice(insertPos);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', page);
    } else {
      console.log('Could not find hook declaration in:', page);
    }
  }
});
