'use client';
import styles from './page.module.css';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
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

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const executeDeleteMenu = async (id: any) => {
    await deleteItem(id);
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Navigation Menu Builder"
        description="Build multi-level navigation menus, mega menus, and mobile hamburger configurations"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/web')}>
              ← Web Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <PlusCircle size={15} />
              <span>New Menu</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className={styles.s1}>
        {[
          { id: 'list', label: 'All Menus', icon: Navigation },
          { id: 'editor', label: 'Menu Editor', icon: Edit3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: activeTab === tab.id ? '#7c3aed' : 'var(--color-text-secondary)', borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent' }} className={styles.s2}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Menu List */}
      {activeTab === 'list' && (
        <div className={styles.s3}>
          {/* Create new card */}
          <div className={`ui-card ${styles.s4} ${styles.createCard}`}
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <PlusCircle size={28} className={styles.s5} />
            <p className={styles.s6}>Create New Menu</p>
          </div>

          {MENUS_DB.map((menu: any) => {
            const itemCount = Array.isArray(menu.items) ? menu.items.length : 0;
            const previewItems = Array.isArray(menu.items) ? menu.items.slice(0, 4).map((i: any) => i.label || 'Item') : ['Home', 'Products', 'Contact'];
            return (
            <div key={menu.id} className={`ui-card ${styles.s7} ${styles.menuCard}`}
              onClick={() => { setEditingItem(menu); setActiveTab('editor'); }}
              >
              <div className={styles.s8}>
                <div className="ui-hstack-2">
                  <div className={styles.s9}>
                    {menu.location === 'MOBILE' ? <Smartphone size={18} className={styles.s5} /> : <Monitor size={18} className={styles.s5} />}
                  </div>
                  <div>
                    <p className={styles.s10}>{menu.name}</p>
                    <p className="ui-text-xs-muted m-0">{menu.location} · {itemCount} items</p>
                  </div>
                </div>
                <span style={{ background: menu.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: menu.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s11}>
                  {menu.status || 'ACTIVE'}
                </span>
              </div>
              {/* Preview pills */}
              <div className={styles.s12}>
                {previewItems.map((item: string, index: number) => (
                  <span key={index} className={styles.s13}>
                    {item}
                  </span>
                ))}
              </div>
              <div className={styles.s14}>
                <button className={`ui-btn ui-btn-secondary ${styles.s15}`}  onClick={(e) => { e.stopPropagation(); setEditingItem(menu); setActiveTab('editor'); }}>
                  <Edit3 size={12} /><span>Edit</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); /* Preview */ }} className={`ui-btn ui-btn-secondary ${styles.s16}`} ><Eye size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(menu.id); }} className={`ui-btn ${styles.s17}`} ><Trash2 size={12} /></button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Menu Editor */}
      {activeTab === 'editor' && (
        <div className={styles.s18}>
          {/* Left: Item List */}
          <div className={`ui-card ${styles.s19}`} >
            <div className={styles.s8}>
              <p className={styles.s20}>
                Menu Items
              </p>
              <button onClick={() => { /* Edit menu item */ }} className={`ui-btn ui-btn-secondary ${styles.s21}`} >
                <PlusCircle size={12} />
              </button>
            </div>
            <div className="ui-stack-1">
              {(editingItem?.items || []).map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
                  style={{ paddingLeft: `calc(var(--space-2.5) + ${(item.depth || 0) * 16}px)`, background: selectedItem === item.id ? 'rgba(124,58,237,0.08)' : 'transparent', border: `1px solid ${selectedItem === item.id ? '#7c3aed' : 'transparent'}` }} className={`${styles.s22} ${styles.menuItem} ${selectedItem === item.id ? styles.menuItemSelected : ''}`}
                >
                  <GripVertical size={12} className={styles.s23} />
                  {item.children?.length > 0 && <ChevronRight size={12} className={styles.s24} />}
                  <span style={{ color: selectedItem === item.id ? '#7c3aed' : 'var(--color-text)', fontWeight: item.depth === 0 ? 'var(--weight-medium)' : 'var(--weight-normal)' }} className={styles.s25}>
                    {item.label}
                  </span>
                  {item.depth === 0 && item.children?.length > 0 && (
                    <span className="ui-text-micro">{item.children.length} sub</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => { /* Add menu item */ }} className={`ui-btn ui-btn-secondary ${styles.s26}`} >
              <PlusCircle size={12} />
              <span>Add Item</span>
            </button>
          </div>

          {/* Center: Preview */}
          <div className="ui-card p-4 ui-stack-3">
            <div className={styles.s27}>
              <h3 className={styles.s28}>{editingItem?.name || 'Main Navigation'}</h3>
              <div className="ui-flex ui-gap-2">
                <button className="ui-btn ui-btn-secondary"><Eye size={14} /><span>Preview</span></button>
                <button className="ui-btn ui-btn-primary" onClick={() => { setIsModalOpen(true); }}><CheckCircle size={14} /><span>Edit Details</span></button>
              </div>
            </div>

            {/* Navigation preview mockup */}
            <div className={styles.s29}>
              {/* Browser chrome */}
              <div className={styles.s30}>
                <div className={styles.s31}>
                  {['#ff5f57', '#ffbd2e', '#28ca42'].map(c => <div key={c} style={{ background: c }} className={styles.s32} />)}
                </div>
                <div className={styles.s33}>
                  <Globe size={9} />
                  yourdomain.com
                </div>
              </div>
              {/* Navbar preview */}
              <div className={styles.s34}>
                <div className="ui-hstack-2">
                  <div className={styles.s35}>
                    <span className={styles.s36}>U</span>
                  </div>
                  <span className={styles.s37}>UniERP</span>
                </div>
                <div className={styles.s38}>
                  {['Home', 'Products', 'Pricing', 'Blog', 'Contact'].map((item, i) => (
                    <span key={item} style={{ color: i === 0 ? 'var(--color-primary)' : '#4b5563', fontWeight: i === 0 ? '600' : '400' }} className={styles.s39}>
                      {item}{item === 'Products' && ' ▾'}
                    </span>
                  ))}
                </div>
                <button onClick={() => { /* Add link */ }} className={styles.s40}>
                  Get Started
                </button>
              </div>
              <div className={styles.s41}>
                <span className="ui-text-xs-tertiary">← Page content area →</span>
              </div>
            </div>
          </div>

          {/* Right: Item Properties */}
          <div className={`ui-card ${styles.s19}`} >
            <p className={styles.s42}>
              Item Properties
            </p>
            {selectedItem ? (
              <div className="ui-stack-3">
                <div className="ui-form-group"><label className="ui-label">Label</label><input className="ui-input" defaultValue={(editingItem?.items || []).find((i: any) => i.id === selectedItem)?.label} /></div>
                <div className="ui-form-group"><label className="ui-label">Link URL</label><input className="ui-input" defaultValue={(editingItem?.items || []).find((i: any) => i.id === selectedItem)?.href} /></div>
                <div className="ui-form-group">
                  <label className="ui-label">Link Type</label>
                  <select className="ui-input"><option>Internal Page</option><option>External URL</option><option>Anchor (#)</option><option>No Link</option></select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Open In</label>
                  <select className="ui-input"><option>Same Tab</option><option>New Tab</option></select>
                </div>
                <label className={styles.s43}>
                  <span className={styles.s44}>Show in Mobile Nav</span>
                  <div className={styles.s45}>
                    <div className={styles.s46} />
                  </div>
                </label>
                <button onClick={() => { /* Save menu */ }} className={`ui-btn ui-btn-primary ${styles.s47}`} ><CheckCircle size={13} /><span>Save Item</span></button>
                <button onClick={() => { /* Delete menu */ }} className={`ui-btn ui-btn-secondary ${styles.s48}`} >
                  <ExternalLink size={13} /><span>Remove Item</span>
                </button>
              </div>
            ) : (
              <div className={styles.s49}>
                <Navigation size={24} className={styles.s50} />
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
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteMenu(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Menu"
        message="Are you sure you want to delete this menu? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
