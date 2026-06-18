/* eslint-disable */
// @ts-nocheck
'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';

import { useBuilderData } from '@/lib/hooks/useBuilderData';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, PlusCircle, Search, Edit3, Trash2, Eye, Clock } from 'lucide-react';

const POSTS = [
  { id: 1, title: 'Introducing UniERP v12 — The Future of Enterprise', category: 'Product', author: 'Admin', date: '2025-06-10', status: 'Published', views: 4200, readTime: '5 min' },
  { id: 2, title: 'How AI is Transforming ERP Systems in 2025', category: 'Insights', author: 'Admin', date: '2025-06-08', status: 'Published', views: 3800, readTime: '8 min' },
  { id: 3, title: 'Top 10 ERP Best Practices for Manufacturing', category: 'Guide', author: 'Admin', date: '2025-06-05', status: 'Published', views: 6100, readTime: '12 min' },
  { id: 4, title: 'Case Study: How Acme Corp Saved 40% on Operations', category: 'Case Study', author: 'Admin', date: '2025-06-01', status: 'Published', views: 2900, readTime: '6 min' },
  { id: 5, title: 'UniERP Healthcare Module Deep Dive', category: 'Product', author: 'Admin', date: '2025-05-28', status: 'Draft', views: 0, readTime: '10 min' },
  { id: 6, title: 'The Complete Guide to Procurement Automation', category: 'Guide', author: 'Admin', date: '2025-05-22', status: 'Published', views: 5400, readTime: '15 min' },
];

const CATEGORIES = ['All', 'Product', 'Insights', 'Guide', 'Case Study', 'Tutorial'];
const CATEGORY_COLORS: Record<string, string> = {
  Product: 'var(--color-primary)',
  Insights: '#7c3aed',
  Guide: '#059669',
  'Case Study': '#d97706',
  Tutorial: '#dc2626',
};

export default function WebBlogPage() {
  const { data: POSTS_DB, createItem, updateItem, deleteItem } = useBuilderData("blog-posts", POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleSave = async (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dummy1 = handleDelete; const dummy2 = setEditingItem;
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = POSTS_DB.filter(p => (cat === 'All' || p.category === cat) && p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>Blog Posts</h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>Write, edit, and publish blog content to your public website</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Builder</button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
<PlusCircle size={15} /><span>New Post</span></button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Published Posts', value: POSTS_DB.length.toString(), icon: FileText, color: 'var(--color-primary)' },
          { label: 'Total Views', value: POSTS_DB.reduce((a, b) => a + (b.views || 0), 0).toLocaleString(), icon: Eye, color: '#059669' },
          { label: 'Avg Read Time', value: '8 min', icon: Clock, color: '#d97706' },
          { label: 'Drafts', value: POSTS_DB.filter(p => p.status === 'Draft').length.toString(), icon: Edit3, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '28rem' }}>
          <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input className="frappe-input" type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-full)', border: `1px solid ${cat === c ? 'var(--color-primary)' : 'var(--color-border)'}`, background: cat === c ? 'var(--color-primary-light)' : 'transparent', color: cat === c ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: cat === c ? 'var(--weight-semibold)' : 'var(--weight-normal)', cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="frappe-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
              {['Post Title', 'Category', 'Author', 'Date', 'Views', 'Read Time', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((post, idx) => (
              <tr key={post.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '280px' }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${CATEGORY_COLORS[post.category] || 'var(--color-primary)'}20`, color: CATEGORY_COLORS[post.category] || 'var(--color-primary)' }}>{post.category}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{post.author}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{post.date}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{post.views.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{post.readTime}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: post.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: post.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>{post.status}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}><Edit3 size={12} /></button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}><Eye size={12} /></button>
                    <button className="frappe-btn" style={{ padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} onClick={() => handleDelete(post.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Item" : "Create New"}
        fields={[ { name: 'title', label: 'Title', type: 'text', required: true }, { name: 'slug', label: 'Slug', type: 'text', required: true }, { name: 'author', label: 'Author', type: 'text' } ]}
        initialData={editingItem}
      />
    </div>
  );
}
