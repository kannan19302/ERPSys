'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { Image, PlusCircle, Search, Trash2, Download, Copy, Upload, Grid3X3, List, FileText, Film, Music, Archive } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  IMAGE: Image,
  VIDEO: Film,
  AUDIO: Music,
  DOCUMENT: FileText,
  ARCHIVE: Archive,
};

const TYPE_COLORS: Record<string, string> = {
  IMAGE: 'var(--color-primary)',
  VIDEO: '#7c3aed',
  AUDIO: '#059669',
  DOCUMENT: '#d97706',
  ARCHIVE: '#dc2626',
};

const FOLDERS = ['All Files'];

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function WebAssetsPageContent() {

  const { data: ASSETS_DB, createItem, updateItem, deleteItem } = useBuilderData<any>("web-assets", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);


  const handleSave = async (data: any) => {
    if (data.sizeBytes) data.sizeBytes = parseInt(data.sizeBytes, 10);
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const executeDeleteAsset = async (id: any) => {
    await deleteItem(id);
  };

  const router = useRouter();
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('All Files');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = ASSETS_DB.filter((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Asset Manager"
        description="Upload and organize media assets for your website and ERP templates"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Studio</button>
            <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}><Upload size={15} /><span>Upload Files</span></button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-4)' }}>
        {/* Folder Sidebar */}
        <div className="frappe-card" style={{ padding: 'var(--space-3)', height: 'fit-content' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-2) 0' }}>Folders</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0.5)' }}>
            {FOLDERS.map(f => (
              <button key={f} onClick={() => setFolder(f)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: folder === f ? 'var(--color-primary-light)' : 'transparent', border: 'none', borderRadius: 'var(--radius-md)', color: folder === f ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: folder === f ? 'var(--weight-semibold)' : 'var(--weight-normal)', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 'var(--space-2) var(--space-2.5)' }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            <button onClick={() => { /* New folder */ }} className="frappe-btn frappe-btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
              <PlusCircle size={12} />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input className="frappe-input" type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
            </div>
            <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: 'var(--space-2)', background: viewMode === 'grid' ? 'var(--color-primary-light)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}><Grid3X3 size={15} /></button>
              <button onClick={() => setViewMode('list')} style={{ padding: 'var(--space-2)', background: viewMode === 'list' ? 'var(--color-primary-light)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}><List size={15} /></button>
            </div>
          </div>

          {/* Upload Zone */}
          <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = 'rgba(5,150,105,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'transparent'; }}>
            <Upload size={24} style={{ color: '#059669' }} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0 }}>Drop files here or click to upload</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>Supports JPG, PNG, SVG, MP4, PDF up to 100MB</p>
          </div>

          {/* Assets Grid/List */}
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
              {filtered.map((asset: any) => {
                const Icon = TYPE_ICONS[asset.type] || Image;
                const color = TYPE_COLORS[asset.type] || 'var(--color-primary)';
                return (
                  <div key={asset.id} className="frappe-card" style={{ padding: 'var(--space-3)', cursor: 'pointer', transition: 'all var(--duration-fast)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
                    <div style={{ height: '80px', background: `${color}15`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                      <Icon size={28} style={{ color }} />
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: '0 0 2px 0', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: 0 }}>{formatBytes(asset.sizeBytes)}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                      <button onClick={() => window.open(asset.url, '_blank')} className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1)' }}><Download size={11} /></button>
                      <button onClick={() => { setEditingItem(asset); setIsModalOpen(true); }} className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1)' }}><Copy size={11} /></button>
                      <button onClick={() => setDeleteTarget(asset.id)} className="frappe-btn" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="frappe-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                    {['Name', 'Type', 'Size', 'URL', 'Uploaded By', 'Uploaded At', 'Actions'].map(h => (
                      <th key={h} style={{ padding: 'var(--space-2.5) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset: any, idx: number) => {
                    const Icon = TYPE_ICONS[asset.type] || Image;
                    const color = TYPE_COLORS[asset.type] || 'var(--color-primary)';
                    return (
                      <tr key={asset.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={13} style={{ color }} />
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{asset.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{asset.type}</td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatBytes(asset.sizeBytes)}</td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.url}</td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{asset.uploadedBy || 'System'}</td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{new Date(asset.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-2.5) var(--space-4)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <button onClick={() => window.open(asset.url, '_blank')} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}><Download size={11} /></button>
                            <button onClick={() => { setEditingItem(asset); setIsModalOpen(true); }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}><Copy size={11} /></button>
                            <button className="frappe-btn" style={{ padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(asset.id)}><Trash2 size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Asset" : "Upload Asset"}
        fields={[ { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'type', label: 'Type (IMAGE/VIDEO/DOCUMENT)', type: 'text', required: true }, { name: 'url', label: 'URL', type: 'text', required: true }, { name: 'sizeBytes', label: 'Size (bytes)', type: 'number' }, { name: 'uploadedBy', label: 'Uploaded By', type: 'text' } ]}
        initialData={editingItem}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteAsset(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function WebAssetsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Asset Manager...</div>}>
      <WebAssetsPageContent />
    </Suspense>
  );
}
