'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, StatusBadge, Spinner, ProtectedComponent, useToast } from '@unerp/ui';
import { Search, UserPlus, Ban, RotateCcw, Copy } from 'lucide-react';
import { apiGet, apiPost, apiPatch, ApiRequestError } from '../../../../src/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface PortalUser {
  id: string;
  email: string;
  status: string;
  contactId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function CustomerPortalAdminPage() {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const searchCustomers = useCallback(async () => {
    if (!search.trim()) {
      setCustomers([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const res = await apiGet<{ data: Customer[] } | Customer[]>(
        `/crm/customers?search=${encodeURIComponent(search)}&limit=10`,
      );
      const list = Array.isArray(res) ? res : (res as { data: Customer[] }).data ?? [];
      setCustomers(list);
    } catch (e) {
      error(e instanceof ApiRequestError ? e.message : 'Failed to search customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, [search, error]);

  useEffect(() => {
    const t = setTimeout(searchCustomers, 300);
    return () => clearTimeout(t);
  }, [searchCustomers]);

  const loadUsers = useCallback(async (customerId: string) => {
    setLoadingUsers(true);
    try {
      const list = await apiGet<PortalUser[]>(`/crm/customers/${customerId}/portal-users`);
      setUsers(list);
    } catch (e) {
      error(e instanceof ApiRequestError ? e.message : 'Failed to load portal users');
    } finally {
      setLoadingUsers(false);
    }
  }, [error]);

  useEffect(() => {
    if (selected) loadUsers(selected.id);
  }, [selected, loadUsers]);

  const handleInvite = async () => {
    if (!selected || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await apiPost<{ email: string; tempPassword: string }>(
        `/crm/customers/${selected.id}/portal-users`,
        { email: inviteEmail.trim() },
      );
      success(`Invited ${result.email}. Temp password: ${result.tempPassword}`);
      setInviteEmail('');
      loadUsers(selected.id);
    } catch (e) {
      error(e instanceof ApiRequestError ? e.message : 'Failed to invite portal user');
    } finally {
      setInviting(false);
    }
  };

  const handleDisable = async (userId: string) => {
    if (!selected) return;
    try {
      await apiPatch(`/crm/customers/${selected.id}/portal-users/${userId}/disable`);
      success('Portal user disabled');
      loadUsers(selected.id);
    } catch (e) {
      error(e instanceof ApiRequestError ? e.message : 'Failed to disable portal user');
    }
  };

  const handleReactivate = async (userId: string) => {
    if (!selected) return;
    try {
      await apiPatch(`/crm/customers/${selected.id}/portal-users/${userId}/reactivate`);
      success('Portal user reactivated');
      loadUsers(selected.id);
    } catch (e) {
      error(e instanceof ApiRequestError ? e.message : 'Failed to reactivate portal user');
    }
  };

  return (
    <div className="frappe-page">
      <PageHeader
        title="Customer Self-Service Portal"
        description="Invite and manage customer logins for viewing quotes, orders, invoices and support cases"
      />

      <Card className="frappe-card">
        <div className="frappe-form-group">
          <label className="frappe-label">Find customer</label>
          <div className="frappe-input-group" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: 0.5 }} />
            <input
              className="frappe-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search customers by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingCustomers && <Spinner size="sm" />}

        {!loadingCustomers && customers.length > 0 && !selected && (
          <ul className="frappe-list-simple">
            {customers.map((c) => (
              <li key={c.id}>
                <button className="frappe-list-item-button" onClick={() => setSelected(c)}>
                  <strong>{c.name}</strong>
                  {c.email ? <span style={{ opacity: 0.6 }}> — {c.email}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loadingCustomers && search.trim() && customers.length === 0 && !selected && (
          <p className="frappe-empty-state">No customers match &quot;{search}&quot;.</p>
        )}
      </Card>

      {selected && (
        <Card className="frappe-card" style={{ marginTop: 16 }}>
          <div className="frappe-card-header">
            <h3>{selected.name}</h3>
            <Button variant="secondary" onClick={() => { setSelected(null); setUsers([]); }}>
              Change customer
            </Button>
          </div>

          <ProtectedComponent permission="crm.customer-portal.manage">
            <div className="frappe-form-inline" style={{ marginBottom: 16 }}>
              <input
                className="frappe-input"
                placeholder="portal-user@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                <UserPlus size={16} /> Invite portal user
              </Button>
            </div>
          </ProtectedComponent>

          {loadingUsers ? (
            <Spinner size="sm" />
          ) : users.length === 0 ? (
            <p className="frappe-empty-state">No portal users invited for this customer yet.</p>
          ) : (
            <table className="frappe-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td>
                      <ProtectedComponent permission="crm.customer-portal.manage">
                        {u.status === 'DISABLED' ? (
                          <Button size="sm" variant="secondary" onClick={() => handleReactivate(u.id)}>
                            <RotateCcw size={14} /> Reactivate
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => handleDisable(u.id)}>
                            <Ban size={14} /> Disable
                          </Button>
                        )}
                      </ProtectedComponent>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
