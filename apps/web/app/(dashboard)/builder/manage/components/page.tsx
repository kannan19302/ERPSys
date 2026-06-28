'use client';

import React, { useState } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Package, Search, Sparkles } from 'lucide-react';

export default function ComponentLibraryPage() {
  const [search, setSearch] = useState<string>('');
  
  const components = [
    { name: 'Double Entry Ledger Hook', type: 'Workflow Block', desc: 'Sync payments automatically to chart of accounts ledger.', category: 'Finance' },
    { name: 'Intake Registration Template', type: 'Form template', desc: 'Pre-filled customer intake fields with standard GDPR checks.', category: 'CRM' },
    { name: 'depreciation_monthly', type: 'JS Isolate block', desc: 'Calculate asset monthly decline using standard line formulas.', category: 'Automations' },
    { name: 'Approve Leave Request Chain', type: 'Workflow template', desc: 'Standard sequential multi-level employee leave validation path.', category: 'HR' },
    { name: 'Billing Address Validator', type: 'Form action', desc: 'Verify billing details format matching USPS regulations.', category: 'Sales' }
  ];

  const columns = [
    { key: 'name', header: 'Component Name' },
    { key: 'type', header: 'Type' },
    { key: 'desc', header: 'Description' },
    { 
      key: 'category',
      header: 'Category', 
      render: (row: any) => (
        <span className="frappe-badge">
          {row.category}
        </span>
      )
    }
  ];

  const filtered = components.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Component & Template Library" 
        description="Browse shared templates, common workflows, form presets and automation scripts across all custom applications."
      />

      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
        <input 
          className="frappe-input" 
          placeholder="Search templates & components..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ paddingLeft: 30 }}
        />
      </div>

      <div className="frappe-card">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
