'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Folder, 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Star, 
  Clock, 
  Trash2, 
  Users, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Info, 
  Lock, 
  Unlock, 
  MoreVertical, 
  Edit2, 
  Key, 
  Calendar, 
  ChevronRight, 
  HardDrive,
  File,
  RefreshCw
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  starred: boolean;
  deletedAt: string | null;
  legalHold: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  shares?: FolderShare[];
}

interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  createdBy: string;
  iv: string;
}

interface DocumentItem {
  id: string;
  name: string;
  starred: boolean;
  deletedAt: string | null;
  legalHold: boolean;
  signatureStatus: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
  shares?: DocumentShare[];
}

interface FolderShare {
  id: string;
  userId: string;
  role: string;
  password?: string;
  expiresAt?: string;
}

interface DocumentShare {
  id: string;
  userId: string;
  role: string;
  password?: string;
  expiresAt?: string;
}

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UsageStats {
  usedBytes: number;
  totalLimitBytes: number;
  categories: {
    documents: number;
    images: number;
    others: number;
  };
}

function DrivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation & View States
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<Array<{ id: string; name: string }>>([]);

  const queryView = searchParams.get('view') || 'personal';
  const view: 'personal' | 'shared' | 'starred' | 'recent' | 'trash' =
    (queryView === 'shared' || queryView === 'starred' || queryView === 'recent' || queryView === 'trash')
      ? queryView
      : 'personal';
  
  // Data States
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'document'; data: any } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modals & Popups
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Share Form States
  const [shareUserId, setShareUserId] = useState('');
  const [shareRole, setShareRole] = useState('VIEWER');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Detail Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Load baseline environment data
  const loadData = async (folderId: string | null = currentFolderId, currentView = view) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load folders
      const folderQuery = new URLSearchParams();
      if (folderId) folderQuery.append('parentId', folderId);
      folderQuery.append('view', currentView);
      
      const fRes = await fetch(`/api/v1/drive/folders?${folderQuery.toString()}`, { headers });
      const fData = await fRes.json();
      setFolders(Array.isArray(fData) ? fData : []);

      // Load documents
      const docQuery = new URLSearchParams();
      if (folderId) docQuery.append('folderId', folderId);
      docQuery.append('view', currentView);

      const dRes = await fetch(`/api/v1/drive/documents?${docQuery.toString()}`, { headers });
      const dData = await dRes.json();
      setDocuments(Array.isArray(dData) ? dData : []);

      // Load stats
      const uRes = await fetch('/api/v1/drive/usage', { headers });
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsage(uData);
      }
    } catch (err) {
      showToast('Failed to load drive items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load static system users once
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/drive/users', { headers });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch {}
    };
    loadUsers();
  }, []);

  // Reactively load data when folder or view changes
  useEffect(() => {
    loadData(currentFolderId, view);
  }, [currentFolderId, view]);

  // Reactively reset navigation state when view changes
  useEffect(() => {
    setCurrentFolderId(null);
    setPathStack([]);
    setSelectedItem(null);
    setIsSearching(false);
    setSearchQuery('');
  }, [view]);

  // Handle outside click for New dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Folder navigation helpers
  const handleEnterFolder = (folder: FolderItem) => {
    if (currentFolderId === folder.id) return;
    setSelectedItem({ type: 'folder', data: folder });
    setCurrentFolderId(folder.id);
    setPathStack(prev => {
      if (prev.some(item => item.id === folder.id)) {
        return prev;
      }
      return [...prev, { id: folder.id, name: folder.name }];
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root (My Drive)
      setCurrentFolderId(null);
      setPathStack([]);
    } else {
      const target = pathStack[index];
      if (!target) return;
      const newStack = pathStack.slice(0, index + 1);
      setCurrentFolderId(target.id);
      setPathStack(newStack);
    }
  };

  const handleViewChange = (newView: typeof view) => {
    setCurrentFolderId(null);
    setPathStack([]);
    setSelectedItem(null);
    setIsSearching(false);
    setSearchQuery('');
    router.push(newView === 'personal' ? '/drive' : `/drive?view=${newView}`);
  };

  // Create Folder
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/drive/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId
        })
      });
      if (res.ok) {
        showToast(`Folder "${newFolderName}" created successfully.`, 'success');
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        loadData(currentFolderId, view);
      } else {
        showToast('Failed to create folder.', 'error');
      }
    } catch {
      showToast('Error creating folder.', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }

    try {
      showToast(`Uploading "${file.name}"...`, 'warning');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/drive/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showToast(`Uploaded & Encrypted "${file.name}" successfully!`, 'success');
        loadData(currentFolderId, view);
      } else {
        showToast('Failed to upload file.', 'error');
      }
    } catch {
      showToast('Error uploading file.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItem || selectedItem.type !== 'document') return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast(`Uploading version for "${selectedItem.data.name}"...`, 'warning');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/documents/${selectedItem.data.id}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showToast('New version uploaded & encrypted successfully.', 'success');
        const updatedDoc = await res.json();
        setSelectedItem({ type: 'document', data: updatedDoc });
        loadData(currentFolderId, view);
      } else {
        showToast('Failed to upload version.', 'error');
      }
    } catch {
      showToast('Error uploading version.', 'error');
    } finally {
      if (versionInputRef.current) versionInputRef.current.value = '';
    }
  };

  // Star / Unstar
  const handleToggleStar = async () => {
    if (!selectedItem) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}/star`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedItem({ type, data: updated });
        showToast(updated.starred ? 'Added to Starred.' : 'Removed from Starred.', 'success');
        loadData(currentFolderId, view);
      }
    } catch {
      showToast('Failed to update star state.', 'error');
    }
  };

  // Legal Hold Toggle (Box feature)
  const handleToggleLegalHold = async () => {
    if (!selectedItem) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}/legal-hold`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedItem({ type, data: updated });
        showToast(updated.legalHold ? 'Legal hold activated.' : 'Legal hold released.', 'success');
        loadData(currentFolderId, view);
      }
    } catch {
      showToast('Failed to toggle legal hold.', 'error');
    }
  };

  // Move to Trash
  const handleMoveToTrash = async () => {
    if (!selectedItem) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;
    if (selectedItem.data.legalHold) {
      showToast('Cannot delete item under active Legal Hold.', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Moved item to Trash.', 'success');
        setSelectedItem(null);
        loadData(currentFolderId, view);
      }
    } catch {
      showToast('Failed to trash item.', 'error');
    }
  };

  // Restore from Trash
  const handleRestore = async () => {
    if (!selectedItem) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Item restored successfully.', 'success');
        setSelectedItem(null);
        loadData(currentFolderId, view);
      }
    } catch {
      showToast('Failed to restore item.', 'error');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}/permanent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Item permanently deleted.', 'success');
        setSelectedItem(null);
        loadData(currentFolderId, view);
      }
    } catch {
      showToast('Failed to permanently delete item.', 'error');
    }
  };

  // Share Configuration (OneDrive features)
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !shareUserId) return;
    const type = selectedItem.type;
    const id = selectedItem.data.id;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/${type}s/${id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: shareUserId,
          role: shareRole,
          password: sharePassword || undefined,
          expiresAt: shareExpiresAt || undefined
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedItem({ type, data: updated });
        showToast('Permissions updated successfully.', 'success');
        setShareUserId('');
        setSharePassword('');
        setShareExpiresAt('');
      } else {
        showToast('Failed to update share permissions.', 'error');
      }
    } catch {
      showToast('Error sharing item.', 'error');
    }
  };

  // Full Text Search trigger
  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!searchQuery.trim()) {
        setIsSearching(false);
        loadData(currentFolderId, view);
        return;
      }
      setIsSearching(true);
      setSelectedItem(null);
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/v1/drive/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
        }
      } catch {
        showToast('Search failed.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Trigger signature request
  const [signatureEmail, setSignatureEmail] = useState('');
  const handleRequestSignature = async () => {
    if (!selectedItem || selectedItem.type !== 'document' || !signatureEmail) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/drive/documents/${selectedItem.data.id}/signatures/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signerEmail: signatureEmail })
      });
      if (res.ok) {
        showToast('Signature request sent successfully!', 'success');
        setSignatureEmail('');
        loadData(currentFolderId, view);
      } else {
        showToast('Failed to send signature request.', 'error');
      }
    } catch {
      showToast('Error requesting signature.', 'error');
    }
  };

  // File Download Helper (calls decrypter endpoint)
  const handleDownloadFile = (versionId: string, filename: string) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/drive/documents/versions/${versionId}/download`;
    
    // Download using fetch to attach headers (Bearer Token)
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Decrypted file downloaded successfully.', 'success');
    })
    .catch(() => {
      showToast('Failed to download decrypted file.', 'error');
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', margin: 'calc(-1 * var(--space-4))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-item toast-${toast.type}`} style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3.5) var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderLeft: `4px solid var(--color-${toast.type === 'error' ? 'danger' : toast.type})`
        }}>
          {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />}
          {toast.type === 'warning' && <Clock size={18} style={{ color: 'var(--color-warning)' }} />}
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{toast.message}</span>
        </div>
      )}

      {/* Main Area Explorer */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)'
      }}>
        {/* Top Search Bar */}
        <div style={{
          padding: 'var(--space-3) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          background: 'var(--color-bg-elevated)'
        }}>
          {/* + New Button */}
          <div ref={newMenuRef} style={{ position: 'relative', zIndex: 50 }}>
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="frappe-btn frappe-btn-primary" 
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)'
              }}
            >
              <Plus size={16} />
              <span>New</span>
            </button>

            {/* New Dropdown menu */}
            {isNewMenuOpen && (
              <div className="frappe-dropdown frappe-dropdown-left" style={{ display: 'flex', width: '200px', marginTop: 'var(--space-2)', position: 'absolute', left: 0, top: '100%' }}>
                <button 
                  onClick={() => { setIsCreateFolderOpen(true); setIsNewMenuOpen(false); }}
                  className="frappe-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: 'var(--space-2.5) var(--space-3.5)' }}
                >
                  <Folder size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>New Folder</span>
                </button>
                <div className="frappe-dropdown-divider" />
                <button 
                  onClick={() => { fileInputRef.current?.click(); setIsNewMenuOpen(false); }}
                  className="frappe-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: 'var(--space-2.5) var(--space-3.5)' }}
                >
                  <Upload size={16} style={{ color: 'var(--color-success)' }} />
                  <span>Upload File</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </div>
            )}
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
            <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search in Drive (Press Enter to execute)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="frappe-input"
              style={{ paddingLeft: 'var(--space-9)', width: '100%' }}
            />
          </div>
          
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="frappe-btn frappe-btn-secondary frappe-btn-icon"
            title="Toggle Details"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Breadcrumb Navigation Trail */}
        <div style={{
          padding: 'var(--space-3) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-bg)',
          gap: 'var(--space-2.5)'
        }}>
          <button 
            onClick={() => handleBreadcrumbClick(-1)}
            style={{ border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}
          >
            {isSearching ? 'Search Results' : view === 'personal' ? 'My Drive' : view.charAt(0).toUpperCase() + view.slice(1)}
          </button>

          {!isSearching && pathStack.map((folder, index) => (
            <React.Fragment key={`${folder.id}-${index}`}>
              <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
              <button 
                onClick={() => handleBreadcrumbClick(index)}
                style={{ border: 'none', background: 'none', color: index === pathStack.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: index === pathStack.length - 1 ? 'var(--weight-bold)' : 'var(--weight-semibold)' }}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}

          {loading && <RefreshCw size={14} className="animate-spin" style={{ marginLeft: 'var(--space-2)', color: 'var(--color-primary)' }} />}
        </div>

        {/* Files & Folders List Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {/* Folders Section */}
          {folders.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)', letterSpacing: '0.05em' }}>
                Folders
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onDoubleClick={() => handleEnterFolder(folder)}
                    onClick={() => setSelectedItem({ type: 'folder', data: folder })}
                    className="frappe-card"
                    style={{
                      padding: 'var(--space-4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      margin: 0,
                      backgroundColor: selectedItem?.type === 'folder' && selectedItem.data.id === folder.id ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)',
                      border: selectedItem?.type === 'folder' && selectedItem.data.id === folder.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Folder size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {folder.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                        Created {new Date(folder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {folder.starred && <Star size={14} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />}
                    {folder.legalHold && <Shield size={14} style={{ color: 'var(--color-danger)' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents/Files Section */}
          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)', letterSpacing: '0.05em' }}>
              Files
            </h3>

            <div className="frappe-card" style={{ padding: 0, margin: 0, overflow: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Last Modified</th>
                    <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>File Size</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => {
                    const latestVersion = doc.versions && doc.versions[0];
                    const size = latestVersion ? formatBytes(latestVersion.fileSize) : '--';
                    
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedItem({ type: 'document', data: doc })}
                        onDoubleClick={() => {
                          if (latestVersion) {
                            handleDownloadFile(latestVersion.id, doc.name);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          backgroundColor: selectedItem?.type === 'document' && selectedItem.data.id === doc.id ? 'var(--color-primary-light)' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <FileText size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.name}
                              </p>
                              <div style={{ display: 'flex', gap: 'var(--space-1.5)', alignItems: 'center', marginTop: '2px' }}>
                                {doc.starred && <Star size={10} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />}
                                {doc.legalHold && <Shield size={10} style={{ color: 'var(--color-danger)' }} />}
                                <span style={{ fontSize: '9px', background: 'var(--color-bg-sunken)', color: 'var(--color-success)', padding: '1px 5px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 'var(--weight-medium)' }}>
                                  <Lock size={8} /> AES-256
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {doc.signatureStatus === 'SIGNED' ? (
                            <span style={{ fontSize: '10px', color: 'var(--color-success)', background: 'rgba(40, 167, 69, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)' }}>
                              Signed
                            </span>
                          ) : doc.signatureStatus === 'PENDING' ? (
                            <span style={{ fontSize: '10px', color: 'var(--color-warning)', background: 'rgba(255, 193, 7, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)' }}>
                              Pending Sign
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                              Standard
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {new Date(doc.updatedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {size}
                        </td>
                      </tr>
                    );
                  })}

                  {documents.length === 0 && folders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <HardDrive size={36} style={{ opacity: 0.3 }} />
                          <span style={{ fontSize: 'var(--text-sm)' }}>No folders or files in this view.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer Panel (Details & Advanced Actions) */}
      {isDrawerOpen && (
        <div style={{
          width: '360px',
          borderLeft: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Scrollable details content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selectedItem ? (
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                
                {/* Header Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
                  {selectedItem.type === 'folder' ? (
                    <Folder size={36} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  ) : (
                    <FileText size={36} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0, wordBreak: 'break-all' }}>
                      {selectedItem.data.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span>Type: {selectedItem.type === 'folder' ? 'Folder' : 'File'}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>Owner: {selectedItem.data.createdBy}</span>
                    </p>
                  </div>
                </div>

                {/* Encryption & Security Indicator */}
                {selectedItem.type === 'document' && (
                  <div style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(40, 167, 69, 0.05)',
                    border: '1px solid rgba(40, 167, 69, 0.15)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'rgba(40, 167, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)', textTransform: 'uppercase', margin: 0 }}>
                        Envelope Encryption Active
                      </h4>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        AES-256 on-the-fly encrypted in MinIO Object Storage
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions (Star, Legal Hold, Trash) */}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button 
                    onClick={handleToggleStar}
                    className="frappe-btn frappe-btn-secondary"
                    style={{ flex: 1, padding: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1.5)' }}
                  >
                    <Star size={14} style={{ fill: selectedItem.data.starred ? 'var(--color-warning)' : 'none', color: selectedItem.data.starred ? 'var(--color-warning)' : 'currentColor' }} />
                    <span style={{ fontSize: 'var(--text-xs)' }}>{selectedItem.data.starred ? 'Starred' : 'Star'}</span>
                  </button>

                  <button 
                    onClick={handleToggleLegalHold}
                    className="frappe-btn frappe-btn-secondary"
                    style={{
                      flex: 1,
                      padding: 'var(--space-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-1.5)',
                      borderColor: selectedItem.data.legalHold ? 'var(--color-danger)' : 'transparent',
                      color: selectedItem.data.legalHold ? 'var(--color-danger)' : 'var(--color-text)'
                    }}
                  >
                    <Shield size={14} />
                    <span style={{ fontSize: 'var(--text-xs)' }}>{selectedItem.data.legalHold ? 'Hold Active' : 'Legal Hold'}</span>
                  </button>
                </div>

                {/* Trash View / Normal view delete controls */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  {view === 'trash' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={handleRestore}
                        className="frappe-btn frappe-btn-primary"
                        style={{ width: '100%', fontSize: 'var(--text-xs)' }}
                      >
                        Restore to Drive
                      </button>
                      <button 
                        onClick={handlePermanentDelete}
                        className="frappe-btn frappe-btn-danger"
                        style={{ width: '100%', fontSize: 'var(--text-xs)' }}
                      >
                        Delete Permanently
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleMoveToTrash}
                      className="frappe-btn frappe-btn-danger"
                      style={{ width: '100%', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                      disabled={selectedItem.data.legalHold}
                    >
                      <Trash2 size={14} />
                      <span>Move to Trash</span>
                    </button>
                  )}
                </div>

                {/* Version History (For Documents only) */}
                {selectedItem.type === 'document' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', margin: 0 }}>
                        <Clock size={14} />
                        <span>Version History</span>
                      </h4>
                      <button 
                        onClick={() => versionInputRef.current?.click()}
                        className="frappe-btn frappe-btn-secondary"
                        style={{ fontSize: '10px', padding: 'var(--space-1) var(--space-2)' }}
                      >
                        New Version
                      </button>
                      <input 
                        type="file" 
                        ref={versionInputRef} 
                        onChange={handleUploadVersion} 
                        style={{ display: 'none' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {selectedItem.data.versions?.map((v: DocumentVersion, idx: number) => (
                        <div 
                          key={v.id} 
                          style={{
                            padding: 'var(--space-2.5)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-bg-sunken)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                              Version {v.versionNumber} {idx === 0 && <span style={{ fontSize: '9px', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 4px', borderRadius: 'var(--radius-sm)' }}>Active</span>}
                            </p>
                            <p style={{ margin: 0, fontSize: '9px', color: 'var(--color-text-tertiary)' }}>
                              {formatBytes(v.fileSize)} • By {v.createdBy}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDownloadFile(v.id, selectedItem.data.name)}
                            style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                            title="Download Decrypted File"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital E-Signature Form (For Documents only) */}
                {selectedItem.type === 'document' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', marginBottom: 'var(--space-3)' }}>
                      <CheckCircle size={14} />
                      <span>Request Digital Signature</span>
                    </h4>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input 
                        type="email"
                        placeholder="signer@company.com"
                        value={signatureEmail}
                        onChange={e => setSignatureEmail(e.target.value)}
                        className="frappe-input"
                        style={{ fontSize: 'var(--text-xs)', flex: 1 }}
                      />
                      <button 
                        onClick={handleRequestSignature}
                        className="frappe-btn frappe-btn-primary"
                        style={{ padding: 'var(--space-1.5) var(--space-3)', fontSize: 'var(--text-xs)' }}
                      >
                        Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Permissions & Sharing config (OneDrive style) */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', marginBottom: 'var(--space-3)' }}>
                    <Users size={14} />
                    <span>Access & Sharing Settings</span>
                  </h4>

                  <form onSubmit={handleShareSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group" style={{ margin: 0 }}>
                      <label className="frappe-label" style={{ fontSize: '10px' }}>Select User</label>
                      <select
                        value={shareUserId}
                        onChange={e => setShareUserId(e.target.value)}
                        className="frappe-input"
                        style={{ fontSize: 'var(--text-xs)' }}
                        required
                      >
                        <option value="">-- Choose User --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="frappe-form-group" style={{ margin: 0 }}>
                      <label className="frappe-label" style={{ fontSize: '10px' }}>Role / Permission</label>
                      <select
                        value={shareRole}
                        onChange={e => setShareRole(e.target.value)}
                        className="frappe-input"
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        <option value="VIEWER">Viewer (Read Only)</option>
                        <option value="EDITOR">Editor (Read & Write)</option>
                        <option value="CO_OWNER">Co-Owner (Full Admin)</option>
                      </select>
                    </div>

                    {/* Password Protection (OneDrive feature) */}
                    <div className="frappe-form-group" style={{ margin: 0 }}>
                      <label className="frappe-label" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Key size={10} /> Password Protection (Optional)
                      </label>
                      <input 
                        type="password"
                        placeholder="Optional link password"
                        value={sharePassword}
                        onChange={e => setSharePassword(e.target.value)}
                        className="frappe-input"
                        style={{ fontSize: 'var(--text-xs)' }}
                      />
                    </div>

                    {/* Expiration Date (OneDrive feature) */}
                    <div className="frappe-form-group" style={{ margin: 0 }}>
                      <label className="frappe-label" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Calendar size={10} /> Expiration Date (Optional)
                      </label>
                      <input 
                        type="date"
                        value={shareExpiresAt}
                        onChange={e => setShareExpiresAt(e.target.value)}
                        className="frappe-input"
                        style={{ fontSize: 'var(--text-xs)' }}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="frappe-btn frappe-btn-primary"
                      style={{ width: '100%', padding: 'var(--space-2)', fontSize: 'var(--text-xs)' }}
                    >
                      Grant Permissions
                    </button>
                  </form>

                  {/* Existing Shares list */}
                  {selectedItem.data.shares && selectedItem.data.shares.length > 0 && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <h5 style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Currently Shared With:
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
                        {selectedItem.data.shares.map((share: any) => {
                          const targetUser = users.find(u => u.id === share.userId);
                          return (
                            <div 
                              key={share.id} 
                              style={{
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-bg-sunken)',
                                fontSize: '11px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--weight-semibold)' }}>
                                <span>{targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : share.userId}</span>
                                <span style={{ color: 'var(--color-primary)' }}>{share.role}</span>
                              </div>
                              {share.password && (
                                <p style={{ margin: 0, fontSize: '9px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <Lock size={8} /> Password Protected
                                </p>
                              )}
                              {share.expiresAt && (
                                <p style={{ margin: 0, fontSize: '9px', color: 'var(--color-text-tertiary)' }}>
                                  Expires: {new Date(share.expiresAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Info size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Select a folder or document to view properties, history, and sharing details.</p>
              </div>
            )}
          </div>

          {/* Bottom Fixed Storage Quota */}
          {usage && (
            <div style={{
              borderTop: '1px solid var(--color-border)',
              padding: 'var(--space-5)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                <HardDrive size={16} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Storage Quota</span>
              </div>
              
              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((usage.usedBytes / usage.totalLimitBytes) * 100, 100)}%`,
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)'
                }} />
              </div>

              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {formatBytes(usage.usedBytes)} of {formatBytes(usage.totalLimitBytes)} used
              </span>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="frappe-card" style={{ width: '400px', margin: 0 }}>
            <div className="frappe-card-header">Create New Folder</div>
            <div className="frappe-card-body">
              <form onSubmit={handleCreateFolderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="frappe-form-group" style={{ margin: 0 }}>
                  <label className="frappe-label">Folder Name</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="frappe-input"
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="frappe-btn frappe-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="frappe-btn frappe-btn-primary"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DrivePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
        <RefreshCw size={24} className="animate-spin" />
        <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Loading Drive...</span>
      </div>
    }>
      <DrivePageContent />
    </Suspense>
  );
}
