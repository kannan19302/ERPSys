'use client';
import { useEffect, useState } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { FileText, Folder, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface TrashItem { id: string; name: string; type: string; deletedAt: string; updatedAt: string; }

export default function TrashPage() {
  const client = useApiClient();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<{ data: any[] }>('/drive/files?view=trash'),
      client.get<{ data: any[] }>('/drive/folders?view=trash'),
    ]).then(([filesRes, foldersRes]) => {
      const files = (filesRes.data || []).map((f: any) => ({ ...f, type: 'file' }));
      const folders = (foldersRes.data || []).map((f: any) => ({ ...f, type: 'folder' }));
      setItems([...folders, ...files]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [client]);

  const handleRestore = async (id: string, type: string) => {
    try {
      await client.request(`/drive/${type}s/${id}/restore`, { method: 'POST' });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  };

  const columns: Column<TrashItem>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => (
      <div className="ui-hstack-3">
        {r.type === 'folder' ? <Folder size={16} className="ui-text-primary" /> : <FileText size={16} />}
        <span>{r.name}</span>
      </div>
    )},
    { key: 'deletedAt', header: 'Deleted', sortable: true, render: (r) => r.deletedAt ? new Date(r.deletedAt).toLocaleDateString() : '—' },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="ui-hstack-2">
        <Button variant="ghost" size="sm" icon={RotateCcw} title="Restore" onClick={() => handleRestore(r.id, r.type)} />
        <Button variant="ghost" size="sm" icon={Trash2} title="Delete permanently" className="ui-text-danger" />
      </div>
    )},
  ];

  if (loading) return <div className="ui-flex-center ui-min-h-64"><Spinner /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader title="Trash" description="Recently deleted files and folders" breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Drive', href: '/drive' }, { label: 'Trash' }]} icon={Trash2} />
      <div className="ui-flex ui-gap-2 ui-bg-warning-light ui-p-3 ui-rounded ui-items-center">
        <AlertTriangle size={16} className="ui-text-warning" />
        <span className="ui-text-sm">Items in trash are automatically deleted after 30 days.</span>
      </div>
      <Card padding="none">
        <DataTable columns={columns} data={items} rowKey={(r) => r.id} emptyTitle="Trash is empty" emptyMessage="Deleted files and folders will appear here." emptyIcon={<Trash2 size={48} />} />
      </Card>
    </div>
  );
}
