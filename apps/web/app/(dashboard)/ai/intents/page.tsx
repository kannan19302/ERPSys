'use client';
import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Search, Loader2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import { Card, Button } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';

interface IntentExample {
  id: string;
  intent: string;
  text: string;
  language: string;
  entities: { entity: string; value: string }[];
}

export default function IntentsPage() {
  const client = useApiClient();
  const [examples, setExamples] = useState<IntentExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifyText, setClassifyText] = useState('');
  const [classification, setClassification] = useState<{ intent: string; confidence: number; entities: { entity: string; value: string }[]; allScores: Record<string, number> } | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExample, setNewExample] = useState({ intent: '', text: '', language: 'en', entityName: '', entityValue: '' });
  const [entities, setEntities] = useState<{ entity: string; value: string }[]>([]);

  useEffect(() => { fetchExamples(); }, [client]);

  const fetchExamples = async () => {
    try {
      setLoading(true);
      const data = await client.get<{ data: IntentExample[]; meta: unknown }>('/ai/intent/training-data');
      setExamples(data.data || (Array.isArray(data) ? data : []));
    } catch { setExamples([]); }
    finally { setLoading(false); }
  };

  const classify = async () => {
    if (!classifyText.trim()) return;
    setClassifying(true);
    try {
      const result = await client.post<{ intent: string; confidence: number; entities: { entity: string; value: string }[]; allScores: Record<string, number> }>('/ai/intent/classify', { text: classifyText });
      setClassification(result);
    } catch { setClassification(null); }
    finally { setClassifying(false); }
  };

  const addEntity = () => {
    if (newExample.entityName && newExample.entityValue) {
      setEntities([...entities, { entity: newExample.entityName, value: newExample.entityValue }]);
      setNewExample({ ...newExample, entityName: '', entityValue: '' });
    }
  };

  const createExample = async () => {
    if (!newExample.intent || !newExample.text) return;
    try {
      await client.post('/ai/intent/training-data', { intent: newExample.intent, text: newExample.text, language: newExample.language, entities });
      setIsModalOpen(false);
      setNewExample({ intent: '', text: '', language: 'en', entityName: '', entityValue: '' });
      setEntities([]);
      fetchExamples();
    } catch { /* ignore */ }
  };

  const deleteExample = async (id: string) => {
    try { await client.delete(`/ai/intent/training-data/${id}`); fetchExamples(); }
    catch { /* ignore */ }
  };

  return (
    <RouteGuard permission="ai.intent.classify">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3"><Tag size={28} className="ui-text-primary" /> Intent Classification</h1>
            <p className="ui-text-muted mt-1">Classify text intent and manage training data</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Add Example</Button>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Classify Text</h3>
          <div className="ui-flex ui-gap-3">
            <input className="ui-input flex-1" placeholder="Enter text to classify..." value={classifyText} onChange={(e) => setClassifyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && classify()} />
            <Button onClick={classify} disabled={classifying || !classifyText.trim()}>
              {classifying ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span className="ml-2">Classify</span>
            </Button>
          </div>
          {classification && (
            <div className="mt-4 p-4 ui-bg-subtle rounded-lg">
              <p><strong>Intent:</strong> {classification.intent}</p>
              <p><strong>Confidence:</strong> {(classification.confidence * 100).toFixed(0)}%</p>
              {classification.entities.length > 0 && <p><strong>Entities:</strong> {classification.entities.map(e => `${e.entity}:${e.value}`).join(', ')}</p>}
              {Object.keys(classification.allScores).length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">All Scores:</p>
                  {Object.entries(classification.allScores).map(([intent, score]) => (
                    <div key={intent} className="ui-flex ui-gap-2 text-sm">
                      <span>{intent}:</span>
                      <div className="flex-1 ui-bg-muted rounded h-4 mt-1">
                        <div className="ui-bg-primary rounded h-4" style={{ width: `${Math.min(score * 100, 100)}%` }} />
                      </div>
                      <span>{(score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Training Data ({examples.length})</h3>
          {loading ? (
            <div className="ui-flex-center p-8"><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <div className="ui-stack-3">
              {examples.map((ex) => (
                <div key={ex.id} className="ui-flex ui-gap-3 ui-items-start p-3 ui-bg-subtle rounded-lg">
                  <div className="flex-1">
                    <div className="ui-hstack-2">
                      <span className="ui-badge-primary text-xs px-2 py-0.5 rounded">{ex.intent}</span>
                      <span className="ui-text-xs-muted">{ex.language}</span>
                    </div>
                    <p className="text-sm mt-1">{ex.text}</p>
                    {ex.entities && ex.entities.length > 0 && (
                      <div className="ui-hstack-2 mt-1">
                        {ex.entities.map((ent, i) => (
                          <span key={i} className="ui-badge-info text-xs px-2 py-0.5 rounded">{ent.entity}: {ent.value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteExample(ex.id)} className="ui-btn-icon ui-text-danger"><X size={14} /></button>
                </div>
              ))}
              {examples.length === 0 && <p className="ui-text-muted text-sm">No training examples yet.</p>}
            </div>
          )}
        </Card>

        {isModalOpen && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Add Training Example</h3><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
              <input className="ui-input" placeholder="Intent name" value={newExample.intent} onChange={(e) => setNewExample({ ...newExample, intent: e.target.value })} />
              <textarea className="ui-textarea" placeholder="Example text" rows={3} value={newExample.text} onChange={(e) => setNewExample({ ...newExample, text: e.target.value })} />
              <input className="ui-input" placeholder="Language code (en)" value={newExample.language} onChange={(e) => setNewExample({ ...newExample, language: e.target.value })} />
              <div className="ui-stack-3">
                <p className="text-sm font-medium">Entities</p>
                <div className="ui-flex ui-gap-2">
                  <input className="ui-input flex-1" placeholder="Entity name" value={newExample.entityName} onChange={(e) => setNewExample({ ...newExample, entityName: e.target.value })} />
                  <input className="ui-input flex-1" placeholder="Entity value" value={newExample.entityValue} onChange={(e) => setNewExample({ ...newExample, entityValue: e.target.value })} />
                  <Button size="sm" onClick={addEntity}>Add</Button>
                </div>
                {entities.map((e, i) => <span key={i} className="ui-badge-info text-xs px-2 py-0.5 rounded">{e.entity}: {e.value}</span>)}
              </div>
              <div className="ui-flex ui-gap-3 ui-justify-end">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={createExample}>Save</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
