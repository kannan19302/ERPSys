'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      setDomains(await client.get<CustomDomain[]>('/admin/platform/domains'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDomains();
  }, [client]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setAdding(true);
    setFeedback(null);
    try {
      await client.post('/admin/platform/domains', { domain: newDomain });
      {
        setNewDomain('');
        setFeedback(`Custom domain request added. Configure DNS settings to verify.`);
        setTimeout(() => setFeedback(null), 4000);
        void fetchDomains();
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
    <RouteGuard permission="settings.domains.read">
    <div className={styles.p1}>
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Globe className="ui-text-primary" />
          Custom Domain & DNS Registry
        </h1>
        <p className="ui-text-sm-muted">
          Link custom brand domains and verify domain ownership settings via hosting DNS records.
        </p>
      </div>

      {feedback && (
        <div className={styles.p2}>
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {/* Add Custom Domain Form */}
      <div className="ui-card p-5">
        <form onSubmit={handleAddDomain} className="ui-stack-4">
          <h2 className={styles.p3}>Add custom brand domain</h2>
          <div className="ui-flex ui-gap-3">
            <input
              type="text"
              required
              placeholder="e.g. erp.yourcompany.com"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              className={styles.p4}
            />
            <button type="submit" disabled={adding || !newDomain} style={{ cursor: (adding || !newDomain) ? 'wait' : 'pointer' }} className={styles.s1}>
              <Plus size={16} /> Add Domain
            </button>
          </div>
        </form>
      </div>

      {/* Custom Domains list and details */}
      {loading ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : (
        <div className="ui-stack-4">
          {domains.map(d => (
            <div key={d.id} className={styles.p5}>
              <div className="ui-flex-between">
                <div className="ui-hstack-2">
                  <Globe size={18} className="ui-text-primary" />
                  <strong className={styles.p6}>{d.domain}</strong>
                </div>
                <span style={{ background: d.status === 'ACTIVE' ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-warning-rgb), 0.1)', color: d.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s2}>{d.status}</span>
              </div>

              {d.status === 'VERIFYING' && (
                <div className={styles.p7}>
                  <h4 className={styles.p8}>
                    <AlertCircle size={12} /> Complete DNS Configuration to Verify Domain
                  </h4>
                  <p className={styles.p9}>
                    Add the following DNS records inside your domain registry configuration (e.g. Cloudflare, GoDaddy):
                  </p>

                  <div className="ui-stack-2">
                    {d.dnsRecords.map((r, rIdx) => (
                      <div key={rIdx} className={styles.p10}>
                        <strong>Type: {r.type}</strong>
                        <span>Host: <code>{r.host}</code></span>
                        <span className={styles.p11}>{r.value}</span>
                        <button
                          onClick={() => handleCopyToClipboard(r.value)}
                          className={styles.p12}
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
            <div className={styles.p13}>
              No custom domains added. You are currently browsing from the default tenant subdomain.
            </div>
          )}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
