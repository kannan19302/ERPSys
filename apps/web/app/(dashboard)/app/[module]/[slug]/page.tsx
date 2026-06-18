'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DynamicFormRenderer } from '@/components/builder/DynamicFormRenderer';
import { useToast } from '@/components/builder/ToastProvider';

export default function CustomAppPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const moduleName = params.module as string;
  const slug = params.slug as string;
  
  const [mapping, setMapping] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/page-registries/${moduleName}/${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setMapping(data);
        } else {
          setMapping(null);
        }
      } catch (err) {
        if (isMounted) setMapping(null);
      }
    }
    loadPage();
    return () => { isMounted = false; };
  }, [moduleName, slug]);

  const handleSubmit = async (data: any) => {
    try {
      if (!mapping || !mapping.schemaId) {
         showToast('Schema ID is missing. Cannot save custom record.', 'error');
         return;
      }
      
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/custom-records/${mapping.schemaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        showToast('Form saved successfully!', 'success');
        router.push(`/${moduleName.toLowerCase()}`);
      } else {
        const errorData = await res.json();
        showToast(`Failed to save data: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
       console.error(err);
       showToast('An error occurred while saving', 'error');
    }
  };

  if (mapping === undefined) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading dynamic page...</div>;
  }

  if (mapping === null) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-danger)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-text-tertiary)' }}>This custom page does not exist or was removed.</p>
        <button 
          onClick={() => router.back()} 
          className="frappe-btn frappe-btn-secondary" 
          style={{ marginTop: 'var(--space-4)' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const parsedLayout = typeof mapping.layout === 'string' ? JSON.parse(mapping.layout) : mapping.layout;
  const formFields = Array.isArray(parsedLayout) ? parsedLayout : parsedLayout?.fields || [];
  const listColumns = formFields.filter((f: any) => f.inListView).slice(0, 6); // Max 6 columns
  if (listColumns.length === 0 && formFields.length > 0) {
    // Default to first 3 data fields if none selected
    listColumns.push(...formFields.filter((f: any) => f.type === 'Data' || f.type === 'Select').slice(0, 3));
  }

  const [view, setView] = useState<'list' | 'form'>('list');
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (view === 'list' && mapping?.schemaId) {
       setLoadingRecords(true);
       const token = localStorage.getItem('token') || '';
       fetch(`/api/v1/builder/custom-records/${mapping.schemaId}`, { headers: { 'Authorization': `Bearer ${token}` } })
         .then(res => res.json())
         .then(data => {
            setRecords(Array.isArray(data) ? data : data.data || []);
            setLoadingRecords(false);
         })
         .catch(() => setLoadingRecords(false));
    }
  }, [view, mapping]);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>
            {mapping.title}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            {mapping.schemaRegistry?.description || `Custom form for ${mapping.module} module`}
          </p>
        </div>
        <div>
          {view === 'list' ? (
             <button className="frappe-btn frappe-btn-primary" onClick={() => setView('form')}>
                + New {mapping.title}
             </button>
          ) : (
             <button className="frappe-btn frappe-btn-secondary" onClick={() => setView('list')}>
                Back to List
             </button>
          )}
        </div>
      </div>
      
      {view === 'list' ? (
         <div className="frappe-card">
           {loadingRecords ? (
             <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading records...</div>
           ) : records.length === 0 ? (
             <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>No records found.</p>
                <button className="frappe-btn frappe-btn-primary" onClick={() => setView('form')}>Create First Record</button>
             </div>
           ) : (
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                 <thead>
                   <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                     <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>ID</th>
                     {listColumns.map((col: any) => (
                        <th key={col.name} style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{col.label}</th>
                     ))}
                     <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Created</th>
                   </tr>
                 </thead>
                 <tbody>
                   {records.map((row: any) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => showToast('Edit coming soon', 'warning')}>
                         <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{row.id.substring(0, 8)}</td>
                         {listColumns.map((col: any) => (
                            <td key={col.name} style={{ padding: 'var(--space-3) var(--space-4)' }}>
                               {typeof row.data[col.name] === 'object' ? JSON.stringify(row.data[col.name]) : String(row.data[col.name] || '-')}
                            </td>
                         ))}
                         <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--color-text-tertiary)' }}>
                            {new Date(row.createdAt).toLocaleDateString()}
                         </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      ) : (
        <DynamicFormRenderer 
          schema={formFields} 
          onSubmit={async (data) => {
             await handleSubmit(data);
             setView('list');
          }} 
        />
      )}
    </div>
  );
}
