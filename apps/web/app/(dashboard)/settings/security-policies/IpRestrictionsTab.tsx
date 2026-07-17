'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, TextField, FormField, Select } from '@unerp/ui';
import { Globe, Trash2, Plus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './IpRestrictionsTab.module.css';

interface IpRestriction {
  id: string;
  ipRange: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  createdAt: string;
}

export default function IpRestrictionsTab() {
  const client = useApiClient();
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
      const data = await client.get<IpRestriction[]>('/admin/security/ip-restrictions');
      setIpRestrictions(data);
    } catch (error) {
      setError(error instanceof Error ? `Failed to fetch IP restrictions: ${error.message}` : 'Connection error fetching restrictions');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchIpRestrictions(); }, [fetchIpRestrictions]);

  const addIpRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpRange) return;
    setIpSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await client.post('/admin/security/ip-restrictions', { ipRange: newIpRange, description: newIpDesc, ruleType: newIpRuleType });
      setNewIpRange('');
      setNewIpDesc('');
      setModalOpen(false);
      setSuccess('IP restriction rule added successfully');
      setTimeout(() => setSuccess(null), 3000);
      await fetchIpRestrictions();
    } catch (error) {
      setError(error instanceof Error ? `Failed to add rule: ${error.message}` : 'Connection error saving restriction');
    } finally {
      setIpSaving(false);
    }
  };

  const deleteIpRestriction = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await client.delete(`/admin/security/ip-restrictions/${id}`);
      setSuccess('IP restriction rule removed');
      setTimeout(() => setSuccess(null), 3000);
      await fetchIpRestrictions();
    } catch (error) {
      setError(error instanceof Error ? `Failed to delete rule: ${error.message}` : 'Connection error deleting restriction');
    }
  };

  return (
    <div className={styles.s1}>
      {error && (
        <div className={styles.s2}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.s3}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={14} className="mr-2" /> Add IP Rule
        </Button>
      </div>

      <div className="ui-card p-5">
        <div className="ui-flex-between mb-4">
          <h3 className={styles.s4}>Active IP Restrictions ({ipRestrictions.length})</h3>
          <button
            onClick={fetchIpRestrictions}
            disabled={loading}
            className={styles.s5}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : ipRestrictions.length === 0 ? (
          <div className={styles.s6}>
            No custom IP rules active. Anyone can log in from any network location.
          </div>
        ) : (
          <div className="ui-stack-3">
            {ipRestrictions.map((rule) => (
              <div
                key={rule.id}
                className={styles.s7}
              >
                <div className="ui-hstack-3">
                  <Globe size={20} style={{ color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)' }} />
                  <div>
                    <div className="ui-hstack-2">
                      <code className={styles.s8}>{rule.ipRange}</code>
                      <span className={styles.s9} style={{background: rule.ruleType === 'ALLOW' ? 'var(--color-success-light)' : 'var(--color-error-light)', color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)'}}
                      >
                        {rule.ruleType}
                      </span>
                    </div>
                    <div className={styles.s10}>
                      {rule.description || 'No description provided'} &bull; Created {new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteIpRestriction(rule.id)}
                  className={styles.s11}
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
        <form onSubmit={addIpRestriction} className="ui-stack-4">
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
