'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, PlusCircle, Search, Edit3, Trash2, Eye, Move, Layers, LayoutGrid, Image, Zap, Type, Tag, FileText, Monitor, LayoutTemplate, CheckCircle } from 'lucide-react';

const SECTIONS_PALETTE = [
  { type: 'hero', label: 'Hero Banner', icon: Monitor },
  { type: 'trust', label: 'Trust Bar', icon: Layers },
  { type: 'features', label: 'Features Grid', icon: LayoutGrid },
  { type: 'social', label: 'Social Proof', icon: Type },
  { type: 'steps', label: 'How It Works', icon: LayoutTemplate },
  { type: 'pricing', label: 'Pricing Table', icon: Tag },
  { type: 'faq', label: 'FAQ Accordion', icon: FileText },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

function WebBuilderPagesPageContent() {

  const { data: PAGES_DB, createItem, updateItem, deleteItem } = useBuilderData<any>("web-pages", []);
  
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
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
    setIsModalOpen(false);
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const editingPage = PAGES_DB.find((p: any) => p.id === editingPageId) || null;

  // Local state for page sections during editing
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (editingPage) {
      let parsedSections = [];
      try {
        if (typeof editingPage.sections === 'string') {
          parsedSections = JSON.parse(editingPage.sections);
        } else if (Array.isArray(editingPage.sections)) {
          parsedSections = editingPage.sections;
        } else if (editingPage.sections && Array.isArray(editingPage.sections.items)) {
          parsedSections = editingPage.sections.items;
        }
      } catch (e) {
        parsedSections = [];
      }
      setSections(Array.isArray(parsedSections) ? parsedSections : []);
    } else {
      setSections([]);
    }
  }, [editingPage]);

  // Sync sections to iframe whenever they change
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SYNC_SECTIONS', payload: sections }, '*');
    }
  }, [sections]);

  // Sync selected section to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SELECT_SECTION', payload: selectedSectionId }, '*');
    }
  }, [selectedSectionId]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'CANVAS_READY') {
        // Send initial data
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'SYNC_SECTIONS', payload: sections }, '*');
          // In a real app we'd fetch actual WebSettings theme tokens here
          iframeRef.current.contentWindow.postMessage({ 
            type: 'SYNC_THEME', 
            payload: { colors: { primary: '#3B82F6' }, fonts: { heading: 'Inter, sans-serif' } } 
          }, '*');
        }
      } else if (type === 'SECTION_SELECTED') {
        setSelectedSectionId(payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections]);

  const handlePublish = async () => {
    if (!editingPage) return;
    await updateItem(editingPage.id, { sections: JSON.stringify(sections) });
    alert("Page sections saved successfully!");
  };

  const filtered = PAGES_DB.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- Block Library Handlers ---
  const handleAddBlock = (blockType: string, label: string) => {
    const newSection = {
      id: `s_${generateId()}`,
      type: blockType,
      label: label,
      content: {}, // Default empty props for now
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const newSections = [...sections];
    newSections.splice(idx, 1);
    setSections(newSections);
    if (selectedSectionId === sections[idx].id) {
      setSelectedSectionId(null);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', height: '100vh', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Globe size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Website Pages
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            {activeTab === 'list' ? 'Manage your public-facing pages' : `Visual Editor: ${editingPage?.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {activeTab === 'editor' && (
            <button className="frappe-btn frappe-btn-secondary" onClick={() => { setActiveTab('list'); setEditingPageId(null); }}>
              Back to List
            </button>
          )}
          {activeTab === 'editor' ? (
            <button className="frappe-btn frappe-btn-primary" onClick={handlePublish}>
              <CheckCircle size={15} />
              <span>Publish Changes</span>
            </button>
          ) : (
            <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <PlusCircle size={15} />
              <span>New Page</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="frappe-card" style={{ flexGrow: 1, overflow: 'auto' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)' }}>
            <div className="frappe-input" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexGrow: 1, background: 'var(--color-bg)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search pages..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--text-sm)' }}
              />
            </div>
          </div>
          <table className="frappe-table">
            <thead>
              <tr>
                <th>Page Name</th>
                <th>URL Slug</th>
                <th>Status</th>
                <th>Visibility</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((page: any) => (
                <tr key={page.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingPageId(page.id); setActiveTab('editor'); }}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                      {page.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>/{page.slug}</td>
                  <td>
                    <span className={`frappe-badge ${page.status === 'PUBLISHED' ? 'frappe-badge-success' : 'frappe-badge-warning'}`}>
                      {page.status || 'DRAFT'}
                    </span>
                  </td>
                  <td>{page.visibility || 'PUBLIC'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); setEditingItem(page); setIsModalOpen(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px', color: 'var(--color-danger)' }} onClick={(e) => { e.stopPropagation(); deleteItem(page.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                    No pages found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'editor' && editingPage && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexGrow: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar: Block Library & Outline */}
          <div className="frappe-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-bold)' }}>
              Block Library
            </div>
            <div style={{ padding: 'var(--space-3)', flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                {SECTIONS_PALETTE.map((block) => (
                  <button 
                    key={block.type}
                    onClick={() => handleAddBlock(block.type, block.label)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-3)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--duration-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <block.icon size={20} style={{ color: 'var(--color-text-secondary)' }} />
                    <span style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>{block.label}</span>
                  </button>
                ))}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />
              
              <div style={{ fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Page Outline</div>
              {sections.length === 0 ? (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No blocks added yet. Click above to add.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {sections.map((section, idx) => (
                    <div 
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-2) var(--space-3)',
                        background: selectedSectionId === section.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-bg-elevated)',
                        border: `1px solid ${selectedSectionId === section.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)', cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Move size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>{section.label || section.type}</span>
                      </div>
                      <button onClick={(e) => removeSection(e, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas iframe wrapper */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 12px', background: 'var(--color-bg)' }}><Monitor size={14}/></button>
              </div>
            </div>
            <div style={{ flexGrow: 1, backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-4)' }}>
              <iframe 
                ref={iframeRef}
                src={`/builder/web/canvas?pageId=${editingPageId}`}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                title="Live Canvas"
              />
            </div>
          </div>

          {/* Right Sidebar: Settings */}
          {selectedSectionId && (
            <div className="frappe-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-bold)' }}>
                Block Properties
              </div>
              <div style={{ padding: 'var(--space-4)', flexGrow: 1, overflowY: 'auto' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  Inline editor properties for {sections.find(s => s.id === selectedSectionId)?.type} would appear here.
                  (e.g., Title, subtitle, CTAs, Image Uploads).
                </p>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <label className="frappe-label">Title</label>
                  <input className="frappe-input" type="text" placeholder="Update title..." onChange={(e) => {
                    const newSections = [...sections];
                    const s = newSections.find(sec => sec.id === selectedSectionId);
                    if(s) {
                      s.content = { ...s.content, title: e.target.value };
                      setSections(newSections);
                    }
                  }} />
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Page Settings" : "Create New Page"}
        fields={[ 
          { name: 'name', label: 'Page Name', type: 'text', required: true }, 
          { name: 'slug', label: 'URL Slug', type: 'text', required: true },
          { name: 'metaTitle', label: 'Meta Title', type: 'text' },
          { name: 'metaDesc', label: 'Meta Description', type: 'text' },
          { name: 'visibility', label: 'Visibility', type: 'select', options: [{label:'Public', value:'PUBLIC'}, {label:'Unlisted', value:'UNLISTED'}] }
        ]}
        initialData={editingItem}
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function WebBuilderPagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Web Pages...</div>}>
      <WebBuilderPagesPageContent />
    </Suspense>
  );
}
