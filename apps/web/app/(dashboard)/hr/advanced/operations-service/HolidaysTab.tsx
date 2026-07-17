'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Modal, FormField, Input, Select, useToast } from '@unerp/ui';
import { Plus, Calendar, Globe } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './HolidaysTab.module.css';

interface Holiday {
  id: string;
  name: string;
  date: string;
  region: string;
}

export default function HolidaysTab() {
  const client = useApiClient();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', region: 'GLOBAL' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await client.get<Holiday[] | { data?: Holiday[] }>('/advanced-hr/holidays');
      setHolidays(Array.isArray(data) ? data : (data.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/advanced-hr/holidays', form);
      toast.success('Holiday added successfully.');
      setShowForm(false);
      setForm({ name: '', date: '', region: 'GLOBAL' });
      fetchData();
    } catch {}
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setShowForm(true)} className="ui-flex ui-items-center ui-gap-1">
          <Plus size={14} /> Add Public Holiday
        </Button>
      </div>

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none">
          <table className={styles.s0}>
            <thead>
              <tr className={styles.s1}>
                <th className="p-4">Holiday Name</th>
                <th className="p-4">Date</th>
                <th className={styles.s2}>Region Scope</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.s3}>
                    No public holidays registered. Set holidays to exclude them from leave calculations.
                  </td>
                </tr>
              ) : (
                holidays.map(h => (
                  <tr key={h.id} className="border-b">
                    <td className={styles.s4}>{h.name}</td>
                    <td className="p-4">
                      <div className={styles.s5}>
                        <Calendar size={14} className="text-muted-foreground" />
                        {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </td>
                    <td className={styles.s6}>
                      <div className={styles.s7}>
                        <Globe size={12} className="text-muted-foreground" />
                        {h.region}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Public Holiday"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateHoliday as any}>Save Holiday</Button></>}
      >
        <form onSubmit={handleCreateHoliday} className="ui-stack-3">
          <FormField label="Holiday Name" required>
            <Input placeholder="e.g. New Year's Day" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Date" required>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Region" required>
            <Select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} required>
              <option value="GLOBAL">Global</option>
              <option value="US">United States (US)</option>
              <option value="CA">Canada (CA)</option>
              <option value="IN">India (IN)</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

