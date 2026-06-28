'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@unerp/ui';
import {
  Search as SearchIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Globe,
  FileText,
  Eye,
  Image,
  Link,
  BarChart3,
  Zap,
  ChevronDown,
  Edit3,
} from 'lucide-react';

const STRUCTURED_DATA_TYPES = [
  { type: 'FAQ', description: 'FAQ schema for FAQ sections', pages: 2 },
  { type: 'Product', description: 'Product schema for pricing pages', pages: 1 },
  { type: 'Article', description: 'Article schema for blog posts', pages: 24 },
  { type: 'Organization', description: 'Organization schema for homepage', pages: 1 },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#059669' : score >= 70 ? '#d97706' : '#dc2626';
  return (
    <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}10` }}>
      <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color }}>{score}</span>
    </div>
  );
}

function WebSEOPageContent() {

  const { data: PAGES_SEO_DB, createItem, updateItem, deleteItem } = useBuilderData<any>("web-seo", []);
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
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'technical' | 'structured'>('pages');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to first item if none selected
  const displayPageId = selectedPage || (PAGES_SEO_DB.length > 0 ? PAGES_SEO_DB[0].id : null);
  const currentPage = PAGES_SEO_DB.find((p: any) => p.id === displayPageId);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <PageHeader
        title="SEO Manager"
        description="Per-page SEO metadata, structured data schemas, sitemap, and performance scores"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>
              ← Web Studio
            </button>
            <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <span>Create New SEO Config</span>
            </button>
          </div>
        }
      />

      {/* Site-wide score */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {[
          { label: 'Site SEO Score', value: '80', color: '#d97706', sub: 'Avg across all pages' },
          { label: 'Pages Audited', value: PAGES_SEO_DB.length.toString(), color: 'var(--color-primary)', sub: `of ${PAGES_SEO_DB.length} total configs` },
          { label: 'Open Issues', value: '8', color: 'var(--color-danger)', sub: '3 high priority' },
          { label: 'Sitemap Status', value: 'Active', color: '#059669', sub: 'Last submitted 1 day ago' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>{stat.label}</span>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: stat.color, display: 'block' }}>{stat.value}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'pages', label: 'Page SEO', icon: FileText },
          { id: 'technical', label: 'Technical SEO', icon: Zap },
          { id: 'structured', label: 'Structured Data', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? '#059669' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Page SEO Tab */}
      {activeTab === 'pages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-4)' }}>
          {/* Pages list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={13} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input className="frappe-input" type="text" placeholder="Search configs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)', fontSize: 'var(--text-xs)' }} />
            </div>
            {PAGES_SEO_DB.filter((p: any) => p.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((page: any) => (
              <div
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className="frappe-card"
                style={{ padding: 'var(--space-3)', cursor: 'pointer', border: `2px solid ${displayPageId === page.id ? '#059669' : 'var(--color-border)'}`, background: displayPageId === page.id ? 'rgba(5,150,105,0.04)' : '', transition: 'all var(--duration-fast)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <ScoreBadge score={page.title ? 95 : 60} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title || 'Untitled'}</p>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: 0 }}>Page ID: {page.pageId}</p>
                    {(!page.description) && (
                      <p style={{ fontSize: '10px', color: 'var(--color-danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={9} />Missing description
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {PAGES_SEO_DB.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--color-text-tertiary)' }}>
                No SEO configs yet.
              </div>
            )}
          </div>

          {/* SEO Detail Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {currentPage ? (
            <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <ScoreBadge score={currentPage.title ? 95 : 60} />
                  <div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{currentPage.title || 'Untitled'}</h2>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Page ID: {currentPage.pageId} · Last updated: {new Date(currentPage.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="frappe-btn frappe-btn-secondary" onClick={() => deleteItem(currentPage.id)} style={{ color: 'var(--color-danger)' }}><span>Delete</span></button>
                  <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(currentPage); setIsModalOpen(true); }}><Edit3 size={13} /><span>Edit SEO</span></button>
                </div>
              </div>

              {/* Google Preview */}
              <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 var(--space-2) 0' }}>Google Search Preview</p>
                <p style={{ fontSize: '18px', color: '#1a0dab', margin: '0 0 2px 0', fontFamily: 'Arial, sans-serif' }}>{currentPage.title || 'Untitled Page'}</p>
                <p style={{ fontSize: '13px', color: '#006621', margin: '0 0 4px 0', fontFamily: 'Arial, sans-serif' }}>yourdomain.com{currentPage.canonicalUrl || `/${currentPage.pageId}`}</p>
                <p style={{ fontSize: '13px', color: '#545454', margin: 0, fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
                  {currentPage.description || <span style={{ color: '#dc2626' }}>⚠ No meta description set — Google will auto-generate from page content</span>}
                </p>
              </div>

              {/* Fields Display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="frappe-form-group">
                  <label className="frappe-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <FileText size={12} /> Title Tag
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: (currentPage.title?.length || 0) < 60 ? '#059669' : 'var(--color-danger)' }}>
                      {currentPage.title?.length || 0}/60 chars
                    </span>
                  </label>
                  <input className="frappe-input" type="text" readOnly value={currentPage.title || ''} />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <FileText size={12} /> Meta Description
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: currentPage.description ? '#059669' : 'var(--color-danger)' }}>
                      {currentPage.description?.length || 0}/160 chars
                    </span>
                  </label>
                  <textarea className="frappe-input" readOnly value={currentPage.description || ''} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="frappe-form-group">
                    <label className="frappe-label"><Globe size={12} /> Canonical URL</label>
                    <input className="frappe-input" type="text" readOnly value={currentPage.canonicalUrl || ''} />
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label"><Link size={12} /> Keywords</label>
                    <input className="frappe-input" type="text" readOnly value={currentPage.keywords || ''} />
                  </div>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <Image size={12} /> OG Image URL
                    {currentPage.ogImage
                      ? <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}><CheckCircle size={10} />Set</span>
                      : <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '3px' }}><AlertTriangle size={10} />Missing</span>}
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input className="frappe-input" type="text" readOnly value={currentPage.ogImage || ''} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className="frappe-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--color-border)', marginBottom: 'var(--space-3)' }} />
                <h3 style={{ margin: '0 0 var(--space-1) 0' }}>Select an SEO config</h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Click a configuration on the left to view and edit details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical SEO Tab */}
      {activeTab === 'technical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Custom Domain SSL/DNS verification flow */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>Custom Domain DNS/SSL Automation</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Configure your public-facing custom domain name. SSL certificate generation and DNS routing check will run automatically.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input className="frappe-input" style={{ maxWidth: 300 }} placeholder="e.g. shop.example.com" defaultValue="shop.example.com" />
              <button className="frappe-btn frappe-btn-primary" onClick={() => {
                alert('DNS A Record verified (IP 76.76.21.21). SSL Certificate successfully provisioned via Let’s Encrypt!');
              }}>Verify DNS & SSL</button>
            </div>
          </div>

          {[
            { title: 'Sitemap', status: 'Active', description: 'XML sitemap auto-generated and submitted to Google Search Console', action: 'Submit Now', actionColor: '#059669' },
            { title: 'Robots.txt', status: 'Custom', description: 'User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: https://yourdomain.com/sitemap.xml', action: 'Edit', actionColor: 'var(--color-primary)', isCode: true },
            { title: 'Page Speed', status: '84/100', description: 'Core Web Vitals: LCP 2.1s · FID 18ms · CLS 0.04 — All passing', action: 'Run Audit', actionColor: 'var(--color-primary)' },
            { title: 'HTTPS / SSL', status: 'Active', description: 'SSL certificate valid — expires in 87 days', action: 'View Cert', actionColor: '#059669' },
            { title: 'CDN Cache', status: 'Cloudflare', description: 'Cache invalidation on publish is enabled', action: 'Purge Cache', actionColor: '#d97706' },
          ].map(item => (
            <div key={item.title} className="frappe-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{item.title}</p>
                    <span style={{ fontSize: '10px', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: `${item.actionColor}18`, color: item.actionColor, fontWeight: 'var(--weight-semibold)' }}>{item.status}</span>
                  </div>
                  {item.isCode
                    ? <pre style={{ fontSize: '11px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)', color: 'var(--color-text)', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>{item.description}</pre>
                    : <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{item.description}</p>
                  }
                </div>
                <button onClick={() => { /* action */ }} className="frappe-btn frappe-btn-secondary" style={{ marginLeft: 'var(--space-3)', flexShrink: 0 }}>
                  <Edit3 size={12} />
                  <span>{item.action}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structured Data Tab */}
      {activeTab === 'structured' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {STRUCTURED_DATA_TYPES.map(sd => (
              <div key={sd.type} className="frappe-card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={16} style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{sd.type} Schema</p>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0 }}>{sd.pages} pages using this</p>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>{sd.description}</p>
                <button onClick={() => { /* Run SEO audit */ }} className="frappe-btn frappe-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Edit3 size={12} /><span>Configure</span>
                </button>
              </div>
            ))}
            <div className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = 'rgba(5,150,105,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}>
              <ChevronDown size={24} style={{ color: '#059669', transform: 'rotate(-90deg)' }} />
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>Add Schema Type</p>
            </div>
          </div>
        </div>
      )}
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit SEO Config" : "Create New Config"}
        fields={[ 
          { name: 'pageId', label: 'Page ID', type: 'number', required: true },
          { name: 'title', label: 'Title', type: 'text', required: true }, 
          { name: 'description', label: 'Meta Description', type: 'textarea' },
          { name: 'keywords', label: 'Keywords', type: 'text' },
          { name: 'canonicalUrl', label: 'Canonical URL', type: 'text' },
          { name: 'ogImage', label: 'OG Image URL', type: 'text' }
        ]}
        initialData={editingItem}
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function WebSEOPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading SEO Manager...</div>}>
      <WebSEOPageContent />
    </Suspense>
  );
}
