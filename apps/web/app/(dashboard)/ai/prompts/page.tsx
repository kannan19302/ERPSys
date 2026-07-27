'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Loader2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import { Card, Button } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';

interface Prompt {
  id: string;
  name: string;
  promptTemplate: string;
  modelConfig: Record<string, unknown>;
  variables: string[];
  category: string;
  isActive: boolean;
}

export default function PromptsPage() {
  const client = useApiClient();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Prompt | null>(null);
  const [newItem, setNewItem] = useState({ name: '', promptTemplate: '', category: 'GENERAL', variablesStr: '', isActive: 'true' });

  useEffect(() => { fetchPrompts(); }, [client]);

  const fetchPrompts = async () => {
    try { setLoading(true); const r = await client.get<{ data: Prompt[]; meta: unknown }>('/ai/prompts'); setPrompts(r.data || []); }
    catch { setPrompts([]); }
    finally { setLoading(false); }
  };

  const savePrompt = async () => {
    if (!newItem.name || !newItem.promptTemplate) return;
    try {
      await client.post('/ai/prompts', { name: newItem.name, promptTemplate: newItem.promptTemplate, category: newItem.category, variables: newItem.variablesStr ? newItem.variablesStr.split(',').map(s => s.trim()) : [], isActive: newItem.isActive === 'true' });
      setIsModalOpen(false); setNewItem({ name: '', promptTemplate: '', category: 'GENERAL', variablesStr: '', isActive: 'true' }); fetchPrompts();
    } catch { /* ignore */ }
  };

  const updatePrompt = async () => {
    if (!editItem) return;
    try {
      await client.put(`/ai/prompts/${editItem.id}`, { name: editItem.name, promptTemplate: editItem.promptTemplate, category: editItem.category, isActive: editItem.isActive });
      setIsEditModalOpen(false); setEditItem(null); fetchPrompts();
    } catch { /* ignore */ }
  };

  const deletePrompt = async (id: string) => { try { await client.delete(`/ai/prompts/${id}`); fetchPrompts(); } catch { /* ignore */ } };

  return (
    <RouteGuard permission="ai.prompts.read">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3"><FileText size={28} className="ui-text-primary" /> Prompt Library</h1>
            <p className="ui-text-muted mt-1">Manage AI prompt templates with variable substitution</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Create Prompt</Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="ui-flex-center p-8"><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <div className="ui-stack-3">
              {prompts.map((p) => (
                <div key={p.id} className="p-4 ui-bg-subtle rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="ui-hstack-2">
                        <h3 className="font-semibold">{p.name}</h3>
                        <span className="ui-badge-info text-xs px-2 py-0.5 rounded">{p.category}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${p.isActive ? 'ui-badge-success' : 'ui-badge-secondary'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-sm mt-1 ui-text-muted font-mono" style={{ whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>{p.promptTemplate}</p>
                      {p.variables?.length > 0 && <div className="ui-hstack-2 mt-2">{p.variables.map((v, i) => <span key={i} className="ui-badge-secondary text-xs px-2 py-0.5 rounded">{`{${v}}`}</span>)}</div>}
                    </div>
                    <div className="ui-hstack-2">
                      <button onClick={() => { setEditItem(p); setIsEditModalOpen(true); }} className="ui-btn-icon text-sm ui-text-primary">Edit</button>
                      <button onClick={() => deletePrompt(p.id)} className="ui-btn-icon ui-text-danger"><X size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {prompts.length === 0 && <p className="ui-text-muted text-sm">No prompts yet.</p>}
            </div>
          )}
        </Card>

        {isModalOpen && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Create Prompt</h3><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
              <input className="ui-input" placeholder="Prompt name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <select className="ui-input" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                <option value="GENERAL">General</option><option value="SALES">Sales</option><option value="SUPPORT">Support</option><option value="HR">HR</option><option value="FINANCE">Finance</option>
              </select>
              <textarea className="ui-textarea font-mono" placeholder="Template with {variables}" rows={5} value={newItem.promptTemplate} onChange={(e) => setNewItem({ ...newItem, promptTemplate: e.target.value })} />
              <input className="ui-input" placeholder="Variables (comma-separated)" value={newItem.variablesStr} onChange={(e) => setNewItem({ ...newItem, variablesStr: e.target.value })} />
              <div className="ui-flex ui-gap-3 ui-justify-end"><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={savePrompt}>Create</Button></div>
            </Card>
          </div>
        )}

        {isEditModalOpen && editItem && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Edit Prompt</h3><button onClick={() => setIsEditModalOpen(false)}><X size={18} /></button></div>
              <input className="ui-input" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              <textarea className="ui-textarea font-mono" rows={5} value={editItem.promptTemplate} onChange={(e) => setEditItem({ ...editItem, promptTemplate: e.target.value })} />
              <div className="ui-flex ui-gap-3 ui-justify-end"><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={updatePrompt}>Update</Button></div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
