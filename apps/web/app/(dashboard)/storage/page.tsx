'use client';

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  RefreshCw, 
  Upload, 
  FileText, 
  Download, 
  FileBadge,
  Database,
  Search,
  Sparkles
} from 'lucide-react';

interface StoredFile {
  id: string;
  name: string;
  fileKey: string;
  size: number;
}

interface GeneratedDoc {
  id: string;
  documentId: string;
  templateId: string;
  createdAt: string;
  fileUrl: string;
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'generated'>('files');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [filesRes, genRes] = await Promise.all([
        fetch('http://localhost:3001/storage/files', { headers }),
        fetch('http://localhost:3001/storage/generated', { headers }),
      ]);

      const [filesData, genData] = await Promise.all([
        filesRes.json(), genRes.json()
      ]);

      setFiles(Array.isArray(filesData) ? filesData : []);
      setGeneratedDocs(Array.isArray(genData) ? genData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadFile = async () => {
    const name = prompt('Enter file name to upload (e.g. contract.pdf):');
    if (!name) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/storage/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          bucket: 'unerp-central-storage',
          fileKey: `uploads/${Date.now()}_${name.toLowerCase().replace(/ /g, '_')}`,
          size: Math.floor(Math.random() * 800000) + 100000,
          mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'image/png'
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Upload failed.');
      }
    } catch {
      alert('Error uploading file.');
    }
  };

  const handleGenerateMockPDF = async () => {
    const documentId = prompt('Enter reference Document ID (e.g., doc-invoice-01):', 'doc-inv-101');
    if (!documentId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/storage/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          templateId: 'tpl-invoice-standard',
          format: 'PDF'
        })
      });
      if (res.ok) {
        loadData();
        alert('PDF generated successfully!');
      } else {
        alert('Failed to generate document.');
      }
    } catch {
      alert('Error generating document.');
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Central Storage Explorer...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <HardDrive style={{ color: 'var(--color-primary)' }} />
            S3 File Storage & Templates
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Upload assets to S3 compatible buckets, run security logs, and generate PDF transaction templates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleGenerateMockPDF} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <FileBadge size={16} style={{ color: 'var(--color-primary)' }} /> Generate PDF
          </button>
          <button onClick={handleUploadFile} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: 'var(--color-bg-elevated)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Upload size={16} /> Upload to S3
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('files')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'files' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'files' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Database size={16} /> S3 Central Explorer
        </button>
        <button 
          onClick={() => setActiveTab('generated')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'generated' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'generated' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <FileText size={16} /> Generated PDF Templates
        </button>
      </div>

      {/* Main Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Tab view */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Filter S3 files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)'
                  }}
                />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>File Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Key</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Size</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{f.name}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{f.fileKey}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{(f.size / 1024).toFixed(1)} KB</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Download size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No files found in S3 bucket.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'generated' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Generated Documents PDF</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {generatedDocs.map(g => (
                  <div key={g.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Doc Ref: {g.documentId}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Template: {g.templateId}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Date: {new Date(g.createdAt).toLocaleDateString()}</p>
                    </div>
                    <a href={g.fileUrl} target="_blank" rel="noreferrer" style={{ background: 'var(--color-primary-light)', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      Download PDF
                    </a>
                  </div>
                ))}
                {generatedDocs.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No generated documents found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            MinIO & AWS S3 Buckets
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Files uploaded in the Central Explorer utilize MinIO S3 configurations locally and route through S3-compatible SDK APIs.
          </p>
        </div>

      </div>
    </div>
  );
}
