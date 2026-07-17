'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DataTable, Badge } from '@unerp/ui';
import { RefreshCw } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

export default function LeadScoringPage() {
    const [loading, setLoading] = useState(true);
    const [models, setModels] = useState<any[]>([]);
    const [training, setTraining] = useState(false);
    const [trainResult, setTrainResult] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const client = useApiClient();

    const fetchData = useCallback(async () => {
        try {
            const [mlData, leadsData] = await Promise.all([
                client.get<any>('/crm/ml-models'),
                client.get<any>('/crm/leads?limit=20&sortBy=score&sortOrder=desc'),
            ]);
            setModels(mlData?.data ?? mlData ?? []);
            setLeads(leadsData?.data ?? leadsData ?? []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [client]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTrain = async () => {
        setTraining(true);
        try {
            const res = await client.post<any>('/crm/ml-models/train', {});
            setTrainResult(res?.data ?? res);
            await fetchData();
        } catch { /* ignore */ } finally { setTraining(false); }
    };

    if (loading) return <RouteGuard permission="crm.read"><div className="ui-page"><Spinner /></div></RouteGuard>;

    const leadColumns = [
        { key: 'firstName', header: 'Name', render: (r: any) => `${r.firstName} ${r.lastName}` },
        { key: 'company', header: 'Company' },
        { key: 'email', header: 'Email' },
        { key: 'score', header: 'Score', render: (r: any) => <Badge variant={r.score >= 80 ? 'success' : r.score >= 50 ? 'warning' : 'default'}>{String(r.score || 0)}</Badge> },
        { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    ];

    return (
        <RouteGuard permission="crm.read">
            <div className="ui-page">
                <PageHeader title="Predictive Lead Scoring" description="ML-powered lead scoring with explainability" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Lead Scoring' }]} />

                <div className={`ui-grid-3 ${styles.modelsGrid}`}>
                    <Card>
                        <div className="ui-card-header"><h3 className="ui-card-title">ML Models</h3></div>
                        <div className="ui-card-body">
                            {models.length === 0 ? <p className="ui-text-sm-muted">No models trained yet</p> : (
                                <div className="ui-stack-3">
                                    {models.map((m: any) => (
                                        <div key={m.id} className={styles.modelRow}>
                                            <div><strong className="text-sm">{m.name}</strong><p className="ui-text-xs-muted m-0">{m.model_type}</p></div>
                                            <Badge variant={m.status === 'ACTIVE' ? 'success' : 'default'}>{m.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className={styles.trainAction}>
                                <Button onClick={handleTrain} disabled={training}><RefreshCw size={14} /> {training ? 'Training...' : 'Train New Model'}</Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="ui-card-header"><h3 className="ui-card-title">Training Results</h3></div>
                        <div className="ui-card-body">
                            {trainResult ? (
                                <div>
                                    <div className="ui-grid-2">
                                        <div><p className="ui-text-xs-muted m-0">Accuracy</p><p className={styles.metricValue}>{trainResult.accuracy}%</p></div>
                                        <div><p className="ui-text-xs-muted m-0">Leads Scored</p><p className={styles.metricValue}>{trainResult.leadsScored}</p></div>
                                        <div><p className="ui-text-xs-muted m-0">Total Leads</p><p className={styles.metricValue}>{trainResult.totalLeads}</p></div>
                                        <div><p className="ui-text-xs-muted m-0">Features</p><p className={styles.featureCount}>{trainResult.featuresUsed?.length || 0}</p></div>
                                    </div>
                                    <div className={styles.featureSection}>
                                        <p className={styles.sectionHint}>Features Used:</p>
                                        <div className={styles.featureList}>
                                            {trainResult.featuresUsed?.map((f: string) => <Badge key={f} variant="default">{f}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                            ) : <p className="ui-text-sm-muted">Train a model to see results</p>}
                        </div>
                    </Card>

                    <Card>
                        <div className="ui-card-header"><h3 className="ui-card-title">Scoring Factors</h3></div>
                        <div className="ui-card-body">
                            <p className={styles.factorDescription}>Top factors influencing lead scores:</p>
                            <div className="ui-stack-2">
                                {[{ factor: 'Email provided', points: 15 }, { factor: 'Phone provided', points: 15 }, { factor: 'Company identified', points: 10 }, { factor: 'Website available', points: 10 }, { factor: 'Industry specified', points: 10 }].map((f) => (
                                    <div key={f.factor} className={styles.factorRow}>
                                        <span className="text-sm">{f.factor}</span>
                                        <span className={styles.factorPoints}>+{f.points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="ui-card-header"><h3 className="ui-card-title">Leads by Score</h3></div>
                    <div className="ui-card-body">
                        <DataTable columns={leadColumns} data={leads} />
                    </div>
                </Card>
            </div>
        </RouteGuard>
    );
}
