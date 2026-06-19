const fs = require('fs');
const f = 'apps/web/app/(dashboard)/builder/web/pages/page.tsx';
let text = fs.readFileSync(f, 'utf8');

text = text.replace(/\/\* eslint-disable \*\/\r?\n/g, '').replace(/\/\/ @ts-nocheck\r?\n/g, '');

if (!text.includes('useBuilderData')) {
    text = text.replace(
        "import React, { useState } from 'react';", 
        "import React, { useState } from 'react';\nimport { useBuilderData } from '@/lib/hooks/useBuilderData';\nimport { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';"
    );
}

text = text.replace(
    "const [isModalOpen, setIsModalOpen] = useState(false);",
    "const { data: PAGES_DB, createItem, updateItem, deleteItem } = useBuilderData('web-pages', PAGES_LIST);\n  const [isModalOpen, setIsModalOpen] = useState(false);"
);

text = text.replace(
    "const filtered = PAGES_LIST.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));",
    "const filtered = PAGES_DB.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));"
);

text = text.replace(
    "const handleSave = async (data: any) => {\r\n    console.log('Saving', data);\r\n    setIsModalOpen(false);\r\n  };",
    "const handleSave = async (data: any) => {\n    if (editingItem) await updateItem(editingItem.id, data);\n    else await createItem(data);\n    setIsModalOpen(false);\n  };\n\n  const handleDelete = async (id: any) => {\n    if (confirm('Are you sure you want to delete this page?')) await deleteItem(id);\n  };"
);

text = text.replace(
    "const handleSave = async (data: any) => {\n    console.log('Saving', data);\n    setIsModalOpen(false);\n  };",
    "const handleSave = async (data: any) => {\n    if (editingItem) await updateItem(editingItem.id, data);\n    else await createItem(data);\n    setIsModalOpen(false);\n  };\n\n  const handleDelete = async (id: any) => {\n    if (confirm('Are you sure you want to delete this page?')) await deleteItem(id);\n  };"
);

text = text.replace(
    /PAGES_LIST\[0\]/g,
    "PAGES_DB[0]"
);

text = text.replace(
    /<button onClick=\{\(\) => \{ \/\* Delete section \*\/ \}\} className="frappe-btn" style=\{\{ padding: '4px 8px', background: 'transparent', border: '1px solid var\(--color-border\)', color: 'var\(--color-danger\)' \}\}>\r?\n\s*<Trash2 size=\{11\} \/>\r?\n\s*<\/button>/g,
    "<button onClick={() => handleDelete(page.id)} className=\"frappe-btn\" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>\n                        <Trash2 size={11} />\n                      </button>"
);

text = text.replace(
    /<\/div>\r?\n\s*<\/div>\r?\n\s*\);\r?\n\}/g,
    "</div>\n\n      <GenericBuilderModal\n        isOpen={isModalOpen}\n        onClose={() => setIsModalOpen(false)}\n        onSubmit={handleSave}\n        title={editingItem ? 'Edit Page' : 'Create New Page'}\n        fields={[{ name: 'name', label: 'Page Name', type: 'text', required: true }, { name: 'slug', label: 'Slug', type: 'text', required: true }]}\n        initialData={editingItem}\n      />\n    </div>\n  );\n}"
);

fs.writeFileSync(f, text);
console.log('Patched');
