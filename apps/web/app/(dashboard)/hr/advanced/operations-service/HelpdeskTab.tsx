'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Spinner, Modal, FormField, Input, Select, Textarea, useToast } from '@unerp/ui';
import { HelpCircle, Plus, Check } from 'lucide-react';

interface HRTicket {
  id: string;
  employeeId: string;
  category: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  resolution: string | null;
  createdAt: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function HelpdeskTab() {
  const [tickets, setTickets] = useState<HRTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', category: 'PAYROLL', title: '', description: '', priority: 'MEDIUM' });

  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [resolution, setResolution] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/tickets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (ticketRes.ok) setTickets(await ticketRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success('Ticket registered successfully.');
        setShowForm(false);
        setForm({ employeeId: '', category: 'PAYROLL', title: '', description: '', priority: 'MEDIUM' });
        fetchData();
      }
    } catch {
      toast.error('Error submitting ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const resolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/advanced-hr/tickets/${selectedTicketId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resolution })
      });
      if (res.ok) {
        toast.success('Ticket marked as resolved.');
        setSelectedTicketId('');
        setResolution('');
        fetchData();
      }
    } catch {
      toast.error('Error resolving ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Submit Query
        </Button>
      </div>

      {selectedTicketId && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Resolve Ticket #{selectedTicketId.substring(0, 8)}</h4>
          <form onSubmit={resolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <textarea
              className="frappe-input"
              placeholder="Resolution details notes..."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              required
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setSelectedTicketId('')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Resolve</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {tickets.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <HelpCircle size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No support tickets registered.</p>
              </div>
            </Card>
          ) : (
            tickets.map(t => (
              <Card key={t.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{t.title}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      Filer: {getEmpName(t.employeeId)} • Category: {t.category} • Created: {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: t.priority === 'HIGH' ? 'var(--color-danger-light)' : 'var(--color-bg-sunken)',
                      color: t.priority === 'HIGH' ? 'var(--color-danger-text)' : 'inherit'
                    }}>{t.priority}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </div>

                <p style={{ fontSize: '13px', margin: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
                  {t.description || 'No description summary provided.'}
                </p>

                {t.resolution && (
                  <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: '12px', marginTop: 12 }}>
                    <span style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Resolution note:</span>
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>{t.resolution}</span>
                  </div>
                )}

                {t.status === 'OPEN' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(t.id)}>
                      <Check size={12} /> Mark Resolved
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Employee Query Ticket"
        footer={<><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={createTicket as any} disabled={submitting}>File Ticket</Button></>}
      >
        <form onSubmit={createTicket} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="Employee" required>
            <Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </Select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="PAYROLL">Payroll / Salaries</option>
                <option value="BENEFITS">Benefits & Perks</option>
                <option value="RELATIONS">Workplace Relations</option>
                <option value="COMPLIANCE">Compliance / Policy</option>
                <option value="OTHER">Other Query</option>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Subject" required>
            <Input placeholder="Brief summary subject" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </FormField>

          <FormField label="Details">
            <Textarea placeholder="Provide exact details for the request..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
