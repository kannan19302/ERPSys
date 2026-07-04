'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, TextField, FormField, Select } from '@unerp/ui';
import { Globe, Trash2, Plus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface IpRestriction {
  id: string;
  ipRange: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  createdAt: string;
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function IpRestrictionsTab() {
  const [ipRestrictions, setIpRestrictions] = useState<IpRestriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newIpRange, setNewIpRange] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');
  const [newIpRuleType, setNewIpRuleType] = useState('ALLOW');
  const [ipSaving, setIpSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchIpRestrictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ip-restrictions`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setIpRestrictions(data);
      } else {
        setError(`Failed to fetch IP restrictions: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to load IP rules', e);
      setError('Connection error fetching restrictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIpRestrictions(); }, [fetchIpRestrictions]);

  const addIpRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpRange) return;
    setIpSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/ip-restrictions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ipRange: newIpRange, description: newIpDesc, ruleType: newIpRuleType }),
      });
      if (res.ok) {
        setNewIpRange('');
        setNewIpDesc('');
        setModalOpen(false);
        setSuccess('IP restriction rule added successfully');
        setTimeout(() => setSuccess(null), 3000);
        fetchIpRestrictions();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || `Failed to add rule: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to add IP rule', e);
      setError('Connection error saving restriction');
    } finally {
      setIpSaving(false);
    }
  };

  const deleteIpRestriction = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/ip-restrictions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess('IP restriction rule removed');
        setTimeout(() => setSuccess(null), 3000);
        fetchIpRestrictions();
      } else {
        setError(`Failed to delete rule: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to delete IP rule', e);
      setError('Connection error deleting restriction');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={14} style={{ marginRight: 6 }} /> Add IP Rule
        </Button>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Active IP Restrictions ({ipRestrictions.length})</h3>
          <button
            onClick={fetchIpRestrictions}
            disabled={loading}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : ipRestrictions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No custom IP rules active. Anyone can log in from any network location.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ipRestrictions.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Globe size={20} style={{ color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <code style={{ fontSize: '13px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{rule.ipRange}</code>
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'var(--weight-bold)',
                        background: rule.ruleType === 'ALLOW' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                        color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                      >
                        {rule.ruleType}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {rule.description || 'No description provided'} &bull; Created {new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteIpRestriction(rule.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}
                  title="Remove Rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add IP Access Rule"
        description="Configure IP whitelist or blacklist filters"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={ipSaving}>Cancel</Button>
            <Button variant="primary" onClick={addIpRestriction as any} disabled={ipSaving}>
              {ipSaving ? 'Adding...' : 'Add Rule'}
            </Button>
          </>
        }
      >
        <form onSubmit={addIpRestriction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField
            label="IP Address / CIDR Block"
            placeholder="e.g. 192.168.1.0/24 or 203.0.113.50"
            required
            value={newIpRange}
            onChange={(e) => setNewIpRange(e.target.value)}
          />
          <TextField
            label="Description / Label"
            placeholder="e.g. London Office, Production VPN"
            value={newIpDesc}
            onChange={(e) => setNewIpDesc(e.target.value)}
          />
          <FormField label="Rule Action">
            <Select value={newIpRuleType} onChange={(e) => setNewIpRuleType(e.target.value)}>
              <option value="ALLOW">ALLOW Access</option>
              <option value="DENY">DENY Access</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
