'use client';
import styles from './page.module.css';
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
        <span className="ui-badge">
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
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="Component & Template Library" 
        description="Browse shared templates, common workflows, form presets and automation scripts across all custom applications."
      />

      <div className={styles.s1}>
        <Search size={15} className={styles.s3} />
        <input 
          className={`ui-input ${styles.s2}`} 
          placeholder="Search templates & components..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          
        />
      </div>

      <div className="ui-card">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
