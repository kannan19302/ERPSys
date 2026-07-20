'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Button, Spinner } from '@unerp/ui';
import { ToggleLeft, ToggleRight, AlertTriangle, Bot, Cpu, Globe } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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

export default function AiSettingsPage() {
  const client = useApiClient();
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
      const data = await client.get<AiConfig>('/ai/settings/config');
      setConfig(data);
    } catch {
      setConfigError('Could not load AI assistant configuration.');
    } finally {
      setConfigLoading(false);
    }
  }, [client]);

  const fetchEngineStatus = useCallback(async () => {
    try {
      const data = await client.get<OllamaStatus>('/ai/settings/engine/status');
      setEngineStatus(data);
      setEngineStatusError(null);
    } catch {
      setEngineStatusError('Could not check AI engine status.');
    } finally {
      setEngineStatusLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchConfig();
    fetchEngineStatus();
  }, [fetchConfig, fetchEngineStatus]);

  const handleToggleEnabled = async () => {
    if (!config) return;
    setToggling(true);
    setConfigError(null);
    try {
      await client.post('/ai/settings/config', { enabled: !config.enabled });
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
      await client.post('/ai/settings/engine/start');
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
      await client.post('/ai/settings/engine/stop');
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
        title="AI Copilot"
        description="Manage UniERP's AI copilot — the self-hosted assistant available across the app."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'AI Copilot', href: '/ai' }, { label: 'Settings' }]}
      />

      <div className={styles.grid}>
        <Card>
          <div className="p-4 ui-stack-3">
            <div className="ui-flex-between">
              <h3 className={styles.cardTitle}>
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
              <div className={styles.spinnerWrap}>
                <Spinner size="md" />
              </div>
            ) : (
              <button
                onClick={handleToggleEnabled}
                disabled={toggling || !config}
                style={{ cursor: toggling ? 'wait' : 'pointer', color: config?.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.toggleBtn}
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
              <div className={styles.error}>{configError}</div>
            )}

            {!configLoading && config && !config.enabled && (
              <div className={styles.warningBox}>
                <AlertTriangle size={16} className={styles.warningIcon} />
                <span className={styles.infoText}>
                  The AI assistant and floating widget are disabled for this organization.
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4 ui-stack-3">
            <h3 className={styles.cardTitle}>
              <Globe size={16} className={styles.infoIcon} />
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
                <div className={styles.labeledRow}>
                  <span className="ui-text-muted">Model</span>
                  <code className={styles.infoText}>{config?.model || '—'}</code>
                </div>
                <div className={styles.labeledRow}>
                  <span className="ui-text-muted">Ollama Base URL</span>
                  <code className={styles.infoText}>{config?.baseUrl || '—'}</code>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4 ui-stack-3">
            <div className="ui-flex-between">
              <h3 className={styles.cardTitle}>
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

            <div className={styles.engineMeta}>
              <span>Model: {engineStatus?.model || '—'}</span>
              <span>Ollama: {engineStatus?.baseUrl || '—'}</span>
            </div>

            {engineStatusError && (
              <div className={styles.error}>{engineStatusError}</div>
            )}
            {engineActionError && (
              <div className={styles.error}>{engineActionError}</div>
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

            <p className={styles.engineNote}>
              Controls the local Ollama process. Only works when the API server and Ollama run on the same host.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
