'use client';

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
   
  Upload, 
  CheckCircle, 
  Clock, 
  PenTool, 
  History
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
}

interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}

interface DocumentItem {
  id: string;
  name: string;
  signatureStatus?: string;
  versions?: DocumentVersion[];
}

export default function DocumentsPage() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [signerEmail, setSignerEmail] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const fRes = await fetch('http://localhost:3001/documents/folders', { headers });
      const fData = await fRes.json();
      setFolders(Array.isArray(fData) ? fData : []);

      const dRes = await fetch('http://localhost:3001/documents', { headers });
      const dData = await dRes.json();
      setDocuments(Array.isArray(dData) ? dData : []);
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async () => {
    try {
      const name = prompt('Enter document name (e.g. ServiceAgreement.pdf):');
      if (!name) return;

      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          fileUrl: `https://unerp-storage.local/${name.toLowerCase().replace(/ /g, '_')}`,
          fileSize: Math.floor(Math.random() * 500000) + 50000
        })
      });
      loadData();
    } catch {
      // Handle error
    }
  };

  const handleRequestSignature = async (docId: string) => {
    if (!signerEmail) {
      alert('Please enter a signer email.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/documents/${docId}/signatures/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signerEmail })
      });
      alert('Signature request sent successfully!');
      setSignerEmail('');
      loadData();
    } catch {
      // Handle error
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/documents/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      loadData();
    } catch {
      // Handle error
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Folder style={{ color: 'var(--color-primary)' }} />
            Document Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage organization folders, documents, version control, and digital signatures.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateFolder} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            New Folder
          </button>
          <button onClick={handleUpload} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Upload size={16} /> Upload File
          </button>
        </div>
      </div>

      {/* Folders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Folders</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {folders.map(f => (
            <div key={f.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3.5) var(--space-4)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer'
            }}>
              <Folder size={20} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{f.name}</span>
            </div>
          ))}
          {folders.length === 0 && (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>No folders in root.</span>
          )}
        </div>
      </div>

      {/* Main Panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Documents list */}
        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
        }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Documents</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {documents.map(d => (
              <div 
                key={d.id} 
                onClick={() => setSelectedDoc(d)}
                style={{
                  padding: 'var(--space-3.5)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer', background: selectedDoc?.id === d.id ? 'var(--color-bg)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{d.name}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                      Size: {d.versions?.[0] ? `${(d.versions[0].fileSize / 1024).toFixed(1)} KB` : 'Template'}
                    </p>
                  </div>
                </div>
                
                {/* Signature status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                  {d.signatureStatus === 'SIGNED' ? (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle size={10} /> Signed
                    </span>
                  ) : d.signatureStatus === 'PENDING' ? (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', background: 'var(--color-warning-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={10} /> Pending
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      None
                    </span>
                  )}
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--space-4)' }}>
                No documents found. Upload a file to start.
              </p>
            )}
          </div>
        </div>

        {/* Selected Doc Details / Action Drawer */}
        {selectedDoc ? (
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
          }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{selectedDoc.name}</h3>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Status: {selectedDoc.signatureStatus}</p>
            </div>

            {/* Request Signature Form */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <PenTool size={14} /> Request E-Signature
              </label>
              <input 
                type="email" 
                placeholder="signer@company.com"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                style={{
                  width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text)'
                }}
              />
              <button 
                onClick={() => handleRequestSignature(selectedDoc.id)}
                style={{
                  background: 'var(--color-primary)', color: '#ffffff', border: 'none',
                  padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)'
                }}
              >
                Send Request
              </button>
            </div>

            {/* Version History */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                <History size={14} /> Version History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedDoc.versions?.map((v: DocumentVersion) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', padding: 'var(--space-1.5) 0', borderBottom: '1px dashed var(--color-border)' }}>
                    <span>v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})</span>
                    <a href={v.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Download</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)'
          }}>
            Select a document to view version history and request electronic signatures.
          </div>
        )}
      </div>
    </div>
  );
}
