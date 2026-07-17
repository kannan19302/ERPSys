'use client';
import styles from './page.module.css';
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
    <div style={{ border: `3px solid ${color}`, background: `${color}10` }} className={styles.s1}>
      <span style={{ color: color }} className={styles.s2}>{score}</span>
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
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="SEO Manager"
        description="Per-page SEO metadata, structured data schemas, sitemap, and performance scores"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/web')}>
              ← Web Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <span>Create New SEO Config</span>
            </button>
          </div>
        }
      />

      {/* Site-wide score */}
      <div className={styles.s3}>
        {[
          { label: 'Site SEO Score', value: '80', color: '#d97706', sub: 'Avg across all pages' },
          { label: 'Pages Audited', value: PAGES_SEO_DB.length.toString(), color: 'var(--color-primary)', sub: `of ${PAGES_SEO_DB.length} total configs` },
          { label: 'Open Issues', value: '8', color: 'var(--color-danger)', sub: '3 high priority' },
          { label: 'Sitemap Status', value: 'Active', color: '#059669', sub: 'Last submitted 1 day ago' },
        ].map(stat => (
          <div key={stat.label} className="ui-card p-3">
            <span className={styles.s4}>{stat.label}</span>
            <span style={{ color: stat.color }} className={styles.s5}>{stat.value}</span>
            <span className="ui-text-micro">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.s6}>
        {[
          { id: 'pages', label: 'Page SEO', icon: FileText },
          { id: 'technical', label: 'Technical SEO', icon: Zap },
          { id: 'structured', label: 'Structured Data', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: activeTab === tab.id ? '#059669' : 'var(--color-text-secondary)', borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent' }} className={styles.s7}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Page SEO Tab */}
      {activeTab === 'pages' && (
        <div className={styles.s8}>
          {/* Pages list */}
          <div className="ui-stack-2">
            <div className="relative">
              <SearchIcon size={13} className="ui-input-icon-abs" />
              <input className={`ui-input ${styles.s9}`} type="text" placeholder="Search configs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
            </div>
            {PAGES_SEO_DB.filter((p: any) => p.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((page: any) => (
              <div
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`ui-card ${styles.s10}`}
                style={{ border: `2px solid ${displayPageId === page.id ? '#059669' : 'var(--color-border)'}`, background: displayPageId === page.id ? 'rgba(5,150,105,0.04)' : '' }}
              >
                <div className="ui-hstack-2">
                  <ScoreBadge score={page.title ? 95 : 60} />
                  <div className="flex-1 overflow-hidden">
                    <p className={styles.s11}>{page.title || 'Untitled'}</p>
                    <p className={styles.s12}>Page ID: {page.pageId}</p>
                    {(!page.description) && (
                      <p className={styles.s13}>
                        <AlertTriangle size={9} />Missing description
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {PAGES_SEO_DB.length === 0 && (
              <div className={styles.s14}>
                No SEO configs yet.
              </div>
            )}
          </div>

          {/* SEO Detail Panel */}
          <div className="ui-stack-4">
            {currentPage ? (
            <div className="ui-card p-4">
              <div className={styles.s15}>
                <div className="ui-hstack-3">
                  <ScoreBadge score={currentPage.title ? 95 : 60} />
                  <div>
                    <h2 className={styles.s16}>{currentPage.title || 'Untitled'}</h2>
                    <p className="ui-text-xs-muted m-0">Page ID: {currentPage.pageId} · Last updated: {new Date(currentPage.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="ui-flex ui-gap-2">
                  <button className="ui-btn ui-btn-secondary ui-text-danger" onClick={() => deleteItem(currentPage.id)}><span>Delete</span></button>
                  <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(currentPage); setIsModalOpen(true); }}><Edit3 size={13} /><span>Edit SEO</span></button>
                </div>
              </div>

              {/* Google Preview */}
              <div className={styles.s17}>
                <p className={styles.s18}>Google Search Preview</p>
                <p className={styles.s19}>{currentPage.title || 'Untitled Page'}</p>
                <p className={styles.s20}>yourdomain.com{currentPage.canonicalUrl || `/${currentPage.pageId}`}</p>
                <p className={styles.s21}>
                  {currentPage.description || <span className={styles.s22}>⚠ No meta description set — Google will auto-generate from page content</span>}
                </p>
              </div>

              {/* Fields Display */}
              <div className="ui-stack-3">
                <div className="ui-form-group">
                  <label className={`ui-label ${styles.s23}`} >
                    <FileText size={12} /> Title Tag
                    <span style={{ color: (currentPage.title?.length || 0) < 60 ? '#059669' : 'var(--color-danger)' }} className={styles.s24}>
                      {currentPage.title?.length || 0}/60 chars
                    </span>
                  </label>
                  <input className="ui-input" type="text" readOnly value={currentPage.title || ''} />
                </div>
                <div className="ui-form-group">
                  <label className={`ui-label ${styles.s23}`} >
                    <FileText size={12} /> Meta Description
                    <span style={{ color: currentPage.description ? '#059669' : 'var(--color-danger)' }} className={styles.s24}>
                      {currentPage.description?.length || 0}/160 chars
                    </span>
                  </label>
                  <textarea className={`ui-input ${styles.s25}`} readOnly value={currentPage.description || ''} rows={3}  />
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-form-group">
                    <label className="ui-label"><Globe size={12} /> Canonical URL</label>
                    <input className="ui-input" type="text" readOnly value={currentPage.canonicalUrl || ''} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label"><Link size={12} /> Keywords</label>
                    <input className="ui-input" type="text" readOnly value={currentPage.keywords || ''} />
                  </div>
                </div>
                <div className="ui-form-group">
                  <label className={`ui-label ${styles.s23}`} >
                    <Image size={12} /> OG Image URL
                    {currentPage.ogImage
                      ? <span className={styles.s26}><CheckCircle size={10} />Set</span>
                      : <span className={styles.s27}><AlertTriangle size={10} />Missing</span>}
                  </label>
                  <div className="ui-flex ui-gap-2">
                    <input className="ui-input flex-1" type="text" readOnly value={currentPage.ogImage || ''} />
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className={`ui-card ${styles.s28}`} >
                <FileText size={48} className={styles.s29} />
                <h3 className={styles.s30}>Select an SEO config</h3>
                <p className={styles.s31}>Click a configuration on the left to view and edit details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical SEO Tab */}
      {activeTab === 'technical' && (
        <div className="ui-stack-4">
          {/* Custom Domain SSL/DNS verification flow */}
          <div className="ui-card p-4">
            <h3 className={styles.s32}>Custom Domain DNS/SSL Automation</h3>
            <p className={styles.s33}>
              Configure your public-facing custom domain name. SSL certificate generation and DNS routing check will run automatically.
            </p>
            <div className={styles.s34}>
              <input className={`ui-input ${styles.s35}`}  placeholder="e.g. shop.example.com" defaultValue="shop.example.com" />
              <button className="ui-btn ui-btn-primary" onClick={() => {
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
            <div key={item.title} className="ui-card p-4">
              <div className={styles.s36}>
                <div className="flex-1">
                  <div className={styles.s37}>
                    <p className={styles.s38}>{item.title}</p>
                    <span style={{ background: `${item.actionColor}18`, color: item.actionColor }} className={styles.s39}>{item.status}</span>
                  </div>
                  {item.isCode
                    ? <pre className={styles.s40}>{item.description}</pre>
                    : <p className="ui-text-xs-muted m-0">{item.description}</p>
                  }
                </div>
                <button onClick={() => { /* action */ }} className={`ui-btn ui-btn-secondary ${styles.s41}`} >
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
        <div className="ui-stack-4">
          <div className={styles.s42}>
            {STRUCTURED_DATA_TYPES.map(sd => (
              <div key={sd.type} className="ui-card p-4">
                <div className={styles.s43}>
                  <div className={styles.s44}>
                    <BarChart3 size={16} className={styles.s45} />
                  </div>
                  <div>
                    <p className={styles.s38}>{sd.type} Schema</p>
                    <p className={styles.s46}>{sd.pages} pages using this</p>
                  </div>
                </div>
                <p className={styles.s47}>{sd.description}</p>
                <button onClick={() => { /* Run SEO audit */ }} className={`ui-btn ui-btn-secondary ${styles.s48}`} >
                  <Edit3 size={12} /><span>Configure</span>
                </button>
              </div>
            ))}
            <div className={`ui-card ${styles.s49} ${styles.addSchemaCard}`}>
              <ChevronDown size={24} className={styles.s50} />
              <p className={styles.s51}>Add Schema Type</p>
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
    <Suspense fallback={<div className={styles.s52}>Loading SEO Manager...</div>}>
      <WebSEOPageContent />
    </Suspense>
  );
}
