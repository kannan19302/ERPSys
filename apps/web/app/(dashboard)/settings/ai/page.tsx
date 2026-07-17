'use client';
import styles from './page.module.css';
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
      const data = await apiGet<AiConfig>('/settings/ai/config');
      setConfig(data);
    } catch {
      setConfigError('Could not load AI assistant configuration.');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchEngineStatus = useCallback(async () => {
    try {
      const data = await apiGet<OllamaStatus>('/settings/ai/engine/status');
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
    <div className="ui-stack-6">
      <PageHeader
        title="AI Assistant"
        description="Manage UniERP's AI copilot — the self-hosted assistant available across the app."
        breadcrumbs={[{ label: 'Administration', href: '/settings' }, { label: 'AI Assistant' }]}
      />

      <div className={styles.s1}>
        {/* Kill switch card */}
        <Card>
          <div className="p-4 ui-stack-3">
            <div className="ui-flex-between">
              <h3 className={styles.s2}>
                <Bot size={16} className="ui-text-primary" />
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

            <p className="ui-text-xs-muted m-0">
              Turns the AI copilot on or off for every user in this organization, including the floating chat widget
              and all AI-powered actions across the app.
            </p>

            {configLoading ? (
              <div className={styles.s3}>
                <Spinner size="md" />
              </div>
            ) : (
              <button
                onClick={handleToggleEnabled}
                disabled={toggling || !config}
                style={{ cursor: toggling ? 'wait' : 'pointer', color: config?.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s4}
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
              <div className={styles.s5}>{configError}</div>
            )}

            {!configLoading && config && !config.enabled && (
              <div className={styles.s6}>
                <AlertTriangle size={16} className={styles.s11} />
                <span className={styles.s7}>
                  The AI assistant and floating widget are disabled for this organization.
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Model info card (read-only) */}
        <Card>
          <div className="p-4 ui-stack-3">
            <h3 className={styles.s2}>
              <Globe size={16} className={styles.s12} />
              Model Configuration
            </h3>
            <p className="ui-text-xs-muted m-0">
              UniERP runs a self-hosted Ollama model. These values are set via environment configuration and are not
              editable per tenant in this release.
            </p>
            {configLoading ? (
              <Spinner size="sm" />
            ) : (
              <div className="ui-stack-2">
                <LabeledValue label="Model" value={config?.model || '—'} />
                <LabeledValue label="Ollama Base URL" value={config?.baseUrl || '—'} />
              </div>
            )}
          </div>
        </Card>

        {/* Engine control card (relocated from admin dashboard) */}
        <Card>
          <div className="p-4 ui-stack-3">
            <div className="ui-flex-between">
              <h3 className={styles.s2}>
                <Cpu size={16} className="ui-text-muted" />
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

            <div className={styles.s8}>
              <span>Model: {engineStatus?.model || '—'}</span>
              <span>Ollama: {engineStatus?.baseUrl || '—'}</span>
            </div>

            {engineStatusError && (
              <div className={styles.s5}>{engineStatusError}</div>
            )}
            {engineActionError && (
              <div className={styles.s5}>{engineActionError}</div>
            )}

            <div className="ui-flex ui-gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartEngine}
                disabled={engineStatusLoading || !!engineStatus?.running || engineActionLoading !== null}
                isLoading={engineActionLoading === 'start'}
                className="flex-1"
              >
                {engineActionLoading === 'start' ? 'Starting…' : 'Start'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStopEngine}
                disabled={engineStatusLoading || !engineStatus?.running || engineActionLoading !== null}
                isLoading={engineActionLoading === 'stop'}
                className="flex-1"
              >
                {engineActionLoading === 'stop' ? 'Stopping…' : 'Stop'}
              </Button>
            </div>

            <p className={styles.s9}>
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
    <div className={styles.s10}>
      <span className="ui-text-muted">{label}</span>
      <code className={styles.s7}>{value}</code>
    </div>
  );
}
