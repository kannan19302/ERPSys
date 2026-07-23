'use client';
import { useEffect, useState } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { FileText, Folder, Download, Star, Clock } from 'lucide-react';

interface RecentItem { id: string; name: string; type: string; updatedAt: string; }

export default function RecentPage() {
  const client = useApiClient();
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<{ data: any[] }>('/drive/files'),
      client.get<{ data: any[] }>('/drive/folders'),
    ]).then(([filesRes, foldersRes]) => {
      const files = (filesRes.data || []).map((f: any) => ({ ...f, type: 'file' }));
      const folders = (foldersRes.data || []).map((f: any) => ({ ...f, type: 'folder' }));
      const all = [...folders, ...files].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setItems(all.slice(0, 50));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [client]);

  const columns: Column<RecentItem>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => (
      <div className="ui-hstack-3">
        {r.type === 'folder' ? <Folder size={16} className="ui-text-primary" /> : <FileText size={16} />}
        <span>{r.name}</span>
      </div>
    )},
    { key: 'updatedAt', header: 'Modified', sortable: true, render: (r) => (
      <span>{new Date(r.updatedAt).toLocaleString()}</span>
    )},
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
      <PageHeader title="Recent" description="Recently modified files and folders" breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Drive', href: '/drive' }, { label: 'Recent' }]} icon={Clock} />
      <Card padding="none">
        <DataTable columns={columns} data={items} rowKey={(r) => r.id} emptyTitle="No recent files" emptyMessage="Your recently modified files will appear here." emptyIcon={<Clock size={48} />} />
      </Card>
    </div>
  );
}
