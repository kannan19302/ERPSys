/* eslint-disable */
// @ts-nocheck
'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet,
  Layers,
  AlignLeft,
  Image,
  LayoutGrid,
  FileText,
  Tag,
  ExternalLink,
  Move,
  Zap,
  Type,
} from 'lucide-react';

const PAGES_LIST = [
  { id: 1, name: 'Homepage', slug: '/', status: 'Published', sections: 6, lastEdited: '2 hours ago', visits: 12400 },
  { id: 2, name: 'About Us', slug: '/about', status: 'Published', sections: 4, lastEdited: '1 day ago', visits: 3200 },
  { id: 3, name: 'Pricing', slug: '/pricing', status: 'Published', sections: 3, lastEdited: '3 days ago', visits: 8900 },
  { id: 4, name: 'Contact', slug: '/contact', status: 'Published', sections: 2, lastEdited: '1 week ago', visits: 2100 },
  { id: 5, name: 'Features', slug: '/features', status: 'Draft', sections: 5, lastEdited: '5 hours ago', visits: 0 },
  { id: 6, name: 'Blog Listing', slug: '/blog', status: 'Published', sections: 2, lastEdited: '2 days ago', visits: 6700 },
  { id: 7, name: 'Case Studies', slug: '/case-studies', status: 'Draft', sections: 3, lastEdited: '4 days ago', visits: 0 },
  { id: 8, name: 'Privacy Policy', slug: '/privacy', status: 'Published', sections: 1, lastEdited: '1 month ago', visits: 890 },
  { id: 9, name: 'Terms of Service', slug: '/terms', status: 'Published', sections: 1, lastEdited: '1 month ago', visits: 450 },
];

const SECTIONS_PALETTE = [
  { type: 'hero', label: 'Hero Banner', icon: Monitor },
  { type: 'features', label: 'Features Grid', icon: LayoutGrid },
  { type: 'text', label: 'Text Block', icon: AlignLeft },
  { type: 'image', label: 'Image Gallery', icon: Image },
  { type: 'cta', label: 'Call to Action', icon: Zap },
  { type: 'testimonials', label: 'Testimonials', icon: Type },
  { type: 'pricing', label: 'Pricing Table', icon: Tag },
  { type: 'faq', label: 'FAQ Accordion', icon: FileText },
];

const DEMO_SECTIONS = [
  { id: 's1', type: 'hero', label: 'Hero Section — "Transform Your Enterprise"', height: 120 },
  { id: 's2', type: 'features', label: 'Features Grid — 4 columns', height: 80 },
  { id: 's3', type: 'text', label: 'Why Choose UniERP — Intro Paragraph', height: 60 },
  { id: 's4', type: 'testimonials', label: 'Customer Testimonials Carousel', height: 80 },
  { id: 's5', type: 'cta', label: 'Get Started CTA — Primary', height: 60 },
  { id: 's6', type: 'image', label: 'Product Screenshots Gallery', height: 90 },
];

const SECTION_COLORS: Record<string, string> = {
  hero: 'var(--color-primary)',
  features: '#7c3aed',
  text: '#059669',
  image: '#d97706',
  cta: '#dc2626',
  testimonials: '#0891b2',
  pricing: '#7c3aed',
  faq: '#059669',
};

