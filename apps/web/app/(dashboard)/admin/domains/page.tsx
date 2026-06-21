'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  verified: boolean;
}

interface CustomDomain {
  id: string;
  domain: string;
  status: string;
  dnsRecords: DnsRecord[];
  createdAt: string;
}

export default function CustomDomainsPage() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/domains', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDomains(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setAdding(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/platform/domains', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ domain: newDomain }),
      });
      if (res.ok) {
        setNewDomain('');
        setFeedback(`Custom domain request added. Configure DNS settings to verify.`);
        setTimeout(() => setFeedback(null), 4000);
        fetchDomains();
      }
    } catch (e) {
      console.error(e);
      setFeedback('Error adding custom domain.');
    } finally {
      setAdding(false);
    }
  };

  const handleCopyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    alert('Copied DNS record value to clipboard.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Globe style={{ color: 'var(--color-primary)' }} />
          Custom Domain & DNS Registry
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Link custom brand domains and verify domain ownership settings via hosting DNS records.
        </p>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'rgba(var(--color-success-rgb), 0.1)', border: '1px solid var(--color-success)',
          color: 'var(--color-success)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {/* Add Custom Domain Form */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <form onSubmit={handleAddDomain} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Add custom brand domain</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input
              type="text"
              required
              placeholder="e.g. erp.yourcompany.com"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
            <button type="submit" disabled={adding || !newDomain} style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
              cursor: (adding || !newDomain) ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
            }}>
              <Plus size={16} /> Add Domain
            </button>
          </div>
        </form>
      </div>

      {/* Custom Domains list and details */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {domains.map(d => (
            <div key={d.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Globe size={18} style={{ color: 'var(--color-primary)' }} />
                  <strong style={{ fontSize: 'var(--text-base)' }}>{d.domain}</strong>
                </div>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--weight-semibold)',
                  background: d.status === 'ACTIVE' ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-warning-rgb), 0.1)',
                  color: d.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)'
                }}>{d.status}</span>
              </div>

              {d.status === 'VERIFYING' && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-warning)' }}>
                    <AlertCircle size={12} /> Complete DNS Configuration to Verify Domain
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                    Add the following DNS records inside your domain registry configuration (e.g. Cloudflare, GoDaddy):
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {d.dnsRecords.map((r, rIdx) => (
                      <div key={rIdx} style={{
                        display: 'grid', gridTemplateColumns: '80px 150px 1fr 50px', alignItems: 'center',
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: '11px'
                      }}>
                        <strong>Type: {r.type}</strong>
                        <span>Host: <code>{r.host}</code></span>
                        <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{r.value}</span>
                        <button
                          onClick={() => handleCopyToClipboard(r.value)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'flex-end' }}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {domains.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
              No custom domains added. You are currently browsing from the default tenant subdomain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
