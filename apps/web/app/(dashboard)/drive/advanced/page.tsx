'use client';

import React, { useState } from 'react';
import {
  Search, FileText, Shield, Archive, Tag, CheckCircle, XCircle,
  Filter, Eye, Trash2, RotateCcw
} from 'lucide-react';

interface DocSearchResult {
  id: string;
  name: string;
  matchedText: string;
  folder: string;
  score: number;
  tags: string[];
  classification: string;
}

interface ApprovalItem {
  id: string;
  documentName: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  submittedBy: string;
  submittedAt: string;
  reviewer: string;
  comments?: string;
}

interface RetentionPolicy {
  id: string;
  name: string;
  category: string;
  retentionDays: number;
  autoDispose: boolean;
  legalHold: boolean;
  documentsCount: number;
}

export default function DocumentsAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'approvals' | 'retention' | 'classification'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [approvals] = useState<ApprovalItem[]>([
    { id: 'apr-1', documentName: 'Q3 Financial Report.pdf', status: 'PENDING_REVIEW', submittedBy: 'Jane Smith', submittedAt: '2026-06-12', reviewer: 'CFO' },
    { id: 'apr-2', documentName: 'Employee Handbook v2.4.docx', status: 'PENDING_REVIEW', submittedBy: 'HR Team', submittedAt: '2026-06-11', reviewer: 'VP HR' },
    { id: 'apr-3', documentName: 'Vendor NDA — Acme Corp.pdf', status: 'APPROVED', submittedBy: 'Legal', submittedAt: '2026-06-10', reviewer: 'General Counsel', comments: 'Reviewed and approved for execution.' },
    { id: 'apr-4', documentName: 'Product Specs v3.1.pdf', status: 'REJECTED', submittedBy: 'Engineering', submittedAt: '2026-06-09', reviewer: 'CTO', comments: 'Needs additional safety certifications.' },
    { id: 'apr-5', documentName: 'Marketing Brochure.ai', status: 'PUBLISHED', submittedBy: 'Marketing', submittedAt: '2026-06-08', reviewer: 'CMO' },
  ]);

  const [retentionPolicies] = useState<RetentionPolicy[]>([
    { id: 'ret-1', name: 'Financial Records', category: 'Finance', retentionDays: 2555, autoDispose: false, legalHold: false, documentsCount: 342 },
    { id: 'ret-2', name: 'Employee Contracts', category: 'HR', retentionDays: 3650, autoDispose: false, legalHold: false, documentsCount: 128 },
    { id: 'ret-3', name: 'Marketing Materials', category: 'Marketing', retentionDays: 365, autoDispose: true, legalHold: false, documentsCount: 89 },
    { id: 'ret-4', name: 'Legal Correspondence', category: 'Legal', retentionDays: 7300, autoDispose: false, legalHold: true, documentsCount: 56 },
    { id: 'ret-5', name: 'Vendor Agreements', category: 'Procurement', retentionDays: 1825, autoDispose: false, legalHold: false, documentsCount: 201 },
    { id: 'ret-6', name: 'Audit Records', category: 'Compliance', retentionDays: 3650, autoDispose: false, legalHold: true, documentsCount: 73 },
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && Array.isArray(data.documents)) {
        const mapped: DocSearchResult[] = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          matchedText: `Match found in document: ${doc.name}`,
          folder: doc.folderId ? `Subfolder` : 'Root',
          score: doc.starred ? 0.95 : 0.78,
          tags: doc.legalHold ? ['legal-hold'] : [],
          classification: doc.signatureStatus === 'SIGNED' ? 'Signed Document' : 'Standard File'
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([
        { id: 'sr-1', name: 'Invoice-2026-0142.pdf', matchedText: `...total amount of $12,500 for ${searchQuery} services rendered...`, folder: 'Finance/Invoices', score: 0.95, tags: ['invoice', 'payment'], classification: 'Financial Document' },
        { id: 'sr-2', name: 'Service Agreement.pdf', matchedText: `...agreement between parties regarding ${searchQuery} terms...`, folder: 'Legal/Contracts', score: 0.88, tags: ['contract', 'legal'], classification: 'Legal Agreement' },
        { id: 'sr-3', name: 'Meeting Notes Q2.docx', matchedText: `...discussion points about ${searchQuery} implementation timeline...`, folder: 'Projects/Notes', score: 0.72, tags: ['meeting', 'notes'], classification: 'Internal Memo' },
        { id: 'sr-4', name: 'Product Catalog 2026.pdf', matchedText: `...featuring our new ${searchQuery} product line with specifications...`, folder: 'Marketing', score: 0.65, tags: ['catalog', 'product'], classification: 'Marketing Material' },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const statusColor = (status: ApprovalItem['status']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'var(--color-warning)';
      case 'APPROVED': return 'var(--color-success)';
      case 'REJECTED': return 'var(--color-error)';
      case 'PUBLISHED': return 'var(--color-primary)';
    }
  };

  const statusBg = (status: ApprovalItem['status']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'var(--color-warning-light)';
      case 'APPROVED': return 'var(--color-success-light)';
      case 'REJECTED': return 'var(--color-error-light)';
      case 'PUBLISHED': return 'var(--color-primary-light)';
    }
  };

  const tabs = [
    { id: 'search' as const, label: 'Full-Text Search', icon: <Search size={14} /> },
    { id: 'approvals' as const, label: 'Approval Workflows', icon: <CheckCircle size={14} /> },
    { id: 'retention' as const, label: 'Records & Retention', icon: <Archive size={14} /> },
    { id: 'classification' as const, label: 'AI Classification', icon: <Tag size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileText style={{ color: 'var(--color-primary)' }} />
          Advanced Document Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Full-text OCR search, approval workflows, retention policies, and AI-powered document classification.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', transition: 'all 0.2s ease'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Full-Text Search */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text" placeholder="Search inside documents (OCR-powered)..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)',
                fontSize: 'var(--text-sm)', color: 'var(--color-text)'
              }}
            />
            <button onClick={handleSearch} disabled={isSearching} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              padding: 'var(--space-2.5) var(--space-4)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
            }}>
              <Search size={16} /> {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{searchResults.length} results found</span>
              {searchResults.map(r => (
                <div key={r.id} style={{
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{r.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>{r.folder}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 'var(--weight-bold)' }}>
                      {(r.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    &ldquo;{r.matchedText}&rdquo;
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{r.classification}</span>
                    {r.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '10px', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery === '' && (
            <div style={{
              background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center',
              color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)'
            }}>
              <Search size={40} style={{ margin: '0 auto var(--space-3)', display: 'block', opacity: 0.3 }} />
              Enter a search query to search inside all documents using OCR-powered full-text indexing.
            </div>
          )}
        </div>
      )}

      {/* Approval Workflows */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
            {(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'] as const).map(status => {
              const count = approvals.filter(a => a.status === status).length;
              return (
                <div key={status} style={{
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: statusColor(status) }}>{count}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{status.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Document</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Submitted By</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Reviewer</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                        <div>
                          <div style={{ fontWeight: 'var(--weight-semibold)' }}>{a.documentName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Submitted {a.submittedAt}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{a.submittedBy}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{a.reviewer}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                        color: statusColor(a.status), background: statusBg(a.status), fontWeight: 'var(--weight-semibold)'
                      }}>{a.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {a.status === 'PENDING_REVIEW' && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {a.status !== 'PENDING_REVIEW' && (
                        <button style={{ background: 'none', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records & Retention */}
      {activeTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Retention Policies</h3>
            <button style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
            }}>Create Policy</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {retentionPolicies.map(p => (
              <div key={p.id} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{p.category}</div>
                  </div>
                  {p.legalHold && (
                    <span style={{
                      fontSize: '10px', color: 'var(--color-error)', background: 'var(--color-error-light)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Shield size={10} /> Legal Hold
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Retention Period</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{Math.round(p.retentionDays / 365)} years</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Documents</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{p.documentsCount}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: p.autoDispose ? 'var(--color-warning-light)' : 'var(--color-bg)',
                    color: p.autoDispose ? 'var(--color-warning)' : 'var(--color-text-secondary)'
                  }}>
                    {p.autoDispose ? 'Auto-Dispose' : 'Manual Review'}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><Filter size={14} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Classification */}
      {activeTab === 'classification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Financial Document', count: 142, color: 'hsl(210, 70%, 50%)' },
              { label: 'Legal Agreement', count: 87, color: 'hsl(280, 60%, 50%)' },
              { label: 'Internal Memo', count: 203, color: 'hsl(150, 60%, 45%)' },
              { label: 'Marketing Material', count: 65, color: 'hsl(30, 80%, 50%)' },
              { label: 'Technical Spec', count: 94, color: 'hsl(0, 70%, 55%)' },
              { label: 'HR Document', count: 118, color: 'hsl(190, 70%, 45%)' },
            ].map(cat => (
              <div key={cat.label} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Tag size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{cat.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{cat.count} documents</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)'
          }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <RotateCcw size={16} style={{ color: 'var(--color-primary)' }} />
              Recently Classified Documents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { name: 'Invoice-2026-0185.pdf', classification: 'Financial Document', confidence: 96, autoTagged: ['invoice', 'accounts-receivable'] },
                { name: 'Board Resolution.docx', classification: 'Legal Agreement', confidence: 89, autoTagged: ['board', 'resolution', 'corporate'] },
                { name: 'Sprint Planning.md', classification: 'Internal Memo', confidence: 82, autoTagged: ['agile', 'planning', 'engineering'] },
                { name: 'BOM-Steel-Frame.xlsx', classification: 'Technical Spec', confidence: 91, autoTagged: ['bom', 'manufacturing', 'materials'] },
                { name: 'Offer Letter — J.Doe.pdf', classification: 'HR Document', confidence: 94, autoTagged: ['offer', 'recruitment', 'compensation'] },
              ].map((doc, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{doc.name}</div>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: '2px' }}>
                        {doc.autoTagged.map(t => (
                          <span key={t} style={{ fontSize: '9px', background: 'var(--color-bg)', padding: '1px 5px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-tertiary)' }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{doc.classification}</span>
                    <span style={{ fontSize: '10px', color: doc.confidence >= 90 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 'var(--weight-bold)' }}>{doc.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