export default function WebBuilderPagesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const handleSave = async (data: any) => {
    console.log('Saving', data);
    setIsModalOpen(false);
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<typeof PAGES_LIST[0] | null>(null);

  const filtered = PAGES_LIST.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Globe size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Website Pages
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Create and manage public-facing website pages with drag-and-drop sections
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>
            ← Web Builder
          </button>
          <button
            className="frappe-btn frappe-btn-primary"
            onClick={() => { setEditingPage(PAGES_LIST[0] ?? null); setActiveTab('editor'); }}
          >
            <PlusCircle size={15} />
            <span>New Page</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'list', label: 'All Pages', icon: Globe },
          { id: 'editor', label: 'Page Editor', icon: Edit3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? '#7c3aed' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
            {activeTab === 'editor' && tab.id === 'editor' && editingPage && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: '#7c3aed20', color: '#7c3aed' }}>
                {editingPage.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pages List Tab */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {/* New page card */}
            <div
              className="frappe-card"
              onClick={() => { setEditingPage(PAGES_LIST[0] ?? null); setActiveTab('editor'); }}
              style={{ padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', minHeight: '160px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
            >
              <PlusCircle size={28} style={{ color: '#7c3aed' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>New Page</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, textAlign: 'center' }}>Start from blank or choose a template</p>
            </div>

            {filtered.map(page => (
              <div
                key={page.id}
                className="frappe-card"
                style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all var(--duration-fast)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                {/* Page Preview Thumbnail */}
                <div style={{ height: '100px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, var(--color-bg) 100%)', position: 'relative', padding: 'var(--space-3)', overflow: 'hidden' }}>
                  {/* Fake page wireframe */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.6 }}>
                    <div style={{ height: '24px', background: '#7c3aed30', borderRadius: '3px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      <div style={{ height: '16px', background: 'var(--color-border)', borderRadius: '3px' }} />
                      <div style={{ height: '16px', background: 'var(--color-border)', borderRadius: '3px' }} />
                      <div style={{ height: '16px', background: 'var(--color-border)', borderRadius: '3px' }} />
                    </div>
                    <div style={{ height: '12px', background: 'var(--color-border)', borderRadius: '3px', width: '70%' }} />
                    <div style={{ height: '12px', background: 'var(--color-border)', borderRadius: '3px', width: '40%' }} />
                  </div>
                  <span style={{ position: 'absolute', bottom: 'var(--space-2)', right: 'var(--space-2)', fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: page.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: page.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {page.status}
                  </span>
                </div>
                <div style={{ padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{page.name}</p>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2) 0', fontFamily: 'monospace' }}>{page.slug}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{page.sections} sections · {page.visits.toLocaleString()} visits</span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setEditingPage(page ?? null); setActiveTab('editor'); }}>
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => { /* Edit section */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px' }}>
                        <ExternalLink size={11} />
                      </button>
                      <button onClick={() => { /* Delete section */ }} className="frappe-btn" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Editor Tab */}
      {activeTab === 'editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 240px', gap: 'var(--space-4)', height: 'calc(100vh - 280px)' }}>
          {/* Section Palette */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Sections
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
              {SECTIONS_PALETTE.map(section => (
                <div key={section.type}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)', padding: 'var(--space-2) var(--space-2.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'grab', fontSize: 'var(--text-xs)', color: 'var(--color-text)', transition: 'all var(--duration-fast)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor = '#7c3aed'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                  <section.icon size={14} style={{ color: '#7c3aed', flexShrink: 0 }} />
                  <span>{section.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Canvas */}
          <div className="frappe-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Editor Toolbar */}
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  {editingPage?.name || 'Homepage'}
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  {editingPage?.slug || '/'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                {/* Responsive toggles */}
                <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  {[
                    { mode: 'desktop', Icon: Monitor },
                    { mode: 'tablet', Icon: Tablet },
                    { mode: 'mobile', Icon: Smartphone },
                  ].map(({ mode, Icon }) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode as typeof previewMode)}
                      style={{
                        padding: 'var(--space-1.5) var(--space-2)',
                        background: previewMode === mode ? 'var(--color-primary-light)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        color: previewMode === mode ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        borderRight: mode !== 'mobile' ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
                <button onClick={() => { /* Add section */ }} className="frappe-btn frappe-btn-secondary">
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
                <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                  <CheckCircle size={13} />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* Page Canvas */}
            <div style={{
              flex: 1, overflow: 'auto', padding: 'var(--space-4)',
              background: 'var(--color-bg)',
              display: 'flex', justifyContent: 'center',
            }}>
              <div style={{
                width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
                transition: 'width var(--duration-normal)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              }}>
                {DEMO_SECTIONS.map((section, idx) => (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSection(section.id === selectedSection ? null : section.id)}
                    style={{
                      border: `2px ${selectedSection === section.id ? 'solid' : 'dashed'} ${selectedSection === section.id ? SECTION_COLORS[section.type] : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      height: `${section.height}px`,
                      background: selectedSection === section.id ? `${SECTION_COLORS[section.type]}08` : 'var(--color-bg-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      position: 'relative',
                      transition: 'all var(--duration-fast)',
                    }}
                  >
                    <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                      <Move size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: 'var(--space-1)' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} onClick={(e) => { e.stopPropagation(); }}>
                        <Edit3 size={12} style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} onClick={(e) => { e.stopPropagation(); }}>
                        <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                      </button>
                    </div>

                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: `${SECTION_COLORS[section.type]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Layers size={16} style={{ color: SECTION_COLORS[section.type] }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: SECTION_COLORS[section.type], textTransform: 'uppercase', margin: 0 }}>{section.type}</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', margin: 0, fontWeight: 'var(--weight-medium)' }}>{section.label}</p>
                    </div>
                    <span style={{ position: 'absolute', right: '36px', top: '8px', fontSize: '10px', background: 'var(--color-bg)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      Section {idx + 1}
                    </span>
                  </div>
                ))}

                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}>
                  <PlusCircle size={16} />
                  <span>Add Section</span>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              {selectedSection ? 'Section Properties' : 'Page Settings'}
            </p>
            {selectedSection ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Section Title', value: DEMO_SECTIONS.find(s => s.id === selectedSection)?.label || '' },
                  { label: 'Background Color', value: '#ffffff' },
                  { label: 'Padding (top)', value: '80px' },
                  { label: 'Padding (bottom)', value: '80px' },
                  { label: 'Max Width', value: '1200px' },
                ].map(prop => (
                  <div key={prop.label} className="frappe-form-group">
                    <label className="frappe-label">{prop.label}</label>
                    <input className="frappe-input" type="text" defaultValue={prop.value} style={{ fontSize: 'var(--text-xs)' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[
                    { label: 'Full Width Background', checked: true },
                    { label: 'Hide on Mobile', checked: false },
                    { label: 'Animate on Scroll', checked: true },
                  ].map(toggle => (
                    <label key={toggle.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{toggle.label}</span>
                      <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: toggle.checked ? '#7c3aed' : 'var(--color-border)', position: 'relative' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '8px', background: 'white', position: 'absolute', top: '2px', left: toggle.checked ? '18px' : '2px', transition: 'left var(--duration-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={() => { /* Apply changes */ }} className="frappe-btn frappe-btn-primary" style={{ justifyContent: 'center' }}>Apply Changes</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Page Title', value: editingPage?.name || 'Homepage' },
                  { label: 'URL Slug', value: editingPage?.slug || '/' },
                  { label: 'Meta Description', value: 'A world-class ERP system built for every industry' },
                  { label: 'OG Image URL', value: 'https://unerp.dev/og-home.png' },
                ].map(prop => (
                  <div key={prop.label} className="frappe-form-group">
                    <label className="frappe-label">{prop.label}</label>
                    <input className="frappe-input" type="text" defaultValue={prop.value} style={{ fontSize: 'var(--text-xs)' }} />
                  </div>
                ))}
                <div className="frappe-form-group">
                  <label className="frappe-label">Page Visibility</label>
                  <select className="frappe-input" style={{ fontSize: 'var(--text-xs)' }}>
                    <option>Public</option>
                    <option>Unlisted</option>
                    <option>Password Protected</option>
                  </select>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                  Click any section in the editor to configure it
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Item" : "Create New"}
        fields={[ { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'slug', label: 'Slug', type: 'text', required: true } ]}
        initialData={editingItem}
      />
    </div>
  );
}
