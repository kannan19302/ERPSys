'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { Star, Plus, Check } from 'lucide-react';

interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillName: string;
  proficiency: number;
  category: string;
  certified: boolean;
  certificationUrl: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState({ employeeId: '', skillName: '', proficiency: '3', category: 'TECHNICAL', certified: false });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/skills', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (skillsRes.ok) setSkills(await skillsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          proficiency: parseInt(form.proficiency),
          certified: form.certified
        })
      });
      if (res.ok) {
        setMsg('Skill logged successfully.');
        setShowForm(false);
        setForm({ employeeId: '', skillName: '', proficiency: '3', category: 'TECHNICAL', certified: false });
        fetchData();
      }
    } catch {
      setMsg('Error logging skill.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Skills Matrix"
        description="Verify corporate talent capability, log employee functional proficiencies, and index certified credentials."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Skills' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Log Skill Set
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Record Employee Skill Proficiency</h4>
          <form onSubmit={addSkill} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <input
                className="frappe-input"
                placeholder="Skill name (e.g. Next.js, Financial Auditing)"
                value={form.skillName}
                onChange={e => setForm({ ...form, skillName: e.target.value })}
                required
              />
              <select
                className="frappe-input"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="TECHNICAL">Technical</option>
                <option value="FUNCTIONAL">Functional</option>
                <option value="SOFT_SKILL">Soft Skill</option>
                <option value="MANAGEMENT">Management</option>
              </select>
              <select
                className="frappe-input"
                value={form.proficiency}
                onChange={e => setForm({ ...form, proficiency: e.target.value })}
              >
                <option value="5">5 - Expert</option>
                <option value="4">4 - Advanced</option>
                <option value="3">3 - Intermediate</option>
                <option value="2">2 - Novice</option>
                <option value="1">1 - Fundamental</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <input
                type="checkbox"
                id="certified"
                checked={form.certified}
                onChange={e => setForm({ ...form, certified: e.target.checked })}
              />
              <label htmlFor="certified" style={{ fontSize: '13px', userSelect: 'none' }}>This skill is officially certified</label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Log Skill</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Employee</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Skill Name</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Category</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Proficiency Rating</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Certified</th>
              </tr>
            </thead>
            <tbody>
              {skills.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <Star size={24} style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0 }}>No skills matrix recorded in logs.</p>
                  </td>
                </tr>
              ) : (
                skills.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{getEmpName(s.employeeId)}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{s.skillName}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{s.category}</td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {s.proficiency} / 5
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      {s.certified ? (
                        <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                          <Check size={14} /> Certified
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
