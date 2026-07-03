'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Button, Spinner } from '@unerp/ui';
import { ToggleLeft, ToggleRight, AlertTriangle, Bot, Cpu, Globe } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface AiConfig {
  enabled: boolean;
  model: string;
  baseUrl: string;
}

interface OllamaStatus {
  running: boolean;
  version?: string;
  baseUrl: string;
  model: string;
}

export default function AiAdminPage() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const [engineStatus, setEngineStatus] = useState<OllamaStatus | null>(null);
  const [engineStatusLoading, setEngineStatusLoading] = useState(true);
  const [engineStatusError, setEngineStatusError] = useState<string | null>(null);
  const [engineActionLoading, setEngineActionLoading] = useState<'start' | 'stop' | null>(null);
  const [engineActionError, setEngineActionError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const data = await apiGet<AiConfig>('/admin/ai/config');
      setConfig(data);
    } catch {
      setConfigError('Could not load AI assistant configuration.');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchEngineStatus = useCallback(async () => {
    try {
      const data = await apiGet<OllamaStatus>('/admin/ai/engine/status');
      setEngineStatus(data);
      setEngineStatusError(null);
    } catch {
      setEngineStatusError('Could not check AI engine status.');
    } finally {
      setEngineStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchEngineStatus();
  }, [fetchConfig, fetchEngineStatus]);

  const handleToggleEnabled = async () => {
    if (!config) return;
    setToggling(true);
    setConfigError(null);
    try {
      await apiPost('/admin/ai/config', { enabled: !config.enabled });
    } catch {
      setConfigError('Failed to update AI assistant setting.');
    } finally {
      setToggling(false);
      await fetchConfig();
    }
  };

  const handleStartEngine = async () => {
    setEngineActionLoading('start');
    setEngineActionError(null);
    try {
      await apiPost('/admin/ai/engine/start');
    } catch {
      setEngineActionError('Failed to start the AI engine.');
    } finally {
      setEngineActionLoading(null);
      await fetchEngineStatus();
    }
  };

  const handleStopEngine = async () => {
    setEngineActionLoading('stop');
    setEngineActionError(null);
    try {
      await apiPost('/admin/ai/engine/stop');
    } catch {
      setEngineActionError('Failed to stop the AI engine.');
    } finally {
      setEngineActionLoading(null);
      await fetchEngineStatus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="AI Assistant"
        description="Manage UniERP's AI copilot — the self-hosted assistant available across the app."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'AI Assistant' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Kill switch card */}
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Bot size={16} style={{ color: 'var(--color-primary)' }} />
                AI Assistant Enabled
              </h3>
              {configLoading ? (
                <Badge variant="default">Loading…</Badge>
              ) : config?.enabled ? (
                <Badge variant="success">Enabled</Badge>
              ) : (
                <Badge variant="danger">Disabled</Badge>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Turns the AI copilot on or off for every user in this organization, including the floating chat widget
              and all AI-powered actions across the app.
            </p>

            {configLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
                <Spinner size="md" />
              </div>
            ) : (
              <button
                onClick={handleToggleEnabled}
                disabled={toggling || !config}
                style={{
                  background: 'transparent', border: 'none', cursor: toggling ? 'wait' : 'pointer',
                  color: config?.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)', alignSelf: 'flex-start',
                  fontSize: 'var(--text-sm)', padding: 0,
                }}
              >
                {toggling ? (
                  <Spinner size="sm" />
                ) : config?.enabled ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
                <span>{config?.enabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            )}

            {configError && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>{configError}</div>
            )}

            {!configLoading && config && !config.enabled && (
              <div style={{
                display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
                padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                background: 'rgba(var(--color-warning-rgb), 0.1)', border: '1px solid var(--color-warning)',
              }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                  The AI assistant and floating widget are disabled for this organization.
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Model info card (read-only) */}
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Globe size={16} style={{ color: 'var(--color-info)' }} />
              Model Configuration
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              UniERP runs a self-hosted Ollama model. These values are set via environment configuration and are not
              editable per tenant in this release.
            </p>
            {configLoading ? (
              <Spinner size="sm" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <LabeledValue label="Model" value={config?.model || '—'} />
                <LabeledValue label="Ollama Base URL" value={config?.baseUrl || '—'} />
              </div>
            )}
          </div>
        </Card>

        {/* Engine control card (relocated from admin dashboard) */}
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Cpu size={16} style={{ color: 'var(--color-text-secondary)' }} />
                AI Engine (Ollama)
              </h3>
              {engineStatusLoading ? (
                <Badge variant="default">Checking…</Badge>
              ) : engineStatus?.running ? (
                <Badge variant="success">Running</Badge>
              ) : (
                <Badge variant="danger">Stopped</Badge>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <span>Model: {engineStatus?.model || '—'}</span>
              <span>Ollama: {engineStatus?.baseUrl || '—'}</span>
            </div>

            {engineStatusError && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>{engineStatusError}</div>
            )}
            {engineActionError && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>{engineActionError}</div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartEngine}
                disabled={engineStatusLoading || !!engineStatus?.running || engineActionLoading !== null}
                isLoading={engineActionLoading === 'start'}
                style={{ flex: 1 }}
              >
                {engineActionLoading === 'start' ? 'Starting…' : 'Start'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStopEngine}
                disabled={engineStatusLoading || !engineStatus?.running || engineActionLoading !== null}
                isLoading={engineActionLoading === 'stop'}
                style={{ flex: 1 }}
              >
                {engineActionLoading === 'stop' ? 'Stopping…' : 'Stop'}
              </Button>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              Controls the local Ollama process. Only works when the API server and Ollama run on the same host.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{value}</code>
    </div>
  );
}
