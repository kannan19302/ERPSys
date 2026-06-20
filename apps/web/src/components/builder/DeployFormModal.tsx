'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Globe, ExternalLink, Copy, Check, X, Loader2, Rocket } from 'lucide-react';
import { useToast } from './ToastProvider';

interface DeployFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The current PageRegistry ID (empty string for a new unsaved form) */
  pageId: string;
  /** Existing module/slug/title if re-publishing */
  existingModule?: string;
  existingSlug?: string;
  existingTitle?: string;
  /** Called after the save + publish succeed */
  onPublished?: (result: { route: string; pageId: string }) => void;
}

export function DeployFormModal({
  isOpen,
  onClose,
  pageId,
  existingModule = '',
  existingSlug = '',
  existingTitle = '',
  onPublished,
}: DeployFormModalProps) {
  const { showToast } = useToast();

  const [title, setTitle] = useState(existingTitle);
  const [moduleValue, setModuleValue] = useState(existingModule || 'custom');
  const [slugValue, setSlugValue] = useState(existingSlug || '');
  const [description, setDescription] = useState('');
  const [existingModules, setExistingModules] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ route: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-suggest slug from title
  useEffect(() => {
    if (title && !existingSlug) {
      setSlugValue(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      );
    }
  }, [title, existingSlug]);

  // Fetch distinct modules for the datalist
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadModules() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/builder/page-registries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted || !res.ok) return;
        const pages = await res.json();
        const mods = [...new Set((pages as any[]).map((p) => p.module).filter(Boolean))];
        setExistingModules(mods);
      } catch {
        // ignore — use default list
      }
    }
    loadModules();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(existingTitle);
      setModuleValue(existingModule || 'custom');
      setSlugValue(existingSlug || '');
      setDescription('');
      setDeployResult(null);
      setCopied(false);
      setIsDeploying(false);
    }
  }, [isOpen, existingTitle, existingModule, existingSlug]);

  const fullRoute = `/app/${moduleValue || 'custom'}/${slugValue || 'untitled'}`;

  const isValid =
    title.trim().length > 0 &&
    moduleValue.trim().length > 0 &&
    slugValue.trim().length > 0 &&
    /^[a-z0-9][a-z0-9-]*$/.test(slugValue);

  const handleDeploy = useCallback(async () => {
    if (!isValid || !pageId) return;
    setIsDeploying(true);
    try {
      const token = localStorage.getItem('token') || '';

      // Step 1: save the BuilderForm with real module/slug/name
      const savePayload = {
        module: moduleValue,
        slug: slugValue,
        name: title.trim(),
        status: 'PUBLISHED',
      };

      const saveRes = await fetch(`/api/v1/builder/forms/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(savePayload),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        showToast(`Save failed: ${err.message || 'Server error'}`, 'error');
        setIsDeploying(false);
        return;
      }

      // Step 2: publish — creates/links the backing SchemaRegistry & PageRegistry
      const pubRes = await fetch(`/api/v1/builder/forms/${pageId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!pubRes.ok) {
        const err = await pubRes.json();
        showToast(`Publish failed: ${err.message || 'Server error'}`, 'error');
        setIsDeploying(false);
        return;
      }

      // Notify sidebar to refresh
      window.dispatchEvent(new Event('unerp_page_registry_updated'));

      setDeployResult({ route: `/app/${moduleValue}/${slugValue}` });
      showToast('Form published successfully!', 'success');
      onPublished?.({ route: `/app/${moduleValue}/${slugValue}`, pageId });
    } catch {
      showToast('An error occurred during deployment.', 'error');
    } finally {
      setIsDeploying(false);
    }
  }, [isValid, pageId, moduleValue, slugValue, title, showToast, onPublished]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}${deployResult?.route || fullRoute}`;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        showToast('Link copied to clipboard', 'success');
        setTimeout(() => setCopied(false), 2000);
      },
      () => showToast('Failed to copy', 'error'),
    );
  }, [deployResult, fullRoute, showToast]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="modal-card frappe-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          marginBottom: 0,
        }}
      >
        {/* Header */}
        <div
          className="frappe-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Rocket size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>
              Deploy to App
            </span>
          </div>
          <button
            onClick={onClose}
            className="frappe-btn frappe-btn-icon"
            style={{ border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="frappe-card-body">
          {!deployResult ? (
            <>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-5)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                Deploy this form as a live page in your ERP. Once published, the form
                will appear in the sidebar under the chosen module and any records
                submitted will be persisted automatically.
              </p>

              {/* Title */}
              <div className="frappe-form-group">
                <label className="frappe-label">Page Title</label>
                <input
                  className="frappe-input"
                  placeholder="e.g. Vehicle Maintenance Request"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Module */}
              <div className="frappe-form-group">
                <label className="frappe-label">Target Module</label>
                <input
                  className="frappe-input"
                  placeholder="e.g. hr, crm, custom"
                  value={moduleValue}
                  onChange={(e) => setModuleValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  list="module-suggestions"
                />
                <datalist id="module-suggestions">
                  {existingModules.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              {/* Slug */}
              <div className="frappe-form-group">
                <label className="frappe-label">URL Slug</label>
                <input
                  className="frappe-input"
                  placeholder="e.g. vehicle-maintenance"
                  value={slugValue}
                  onChange={(e) =>
                    setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  style={{
                    borderColor: slugValue && !/^[a-z0-9][a-z0-9-]*$/.test(slugValue)
                      ? 'var(--color-danger)'
                      : undefined,
                  }}
                />
                {slugValue && !/^[a-z0-9][a-z0-9-]*$/.test(slugValue) && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--space-1)' }}>
                    Only lowercase letters, numbers, and hyphens are allowed. Must start with a letter or number.
                  </p>
                )}
              </div>

              {/* Description (optional) */}
              <div className="frappe-form-group">
                <label className="frappe-label">Description (optional)</label>
                <input
                  className="frappe-input"
                  placeholder="Brief description shown in the sidebar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Route Preview */}
              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--color-bg-sunken)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Globe size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fullRoute}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="frappe-btn frappe-btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="frappe-btn frappe-btn-primary"
                  onClick={handleDeploy}
                  disabled={!isValid || isDeploying}
                  style={{ gap: 'var(--space-2)' }}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      <span>Publish Form</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* ── Success State ── */
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-success-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <Check size={28} style={{ color: 'var(--color-success)' }} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>
                Form Published!
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                Your form is now live at the following route:
              </p>

              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--color-bg-sunken)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <Globe size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {deployResult.route}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                <button
                  className="frappe-btn frappe-btn-secondary"
                  onClick={handleCopyLink}
                  style={{ gap: 'var(--space-2)' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
                <a
                  href={deployResult.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="frappe-btn frappe-btn-primary"
                  style={{ gap: 'var(--space-2)', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Page</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
