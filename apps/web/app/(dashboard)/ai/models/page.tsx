// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { Cpu, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import { Card, Button } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';

interface AiModelSummary {
  id: string;
  name: string;
  modelType: string;
  provider: string;
  version: string;
  isActive: boolean;
  accuracyMetrics: { id: string; metricName: string; metricValue: number; recordedAt: string }[];
}

export default function ModelsPage() {
  const client = useApiClient();
  const [models, setModels] = useState<AiModelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchModels(); }, [client]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const r = await client.get<{ data: AiModelSummary[]; meta: unknown }>('/ai/models/metrics');
      setModels(r.data || []);
    } catch { setModels([]); }
    finally { setLoading(false); }
  };

  const trendIcon = (v: number) => v > 0.8 ? <TrendingUp size={14} className="text-green-500" /> : v > 0.5 ? <Minus size={14} className="text-yellow-500" /> : <TrendingDown size={14} className="text-red-500" />;

  return (
    <RouteGuard permission="ai.model-metrics.read">
      <div className="p-8 ui-stack-6">
        <div>
          <h1 className="text-3xl ui-hstack-3"><Cpu size={28} className="ui-text-primary" /> Model Registry</h1>
          <p className="ui-text-muted mt-1">AI model inventory and accuracy metrics</p>
        </div>

        {loading ? (
          <div className="ui-flex-center p-8"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <div className="ui-grid-2">
            {models.map((m) => (
              <Card key={m.id} className="p-6 ui-stack-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <div className="ui-hstack-2 mt-1">
                      <span className="ui-badge-primary text-xs px-2 py-0.5 rounded">{m.modelType}</span>
                      <span className="ui-badge-info text-xs px-2 py-0.5 rounded">{m.provider}</span>
                      <span className="ui-text-xs-muted">v{m.version}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${m.isActive ? 'ui-badge-success' : 'ui-badge-secondary'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                {m.accuracyMetrics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Accuracy Metrics</p>
                    <div className="ui-stack-2">
                      {m.accuracyMetrics.slice(-5).map((met) => (
                        <div key={met.id} className="ui-flex ui-gap-2 text-sm items-center">
                          {trendIcon(met.metricValue)}
                          <span className="flex-1">{met.metricName}</span>
                          <span className="font-mono">{(met.metricValue * 100).toFixed(1)}%</span>
                          <span className="ui-text-xs-muted">{new Date(met.recordedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {m.accuracyMetrics.length === 0 && <p className="text-sm ui-text-muted">No metrics recorded yet.</p>}
              </Card>
            ))}
            {models.length === 0 && <Card className="p-6 col-span-2 text-center ui-text-muted">No models found.</Card>}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
