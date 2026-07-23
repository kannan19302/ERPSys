'use client';
import { useEffect, useState } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { FileText, Folder, Download, Star, Users } from 'lucide-react';

interface SharedItem { id: string; name: string; type: string; sharedBy: string; permission: string; createdAt: string; }

export default function SharedPage() {
  const client = useApiClient();
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<{ data: any[] }>('/drive/files?view=shared'),
      client.get<{ data: any[] }>('/drive/folders?view=shared'),
    ]).then(([filesRes, foldersRes]) => {
      const files = (filesRes.data || []).map((f: any) => ({ ...f, type: 'file', permission: 'VIEW' }));
      const folders = (foldersRes.data || []).map((f: any) => ({ ...f, type: 'folder', permission: 'EDIT' }));
      setItems([...folders, ...files]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [client]);

  const columns: Column<SharedItem>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => (
      <div className="ui-hstack-3">
        {r.type === 'folder' ? <Folder size={16} className="ui-text-primary" /> : <FileText size={16} />}
        <span>{r.name}</span>
      </div>
    )},
    { key: 'sharedBy', header: 'Shared by' },
    { key: 'permission', header: 'Permission', render: (r) => <span className="ui-badge ui-badge-info">{r.permission}</span> },
    { key: 'createdAt', header: 'Shared on', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', header: 'Actions', render: () => (
      <div className="ui-hstack-2">
        <Button variant="ghost" size="sm" icon={Download} title="Download" />
        <Button variant="ghost" size="sm" icon={Star} title="Star" />
      </div>
    )},
  ];

  if (loading) return <div className="ui-flex-center ui-min-h-64"><Spinner /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader title="Shared with me" description="Files and folders shared with you" breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Drive', href: '/drive' }, { label: 'Shared' }]} icon={Users} />
      <Card padding="none">
        <DataTable columns={columns} data={items} rowKey={(r) => r.id} emptyTitle="Nothing shared with you" emptyMessage="When someone shares a file or folder, it will appear here." emptyIcon={<Users size={48} />} />
      </Card>
    </div>
  );
}
