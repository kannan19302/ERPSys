'use client';
import styles from './page.module.css';
import React, { useCallback, useEffect, useState } from 'react';
import {
  PageHeader, Card, Button, ProtectedComponent, useToast, Spinner,
  TextField, FormField, Select,
} from '@unerp/ui';
import { Store, Save } from 'lucide-react';
import { ApiRequestError, RouteGuard, useApiClient } from '@unerp/framework';

const MANAGE_PERMISSION = 'ecommerce.storefront.manage';

interface StorefrontConfig {
  id?: string;
  storeName: string;
  storeSlug: string;
  isEnabled: boolean;
  currency: string;
  contactEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

const EMPTY_CONFIG: StorefrontConfig = {
  storeName: '',
  storeSlug: '',
  isEnabled: false,
  currency: 'USD',
  contactEmail: '',
  logoUrl: '',
  primaryColor: '',
};

export default function EcommerceConfigPage() {
  const client = useApiClient();
  const toast = useToast();
  const [config, setConfig] = useState<StorefrontConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNew, setIsNew] = useState(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.get<StorefrontConfig | null>('/ecommerce/config');
      if (data) {
        setConfig({
          storeName: data.storeName,
          storeSlug: data.storeSlug,
          isEnabled: data.isEnabled,
          currency: data.currency,
          contactEmail: data.contactEmail || '',
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '',
        });
        setIsNew(false);
      } else {
        setConfig(EMPTY_CONFIG);
        setIsNew(true);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load storefront configuration.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!config.storeName.trim()) nextErrors.storeName = 'Store name is required';
    if (!/^[a-z0-9-]+$/.test(config.storeSlug || '')) {
      nextErrors.storeSlug = 'Slug must be lowercase letters, numbers, and hyphens only';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        storeName: config.storeName,
        storeSlug: config.storeSlug,
        isEnabled: config.isEnabled,
        currency: config.currency,
        contactEmail: config.contactEmail || undefined,
        logoUrl: config.logoUrl || undefined,
        primaryColor: config.primaryColor || undefined,
      };
      await client.request('/ecommerce/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success('Storefront configuration saved');
      setIsNew(false);
      void fetchConfig();
    } catch (err) {
      toast.error('Failed to save configuration', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard permission={MANAGE_PERMISSION}>
    <div className="ui-stack-6">
      <PageHeader
        title="E-Commerce Storefront"
        description="Configure your public-facing online store: branding, currency, and availability."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'E-Commerce' },
        ]}
        actions={
          <ProtectedComponent permission={MANAGE_PERMISSION}>
            <Button variant="primary" onClick={handleSave} disabled={saving || loading} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </ProtectedComponent>
        }
      />

      {loading ? (
        <div className="ui-flex-center p-8">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <div className={styles.s1}>
            {error}
            <div className={styles.s2}>
              <Button variant="outline" onClick={fetchConfig}>Retry</Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {isNew && (
            <Card>
              <div className={styles.s3}>
                <Store size={20} className="ui-text-primary" />
                <div>
                  <div className="ui-heading-sm">Get started</div>
                  <div className="ui-text-xs-tertiary">
                    No storefront has been configured yet. Fill in the details below and save to create it.
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className={styles.s4}>
              <div className={styles.s5}>
                <div>
                  <div className="ui-heading-base">Enable Storefront</div>
                  <div className="ui-text-xs-tertiary">
                    When enabled, /store/{config.storeSlug || '[slug]'} becomes reachable to external customers.
                  </div>
                </div>
                <ProtectedComponent permission={MANAGE_PERMISSION} fallback={
                  <span className="ui-text-xs-tertiary">
                    {config.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                }>
                  <label className={styles.s6}>
                    <input
                      type="checkbox"
                      checked={config.isEnabled}
                      onChange={(e) => setConfig((c) => ({ ...c, isEnabled: e.target.checked }))}
                      className={styles.s7}
                    />
                    <span className="text-sm">{config.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </ProtectedComponent>
              </div>

              <div className={`ui-grid-3 ${styles.s8}`} >
                <TextField
                  label="Store Name"
                  required
                  value={config.storeName}
                  onChange={(e) => setConfig((c) => ({ ...c, storeName: e.target.value }))}
                  error={errors.storeName}
                  placeholder="Acme Online Store"
                />
                <TextField
                  label="Store Slug"
                  required
                  value={config.storeSlug}
                  onChange={(e) => setConfig((c) => ({ ...c, storeSlug: e.target.value.toLowerCase() }))}
                  error={errors.storeSlug}
                  hint="Used in the public URL: /store/[slug]"
                  placeholder="acme"
                />
                <FormField label="Currency">
                  <Select
                    value={config.currency}
                    onChange={(e) => setConfig((c) => ({ ...c, currency: e.target.value }))}
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                  </Select>
                </FormField>
                <TextField
                  label="Contact Email"
                  type="email"
                  value={config.contactEmail || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, contactEmail: e.target.value }))}
                  placeholder="store@example.com"
                />
                <TextField
                  label="Logo URL"
                  value={config.logoUrl || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <TextField
                  label="Primary Brand Color"
                  value={config.primaryColor || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                  hint="e.g. #2563eb"
                  placeholder="#2563eb"
                />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
    </RouteGuard>
  );
}
