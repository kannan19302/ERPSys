const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${filePath}`);
}

// 1. dashboards/[id]/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/erp/dashboards/[id]/page.tsx', [
    [/GridLayout\.Layout\[\]/g, 'any[]'],
    [/\(layout: Layout\)/g, '(layout: any)'],
    [/import GridLayout from 'react-grid-layout';/g, "import GridLayout from 'react-grid-layout';\nimport type { Layout } from 'react-grid-layout';"]
]);

// 2. forms/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/erp/forms/page.tsx', [
    [/setFormsList/g, '/* setFormsList */']
]);

// 3. logic/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/erp/logic/page.tsx', [
    [/value=\{ruleName\} onChange=\{\(e\) => setRuleName\(e\.target\.value\)\}/g, "defaultValue={editingItem?.name || ''}"]
]);

// 4. modules/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/erp/modules/page.tsx', [
    [/MODULES_LIST_DB\.mutate\(\)/g, "refetch()"]
]);

// 5. erp/page.tsx - move stats inside component if needed
let erpPage = fs.readFileSync('apps/web/app/(dashboard)/builder/erp/page.tsx', 'utf8');
erpPage = erpPage.replace(
    /const \[stats, setStats\] = useState<any>\(null\);\s*React\.useEffect\(\(\) => \{\s*fetch\('\/api\/v1\/builder\/stats', \{ headers: \{ 'Authorization': 'Bearer ' \+ localStorage\.getItem\('token'\) \} \}\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => setStats\(data\.erp\)\)\s*\.catch\(console\.error\);\s*\}, \[\]\);\s*const \[activeTab, setActiveTab\] = useState<'modules' \| 'api'>\('modules'\);/m,
    "const [activeTab, setActiveTab] = useState<'modules' | 'api'>('modules');\n  const [stats, setStats] = useState<any>(null);\n  React.useEffect(() => { fetch('/api/v1/builder/stats', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(res => res.json()).then(data => setStats(data.erp)).catch(console.error); }, []);"
);
fs.writeFileSync('apps/web/app/(dashboard)/builder/erp/page.tsx', erpPage);
console.log('Patched erp/page.tsx');

// 6. workflows/[id]/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/erp/workflows/[id]/page.tsx', [
    [/setSelectedNode\(nds\.find\(\(n\) => n\.id === params\.target\) \? nds\.find\(\(n\) => n\.id === params\.target\) : null\);/g, "setSelectedNode(nds.find((n) => n.id === params.target) || null);"],
    [/setSelectedNode\(nds\.find\(\(n\) => n\.id === params\.source\)/g, "setSelectedNode(nds.find((n) => n.id === params.source) || null"]
]);

// 7. web/pages/page.tsx
replaceInFile('apps/web/app/(dashboard)/builder/web/pages/page.tsx', [
    [/import \{ GenericBuilderModal \} from '@\/components\/builder\/GenericBuilderModal';\r?\nimport \{ useBuilderData \} from '@\/lib\/hooks\/useBuilderData';\r?\n\r?\nimport React, \{ useState \} from 'react';\r?\nimport \{ useRouter \} from 'next\/navigation';\r?\nimport \{\r?\n  Globe,\r?\n  PlusCircle,\r?\n  Search,\r?\n  Edit3,\r?\n  Trash2,\r?\n  Eye,\r?\n  CheckCircle,\r?\n  Monitor,\r?\n  Smartphone,\r?\n  Tablet,\r?\n  Layers,\r?\n  AlignLeft,\r?\n  Image,\r?\n  LayoutGrid,\r?\n  FileText,\r?\n  Tag,\r?\n  ExternalLink,\r?\n  Move,\r?\n  Zap,\r?\n  Type,\r?\n\} from 'lucide-react';\r?\n\r?\nimport React, \{ useState \} from 'react';\r?\nimport \{ useRouter \} from 'next\/navigation';\r?\nimport \{\r?\n  Globe,\r?\n  PlusCircle,\r?\n  Search,\r?\n  Edit3,\r?\n  Trash2,\r?\n  Eye,\r?\n  CheckCircle,\r?\n  Monitor,\r?\n  Smartphone,\r?\n  Tablet,\r?\n  Layers,\r?\n  AlignLeft,\r?\n  Image,\r?\n  LayoutGrid,\r?\n  FileText,\r?\n  Tag,\r?\n  ExternalLink,\r?\n  Move,\r?\n  Zap,\r?\n  Type,\r?\n\} from 'lucide-react';/g, "import React, { useState } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { Globe, PlusCircle, Search, Edit3, Trash2, Eye, CheckCircle, Monitor, Smartphone, Tablet, Layers, AlignLeft, Image, LayoutGrid, FileText, Tag, ExternalLink, Move, Zap, Type } from 'lucide-react';\nimport { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';\nimport { useBuilderData } from '@/lib/hooks/useBuilderData';"]
]);
