'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiClient } from '@unerp/framework';
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
  const client = useApiClient();

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
      // Load folders
      const folderQuery = new URLSearchParams();
      if (folderId) folderQuery.append('parentId', folderId);
      folderQuery.append('view', currentView);
      
      const fData = await client.get<FolderItem[]>(`/drive/folders?${folderQuery.toString()}`);
      setFolders(Array.isArray(fData) ? fData : []);

      // Load documents
      const docQuery = new URLSearchParams();
      if (folderId) docQuery.append('folderId', folderId);
      docQuery.append('view', currentView);

      const dData = await client.get<DocumentItem[]>(`/drive/documents?${docQuery.toString()}`);
      setDocuments(Array.isArray(dData) ? dData : []);

      // Load stats
      const uData = await client.get<UsageStats>('/drive/usage');
      setUsage(uData);
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
        const data = await client.get<UserItem[]>('/drive/users');
        setUsers(data);
      } catch {}
    };
    loadUsers();
  }, [client]);

  // Reactively load data when folder or view changes
  useEffect(() => {
    loadData(currentFolderId, view);
  }, [client, currentFolderId, view]);

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
      await client.request('/drive/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId
        })
      });
      showToast(`Folder "${newFolderName}" created successfully.`, 'success');
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      loadData(currentFolderId, view);
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
      await client.request('/drive/documents', {
        method: 'POST',
        body: formData
      });
      showToast(`Uploaded & Encrypted "${file.name}" successfully!`, 'success');
      loadData(currentFolderId, view);
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
      const updatedDoc = await client.request<DocumentItem>(`/drive/documents/${selectedItem.data.id}/versions`, {
        method: 'POST',
        body: formData
      });
      showToast('New version uploaded & encrypted successfully.', 'success');
      setSelectedItem({ type: 'document', data: updatedDoc });
      loadData(currentFolderId, view);
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
      const updated = await client.request<FolderItem | DocumentItem>(`/drive/${type}s/${id}/star`, {
        method: 'POST'
      });
      setSelectedItem({ type, data: updated });
      showToast(updated.starred ? 'Added to Starred.' : 'Removed from Starred.', 'success');
      loadData(currentFolderId, view);
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
      const updated = await client.request<FolderItem | DocumentItem>(`/drive/${type}s/${id}/legal-hold`, {
        method: 'POST'
      });
      setSelectedItem({ type, data: updated });
      showToast(updated.legalHold ? 'Legal hold activated.' : 'Legal hold released.', 'success');
      loadData(currentFolderId, view);
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
      await client.delete(`/drive/${type}s/${id}`);
      showToast('Moved item to Trash.', 'success');
      setSelectedItem(null);
      loadData(currentFolderId, view);
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
      await client.request(`/drive/${type}s/${id}/restore`, { method: 'POST' });
      showToast('Item restored successfully.', 'success');
      setSelectedItem(null);
      loadData(currentFolderId, view);
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
      await client.delete(`/drive/${type}s/${id}/permanent`);
      showToast('Item permanently deleted.', 'success');
      setSelectedItem(null);
      loadData(currentFolderId, view);
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
      const updated = await client.request<FolderItem | DocumentItem>(`/drive/${type}s/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({
          userId: shareUserId,
          role: shareRole,
          password: sharePassword || undefined,
          expiresAt: shareExpiresAt || undefined
        })
      });
      setSelectedItem({ type, data: updated });
      showToast('Permissions updated successfully.', 'success');
      setShareUserId('');
      setSharePassword('');
      setShareExpiresAt('');
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
        const data = await client.get<{ folders?: FolderItem[]; documents?: DocumentItem[] }>(`/drive/search?q=${encodeURIComponent(searchQuery)}`);
        setFolders(data.folders || []);
        setDocuments(data.documents || []);
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
      await client.request(`/drive/documents/${selectedItem.data.id}/signatures/request`, {
        method: 'POST',
        body: JSON.stringify({ signerEmail: signatureEmail })
      });
      showToast('Signature request sent successfully!', 'success');
      setSignatureEmail('');
      loadData(currentFolderId, view);
    } catch {
      showToast('Error requesting signature.', 'error');
    }
  };

  // File Download Helper (calls decrypter endpoint)
  const handleDownloadFile = async (versionId: string, filename: string) => {
    try {
      const blob = await client.request<Blob>(
        `/drive/documents/versions/${versionId}/download`,
        {},
        'blob',
      );
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Decrypted file downloaded successfully.', 'success');
    } catch {
      showToast('Failed to download decrypted file.', 'error');
    }
  };

  return (
    <div className={styles.s1}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-item toast-${toast.type} ${styles.s2}`} style={{ borderLeft: `4px solid var(--color-${toast.type === 'error' ? 'danger' : toast.type})` }}>
          {toast.type === 'success' && <CheckCircle size={18} className="ui-text-success" />}
          {toast.type === 'error' && <AlertCircle size={18} className="ui-text-danger" />}
          {toast.type === 'warning' && <Clock size={18} className="ui-text-warning" />}
          <span className="ui-heading-sm">{toast.message}</span>
        </div>
      )}

      {/* Main Area Explorer */}
      <div className={styles.p1}>
        {/* Top Search Bar */}
        <div className={styles.p2}>
          {/* + New Button */}
          <div ref={newMenuRef} className={styles.p3}>
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className={["ui-btn ui-btn-primary", styles.p4].filter(Boolean).join(' ')}
            >
              <Plus size={16} />
              <span>New</span>
            </button>

            {/* New Dropdown menu */}
            {isNewMenuOpen && (
              <div className={["ui-dropdown ui-dropdown-left", styles.p5].filter(Boolean).join(' ')}>
                <button 
                  onClick={() => { setIsCreateFolderOpen(true); setIsNewMenuOpen(false); }}
                  className={["ui-dropdown-item", styles.p6].filter(Boolean).join(' ')}
                >
                  <Folder size={16} className="ui-text-primary" />
                  <span>New Folder</span>
                </button>
                <div className="ui-dropdown-divider" />
                <button 
                  onClick={() => { fileInputRef.current?.click(); setIsNewMenuOpen(false); }}
                  className={["ui-dropdown-item", styles.p7].filter(Boolean).join(' ')}
                >
                  <Upload size={16} className="ui-text-success" />
                  <span>Upload File</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className={styles.p8}
                />
              </div>
            )}
          </div>
          <div className={styles.p9}>
            <Search size={16} className={styles.p10} />
            <input 
              type="text"
              placeholder="Search in Drive (Press Enter to execute)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className={["ui-input", styles.p11].filter(Boolean).join(' ')}
            />
          </div>
          
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="ui-btn ui-btn-secondary ui-btn-icon"
            title="Toggle Details"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Breadcrumb Navigation Trail */}
        <div className={styles.p12}>
          <button 
            onClick={() => handleBreadcrumbClick(-1)}
            className={styles.p13}
          >
            {isSearching ? 'Search Results' : view === 'personal' ? 'My Drive' : view.charAt(0).toUpperCase() + view.slice(1)}
          </button>

          {!isSearching && pathStack.map((folder, index) => (
            <React.Fragment key={`${folder.id}-${index}`}>
              <ChevronRight size={14} className="ui-text-tertiary" />
              <button 
                onClick={() => handleBreadcrumbClick(index)}
                style={{ color: index === pathStack.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)', fontWeight: index === pathStack.length - 1 ? 'var(--weight-bold)' : 'var(--weight-semibold)' }} className={styles.s3}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}

          {loading && <RefreshCw size={14} className={["animate-spin", styles.p14].filter(Boolean).join(' ')} />}
        </div>

        {/* Files & Folders List Area */}
        <div className={styles.p15}>
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className={styles.p16}>
              <h3 className={styles.p17}>
                Folders
              </h3>
              <div className={styles.p18}>
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onDoubleClick={() => handleEnterFolder(folder)}
                    onClick={() => setSelectedItem({ type: 'folder', data: folder })}
                    className={`ui-card ${styles.s4}`}
                    style={{ backgroundColor: selectedItem?.type === 'folder' && selectedItem.data.id === folder.id ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)', border: selectedItem?.type === 'folder' && selectedItem.data.id === folder.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                  >
                    <Folder size={24} className={styles.p19} />
                    <div className="flex-1 overflow-hidden">
                      <p className={styles.p20}>
                        {folder.name}
                      </p>
                      <p className={styles.p21}>
                        Created {new Date(folder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {folder.starred && <Star size={14} className={styles.p22} />}
                    {folder.legalHold && <Shield size={14} className="ui-text-danger" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents/Files Section */}
          <div>
            <h3 className={styles.p23}>
              Files
            </h3>

            <div className={["ui-card", styles.p24].filter(Boolean).join(' ')}>
              <table className={styles.p25}>
                <thead>
                  <tr className={styles.p26}>
                    <th className={styles.p27}>Name</th>
                    <th className={styles.p28}>Status</th>
                    <th className={styles.p29}>Last Modified</th>
                    <th className={styles.p30}>File Size</th>
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
                        style={{ backgroundColor: selectedItem?.type === 'document' && selectedItem.data.id === doc.id ? 'var(--color-primary-light)' : 'transparent' }} className={styles.s5}
                      >
                        <td className="py-3 px-4">
                          <div className="ui-hstack-3">
                            <FileText size={18} className={styles.p31} />
                            <div className={styles.p32}>
                              <p className={styles.p33}>
                                {doc.name}
                              </p>
                              <div className={styles.p34}>
                                {doc.starred && <Star size={10} className={styles.p35} />}
                                {doc.legalHold && <Shield size={10} className="ui-text-danger" />}
                                <span className={styles.p36}>
                                  <Lock size={8} /> AES-256
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {doc.signatureStatus === 'SIGNED' ? (
                            <span className={styles.p37}>
                              Signed
                            </span>
                          ) : doc.signatureStatus === 'PENDING' ? (
                            <span className={styles.p38}>
                              Pending Sign
                            </span>
                          ) : (
                            <span className={styles.p39}>
                              Standard
                            </span>
                          )}
                        </td>
                        <td className={styles.p40}>
                          {new Date(doc.updatedAt).toLocaleString()}
                        </td>
                        <td className={styles.p41}>
                          {size}
                        </td>
                      </tr>
                    );
                  })}

                  {documents.length === 0 && folders.length === 0 && (
                    <tr>
                      <td colSpan={4} className={styles.p42}>
                        <div className={styles.p43}>
                          <HardDrive size={36} className={styles.p44} />
                          <span className="text-sm">No folders or files in this view.</span>
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
        <div className={styles.p45}>
          {/* Scrollable details content */}
          <div className={styles.p46}>
            {selectedItem ? (
              <div className={styles.p47}>
                
                {/* Header Details */}
                <div className={styles.p48}>
                  {selectedItem.type === 'folder' ? (
                    <Folder size={36} className={styles.p49} />
                  ) : (
                    <FileText size={36} className={styles.p50} />
                  )}
                  <div className={styles.p51}>
                    <h3 className={styles.p52}>
                      {selectedItem.data.name}
                    </h3>
                    <p className={styles.p53}>
                      <span>Type: {selectedItem.type === 'folder' ? 'Folder' : 'File'}</span>
                      <span>•</span>
                      <span className={styles.p54}>Owner: {selectedItem.data.createdBy}</span>
                    </p>
                  </div>
                </div>

                {/* Encryption & Security Indicator */}
                {selectedItem.type === 'document' && (
                  <div className={styles.p55}>
                    <div className={styles.p56}>
                      <Lock size={16} className="ui-text-success" />
                    </div>
                    <div>
                      <h4 className={styles.p57}>
                        Envelope Encryption Active
                      </h4>
                      <p className={styles.p58}>
                        AES-256 on-the-fly encrypted in MinIO Object Storage
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions (Star, Legal Hold, Trash) */}
                <div className="ui-flex ui-gap-2">
                  <button 
                    onClick={handleToggleStar}
                    className={["ui-btn ui-btn-secondary", styles.p59].filter(Boolean).join(' ')}
                  >
                    <Star size={14} style={{ fill: selectedItem.data.starred ? 'var(--color-warning)' : 'none', color: selectedItem.data.starred ? 'var(--color-warning)' : 'currentColor' }} />
                    <span className="text-xs">{selectedItem.data.starred ? 'Starred' : 'Star'}</span>
                  </button>

                  <button 
                    onClick={handleToggleLegalHold}
                    className={`ui-btn ui-btn-secondary ${styles.s6}`}
                    style={{ borderColor: selectedItem.data.legalHold ? 'var(--color-danger)' : 'transparent', color: selectedItem.data.legalHold ? 'var(--color-danger)' : 'var(--color-text)' }}
                  >
                    <Shield size={14} />
                    <span className="text-xs">{selectedItem.data.legalHold ? 'Hold Active' : 'Legal Hold'}</span>
                  </button>
                </div>

                {/* Trash View / Normal view delete controls */}
                <div className={styles.p60}>
                  {view === 'trash' ? (
                    <div className="ui-stack-2">
                      <button 
                        onClick={handleRestore}
                        className={["ui-btn ui-btn-primary", styles.p61].filter(Boolean).join(' ')}
                      >
                        Restore to Drive
                      </button>
                      <button 
                        onClick={handlePermanentDelete}
                        className={["ui-btn ui-btn-danger", styles.p62].filter(Boolean).join(' ')}
                      >
                        Delete Permanently
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleMoveToTrash}
                      className={["ui-btn ui-btn-danger", styles.p63].filter(Boolean).join(' ')}
                      disabled={selectedItem.data.legalHold}
                    >
                      <Trash2 size={14} />
                      <span>Move to Trash</span>
                    </button>
                  )}
                </div>

                {/* Version History (For Documents only) */}
                {selectedItem.type === 'document' && (
                  <div className={styles.p64}>
                    <div className={styles.p65}>
                      <h4 className={styles.p66}>
                        <Clock size={14} />
                        <span>Version History</span>
                      </h4>
                      <button 
                        onClick={() => versionInputRef.current?.click()}
                        className={["ui-btn ui-btn-secondary", styles.p67].filter(Boolean).join(' ')}
                      >
                        New Version
                      </button>
                      <input 
                        type="file" 
                        ref={versionInputRef} 
                        onChange={handleUploadVersion} 
                        className={styles.p68}
                      />
                    </div>

                    <div className="ui-stack-2">
                      {selectedItem.data.versions?.map((v: DocumentVersion, idx: number) => (
                        <div 
                          key={v.id} 
                          className={styles.p69}
                        >
                          <div>
                            <p className={styles.p70}>
                              Version {v.versionNumber} {idx === 0 && <span className={styles.p71}>Active</span>}
                            </p>
                            <p className={styles.p72}>
                              {formatBytes(v.fileSize)} • By {v.createdBy}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDownloadFile(v.id, selectedItem.data.name)}
                            className={styles.p73}
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
                  <div className={styles.p74}>
                    <h4 className={styles.p75}>
                      <CheckCircle size={14} />
                      <span>Request Digital Signature</span>
                    </h4>
                    <div className="ui-flex ui-gap-2">
                      <input 
                        type="email"
                        placeholder="signer@company.com"
                        value={signatureEmail}
                        onChange={e => setSignatureEmail(e.target.value)}
                        className={["ui-input", styles.p76].filter(Boolean).join(' ')}
                      />
                      <button 
                        onClick={handleRequestSignature}
                        className={["ui-btn ui-btn-primary", styles.p77].filter(Boolean).join(' ')}
                      >
                        Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Permissions & Sharing config (OneDrive style) */}
                <div className={styles.p78}>
                  <h4 className={styles.p79}>
                    <Users size={14} />
                    <span>Access & Sharing Settings</span>
                  </h4>

                  <form onSubmit={handleShareSubmit} className="ui-stack-3">
                    <div className="ui-form-group m-0">
                      <label className={["ui-label", styles.p80].filter(Boolean).join(' ')}>Select User</label>
                      <select
                        value={shareUserId}
                        onChange={e => setShareUserId(e.target.value)}
                        className="ui-input text-xs"
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

                    <div className="ui-form-group m-0">
                      <label className={["ui-label", styles.p81].filter(Boolean).join(' ')}>Role / Permission</label>
                      <select
                        value={shareRole}
                        onChange={e => setShareRole(e.target.value)}
                        className="ui-input text-xs"
                      >
                        <option value="VIEWER">Viewer (Read Only)</option>
                        <option value="EDITOR">Editor (Read & Write)</option>
                        <option value="CO_OWNER">Co-Owner (Full Admin)</option>
                      </select>
                    </div>

                    {/* Password Protection (OneDrive feature) */}
                    <div className="ui-form-group m-0">
                      <label className={["ui-label", styles.p82].filter(Boolean).join(' ')}>
                        <Key size={10} /> Password Protection (Optional)
                      </label>
                      <input 
                        type="password"
                        placeholder="Optional link password"
                        value={sharePassword}
                        onChange={e => setSharePassword(e.target.value)}
                        className="ui-input text-xs"
                      />
                    </div>

                    {/* Expiration Date (OneDrive feature) */}
                    <div className="ui-form-group m-0">
                      <label className={["ui-label", styles.p83].filter(Boolean).join(' ')}>
                        <Calendar size={10} /> Expiration Date (Optional)
                      </label>
                      <input 
                        type="date"
                        value={shareExpiresAt}
                        onChange={e => setShareExpiresAt(e.target.value)}
                        className="ui-input text-xs"
                      />
                    </div>

                    <button 
                      type="submit"
                      className={["ui-btn ui-btn-primary", styles.p84].filter(Boolean).join(' ')}
                    >
                      Grant Permissions
                    </button>
                  </form>

                  {/* Existing Shares list */}
                  {selectedItem.data.shares && selectedItem.data.shares.length > 0 && (
                    <div className={styles.p85}>
                      <h5 className={styles.p86}>
                        Currently Shared With:
                      </h5>
                      <div className={styles.p87}>
                        {selectedItem.data.shares.map((share: any) => {
                          const targetUser = users.find(u => u.id === share.userId);
                          return (
                            <div 
                              key={share.id} 
                              className={styles.p88}
                            >
                              <div className={styles.p89}>
                                <span>{targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : share.userId}</span>
                                <span className="ui-text-primary">{share.role}</span>
                              </div>
                              {share.password && (
                                <p className={styles.p90}>
                                  <Lock size={8} /> Password Protected
                                </p>
                              )}
                              {share.expiresAt && (
                                <p className={styles.p91}>
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
              <div className={styles.p92}>
                <Info size={40} className={styles.p93} />
                <p className={styles.p94}>Select a folder or document to view properties, history, and sharing details.</p>
              </div>
            )}
          </div>

          {/* Bottom Fixed Storage Quota */}
          {usage && (
            <div className={styles.p95}>
              <div className={styles.p96}>
                <HardDrive size={16} />
                <span className="ui-text-xs-label">Storage Quota</span>
              </div>
              
              {/* Progress bar */}
              <div className={styles.p97}>
                <div style={{ width: `${Math.min((usage.usedBytes / usage.totalLimitBytes) * 100, 100)}%` }} className={styles.s7} />
              </div>

              <span className="ui-text-caption ui-text-tertiary">
                {formatBytes(usage.usedBytes)} of {formatBytes(usage.totalLimitBytes)} used
              </span>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className={styles.p98}>
          <div className={["ui-card", styles.p99].filter(Boolean).join(' ')}>
            <div className="ui-card-header">Create New Folder</div>
            <div className="ui-card-body">
              <form onSubmit={handleCreateFolderSubmit} className="ui-stack-4">
                <div className="ui-form-group m-0">
                  <label className="ui-label">Folder Name</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="ui-input"
                    required
                    autoFocus
                  />
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="ui-btn ui-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="ui-btn ui-btn-primary"
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
      <div className={styles.p100}>
        <RefreshCw size={24} className="animate-spin" />
        <span className={styles.p101}>Loading Drive...</span>
      </div>
    }>
      <DrivePageContent />
    </Suspense>
  );
}
