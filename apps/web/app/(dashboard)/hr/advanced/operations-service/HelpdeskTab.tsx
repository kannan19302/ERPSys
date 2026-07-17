'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Spinner, Modal, FormField, Input, Select, Textarea, useToast } from '@unerp/ui';
import { HelpCircle, Plus, Check } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './HelpdeskTab.module.css';

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
  const client = useApiClient();
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

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsData, employeesData] = await Promise.all([
        client.get<HRTicket[] | { data?: HRTicket[] }>('/advanced-hr/tickets'),
        client.get<Employee[] | { data?: Employee[] }>('/hr/employees'),
      ]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []));
      setEmployees(Array.isArray(employeesData) ? employeesData : (employeesData.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/advanced-hr/tickets', form);
      toast.success('Ticket registered successfully.');
      setShowForm(false);
      setForm({ employeeId: '', category: 'PAYROLL', title: '', description: '', priority: 'MEDIUM' });
      fetchData();
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
      await client.request(`/advanced-hr/tickets/${selectedTicketId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution }),
      });
      toast.success('Ticket marked as resolved.');
      setSelectedTicketId('');
      setResolution('');
      fetchData();
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
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Submit Query
        </Button>
      </div>

      {selectedTicketId && (
        <Card padding="md">
          <h4 className={styles.s0}>Resolve Ticket #{selectedTicketId.substring(0, 8)}</h4>
          <form onSubmit={resolveTicket} className="ui-stack-3">
            <textarea
              className="ui-input"
              placeholder="Resolution details notes..."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              required
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setSelectedTicketId('')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Resolve</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="ui-stack-4">
          {tickets.length === 0 ? (
            <Card>
              <div className={styles.s1}>
                <HelpCircle size={32} className={styles.s2} />
                <p className="m-0">No support tickets registered.</p>
              </div>
            </Card>
          ) : (
            tickets.map(t => (
              <Card key={t.id} padding="md">
                <div className={styles.s3}>
                  <div>
                    <h4 className="m-0">{t.title}</h4>
                    <span className="ui-text-caption">
                      Filer: {getEmpName(t.employeeId)} • Category: {t.category} • Created: {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.s4}>
                    <span className={styles.dyn0} style={{ background: t.priority === 'HIGH' ? 'var(--color-danger-light)' : 'var(--color-bg-sunken)', color: t.priority === 'HIGH' ? 'var(--color-danger-text)' : 'inherit' }}>{t.priority}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </div>

                <p className={styles.s5}>
                  {t.description || 'No description summary provided.'}
                </p>

                {t.resolution && (
                  <div className={styles.s6}>
                    <span className={styles.s7}>Resolution note:</span>
                    <span className={styles.s8}>{t.resolution}</span>
                  </div>
                )}

                {t.status === 'OPEN' && (
                  <div className={styles.s9}>
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
        <form onSubmit={createTicket} className="ui-stack-3">
          <FormField label="Employee" required>
            <Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </Select>
          </FormField>

          <div className="ui-grid-2 ui-gap-3">
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


