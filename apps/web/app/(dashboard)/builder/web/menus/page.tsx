'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  PlusCircle,
  Edit3,
  Trash2,
  GripVertical,
  ChevronRight,
  Eye,
  Globe,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Monitor,
} from 'lucide-react';


export default function WebMenusPage() {
  const { data: MENUS_DB, createItem, updateItem, deleteItem } = useBuilderData("web-menus", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const handleSave = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem({ ...data, items: [] });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this menu?')) {
      await deleteItem(id);
    }
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Navigation size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Navigation Menu Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Build multi-level navigation menus, mega menus, and mobile hamburger configurations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>
            ← Web Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <PlusCircle size={15} />
            <span>New Menu</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'list', label: 'All Menus', icon: Navigation },
          { id: 'editor', label: 'Menu Editor', icon: Edit3 },
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
          </button>
        ))}
      </div>

      {/* Menu List */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Create new card */}
          <div className="frappe-card" style={{ padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', minHeight: '140px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <PlusCircle size={28} style={{ color: '#7c3aed' }} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>Create New Menu</p>
          </div>

          {MENUS_DB.map((menu: any) => {
            const itemCount = Array.isArray(menu.items) ? menu.items.length : 0;
            const previewItems = Array.isArray(menu.items) ? menu.items.slice(0, 4).map((i: any) => i.label || 'Item') : ['Home', 'Products', 'Contact'];
            return (
            <div key={menu.id} className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
              onClick={() => { setEditingItem(menu); setActiveTab('editor'); }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {menu.location === 'MOBILE' ? <Smartphone size={18} style={{ color: '#7c3aed' }} /> : <Monitor size={18} style={{ color: '#7c3aed' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{menu.name}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{menu.location} · {itemCount} items</p>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: menu.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: menu.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {menu.status || 'ACTIVE'}
                </span>
              </div>
              {/* Preview pills */}
              <div style={{ display: 'flex', gap: 'var(--space-1.5)', flexWrap: 'wrap' }}>
                {previewItems.map((item: string, index: number) => (
                  <span key={index} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {item}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1.5)', marginTop: 'var(--space-3)' }}>
                <button className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }} onClick={(e) => { e.stopPropagation(); setEditingItem(menu); setActiveTab('editor'); }}>
                  <Edit3 size={12} /><span>Edit</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); /* Preview */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Eye size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(menu.id); }} className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Menu Editor */}
      {activeTab === 'editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', gap: 'var(--space-4)', minHeight: '500px' }}>
          {/* Left: Item List */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: 0 }}>
                Menu Items
              </p>
              <button onClick={() => { /* Edit menu item */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px' }}>
                <PlusCircle size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {(editingItem?.items || []).map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-2.5)',
                    paddingLeft: `calc(var(--space-2.5) + ${(item.depth || 0) * 16}px)`,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: selectedItem === item.id ? 'rgba(124,58,237,0.08)' : 'transparent',
                    border: `1px solid ${selectedItem === item.id ? '#7c3aed' : 'transparent'}`,
                    transition: 'all var(--duration-fast)',
                  }}
                  onMouseEnter={e => { if (selectedItem !== item.id) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { if (selectedItem !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <GripVertical size={12} style={{ color: 'var(--color-text-tertiary)', cursor: 'grab', flexShrink: 0 }} />
                  {item.children?.length > 0 && <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                  <span style={{ fontSize: 'var(--text-xs)', color: selectedItem === item.id ? '#7c3aed' : 'var(--color-text)', fontWeight: item.depth === 0 ? 'var(--weight-medium)' : 'var(--weight-normal)', flex: 1 }}>
                    {item.label}
                  </span>
                  {item.depth === 0 && item.children?.length > 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{item.children.length} sub</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => { /* Add menu item */ }} className="frappe-btn frappe-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
              <PlusCircle size={12} />
              <span>Add Item</span>
            </button>
          </div>

          {/* Center: Preview */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>{editingItem?.name || 'Main Navigation'}</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="frappe-btn frappe-btn-secondary"><Eye size={14} /><span>Preview</span></button>
                <button className="frappe-btn frappe-btn-primary" onClick={() => { setIsModalOpen(true); }}><CheckCircle size={14} /><span>Edit Details</span></button>
              </div>
            </div>

            {/* Navigation preview mockup */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {/* Browser chrome */}
              <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['#ff5f57', '#ffbd2e', '#28ca42'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={9} />
                  yourdomain.com
                </div>
              </div>
              {/* Navbar preview */}
              <div style={{ background: 'white', padding: 'var(--space-3) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>U</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a1a' }}>UniERP</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  {['Home', 'Products', 'Pricing', 'Blog', 'Contact'].map((item, i) => (
                    <span key={item} style={{ fontSize: '12px', color: i === 0 ? 'var(--color-primary)' : '#4b5563', cursor: 'pointer', fontWeight: i === 0 ? '600' : '400' }}>
                      {item}{item === 'Products' && ' ▾'}
                    </span>
                  ))}
                </div>
                <button onClick={() => { /* Add link */ }} style={{ fontSize: '11px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer' }}>
                  Get Started
                </button>
              </div>
              <div style={{ background: '#f9fafb', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>← Page content area →</span>
              </div>
            </div>
          </div>

          {/* Right: Item Properties */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Item Properties
            </p>
            {selectedItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="frappe-form-group"><label className="frappe-label">Label</label><input className="frappe-input" defaultValue={(editingItem?.items || []).find((i: any) => i.id === selectedItem)?.label} /></div>
                <div className="frappe-form-group"><label className="frappe-label">Link URL</label><input className="frappe-input" defaultValue={(editingItem?.items || []).find((i: any) => i.id === selectedItem)?.href} /></div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Link Type</label>
                  <select className="frappe-input"><option>Internal Page</option><option>External URL</option><option>Anchor (#)</option><option>No Link</option></select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Open In</label>
                  <select className="frappe-input"><option>Same Tab</option><option>New Tab</option></select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>Show in Mobile Nav</span>
                  <div style={{ width: '34px', height: '18px', borderRadius: '9px', background: 'var(--color-primary)', position: 'relative' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '7px', background: 'white', position: 'absolute', top: '2px', left: '18px' }} />
                  </div>
                </label>
                <button onClick={() => { /* Save menu */ }} className="frappe-btn frappe-btn-primary" style={{ justifyContent: 'center' }}><CheckCircle size={13} /><span>Save Item</span></button>
                <button onClick={() => { /* Delete menu */ }} className="frappe-btn frappe-btn-secondary" style={{ justifyContent: 'center', color: 'var(--color-danger)' }}>
                  <ExternalLink size={13} /><span>Remove Item</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <Navigation size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.4, display: 'block' }} />
                Click a menu item to edit its properties
              </div>
            )}
          </div>
        </div>
      )}
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Menu Properties" : "Create New Menu"}
        fields={[ 
          { name: 'name', label: 'Menu Name', type: 'text', required: true }, 
          { name: 'location', label: 'Location (HEADER/FOOTER/MOBILE)', type: 'text', required: true },
          { name: 'status', label: 'Status (ACTIVE/DRAFT)', type: 'text' }
        ]}
        initialData={editingItem}
      />
    </div>
  );
}
