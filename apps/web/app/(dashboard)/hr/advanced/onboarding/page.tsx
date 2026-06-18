'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { UserPlus, Plus, CheckCircle, Circle, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

interface OnboardingItem {
  id: string;
  task: string;
  category: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
  status?: string;
  comments?: string | null;
}

interface OnboardingChecklist {
  id: string;
  employeeId: string;
  templateName: string;
  items: OnboardingItem[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function OnboardingPage() {
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  
  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [templateName, setTemplateName] = useState('Standard IT & HR Onboarding');
  const [tasksText, setTasksText] = useState("Setup laptop workstation\nSign NDA & policies agreement\nHR benefits configuration intro\nIT system credentials access");

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chkRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/onboarding/checklists', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (chkRes.ok) setChecklists(await chkRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const parsedItems = tasksText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map((t, idx) => ({
        task: t,
        category: 'GENERAL',
        sortOrder: idx + 1
      }));

    try {
      const res = await fetch('/api/v1/advanced-hr/onboarding/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ employeeId, templateName, items: parsedItems })
      });
      if (res.ok) {
        setMsg('Onboarding checklist assigned.');
        setShowForm(false);
        setEmployeeId('');
        setTasksText("Setup laptop workstation\nSign NDA & policies agreement\nHR benefits configuration intro\nIT system credentials access");
        fetchData();
      }
    } catch {
      setMsg('Error saving checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: { task?: string; category?: string; status?: string; comments?: string }) => {
    try {
      const res = await fetch(`/api/v1/advanced-hr/onboarding/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setEditingItemId(null);
        fetchData();
      }
    } catch {}
  };

  const handleAddItem = async (checklistId: string, task: string) => {
    if (!task.trim()) return;
    try {
      const res = await fetch(`/api/v1/advanced-hr/onboarding/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ task, category: 'GENERAL' })
      });
      if (res.ok) {
        setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }));
        fetchData();
      }
    } catch {}
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/v1/advanced-hr/onboarding/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Onboarding Checklists"
        description="Verify and checklist steps required to successfully get new team members integrated into departments."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Onboarding' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Assign Checklist
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
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Assign Onboarding Checklist to Employee</h4>
          <form onSubmit={createChecklist} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <input
              className="frappe-input"
              placeholder="Template Name (e.g. Engineering Onboarding)"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              required
            />
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Checklist Tasks (one per line)</label>
              <textarea
                className="frappe-input"
                value={tasksText}
                onChange={e => setTasksText(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Assign Checklist</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
          {checklists.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <UserPlus size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No onboarding checklists assigned yet.</p>
                </div>
              </Card>
            </div>
          ) : (
            checklists.map(list => {
              const completedCount = list.items.filter(i => i.isCompleted).length;
              const totalCount = list.items.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <Card key={list.id} padding="md">
                  <h4 style={{ margin: 0 }}>{getEmpName(list.employeeId)}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{list.templateName}</span>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', margin: '12px 0 4px' }}>
                    <span>Progress</span>
                    <span>{completedCount} / {totalCount} ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: '3px', marginBottom: '16px' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    {list.items.map(item => {
                      const itemStatus = item.status || (item.isCompleted ? 'COMPLETED' : 'PENDING');
                      const isEditing = editingItemId === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            background: itemStatus === 'ONHOLD' ? 'var(--color-warning-light)' : 'transparent',
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Checkbox Icon */}
                            <div 
                              onClick={() => {
                                if (itemStatus !== 'COMPLETED') {
                                  handleUpdateItem(item.id, { status: 'COMPLETED' });
                                } else {
                                  handleUpdateItem(item.id, { status: 'PENDING' });
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {itemStatus === 'COMPLETED' ? (
                                <CheckCircle size={16} className="text-success" style={{ color: 'var(--color-success)' }} />
                              ) : itemStatus === 'ONHOLD' ? (
                                <AlertCircle size={16} style={{ color: 'var(--color-warning-text)' }} />
                              ) : (
                                <Circle size={16} className="text-muted-foreground" />
                              )}
                            </div>

                            {/* Task editing vs text */}
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                <input
                                  type="text"
                                  className="frappe-input"
                                  style={{ flex: 1, padding: '2px 6px', fontSize: '12px' }}
                                  value={editTaskText}
                                  onChange={e => setEditTaskText(e.target.value)}
                                  autoFocus
                                />
                                <Button
                                  variant="primary"
                                  style={{ padding: '2px 8px', height: 'auto', fontSize: '11px' }}
                                  onClick={() => handleUpdateItem(item.id, { task: editTaskText })}
                                >
                                  <Save size={12} />
                                </Button>
                                <Button
                                  variant="outline"
                                  style={{ padding: '2px 8px', height: 'auto', fontSize: '11px' }}
                                  onClick={() => setEditingItemId(null)}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span style={{ 
                                  fontSize: '13px', 
                                  flex: 1,
                                  textDecoration: itemStatus === 'COMPLETED' ? 'line-through' : 'none',
                                  color: itemStatus === 'COMPLETED' ? 'var(--color-text-tertiary)' : 'var(--color-text)'
                                }}>
                                  {item.task}
                                </span>

                                {/* Status Dropdown Selector */}
                                <select
                                  className="frappe-input"
                                  style={{ fontSize: '11px', padding: '2px 4px', width: '85px', height: '24px', background: 'var(--color-bg)' }}
                                  value={itemStatus}
                                  onChange={e => handleUpdateItem(item.id, { status: e.target.value })}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="ONHOLD">On Hold</option>
                                  <option value="COMPLETED">Completed</option>
                                </select>

                                {/* Action Buttons */}
                                <button
                                  onClick={() => { setEditingItemId(item.id); setEditTaskText(item.task); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-secondary)' }}
                                  title="Edit Task"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-danger)' }}
                                  title="Delete Task"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Comments text field for comments/reason */}
                          {!isEditing && (
                            <div style={{ paddingLeft: '24px', marginTop: '2px' }}>
                              <input
                                type="text"
                                placeholder={itemStatus === 'ONHOLD' ? "Reason for Hold..." : "Add comments / efforts log..."}
                                className="frappe-input"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  width: '100%',
                                  height: '24px',
                                  background: itemStatus === 'ONHOLD' ? 'rgba(255,255,255,0.7)' : 'var(--color-bg-sunken)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                                defaultValue={item.comments || ''}
                                onBlur={e => handleUpdateItem(item.id, { comments: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline Add Item Form */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px dashed var(--color-border)', paddingTop: '12px' }}>
                      <input
                        type="text"
                        placeholder="Add new task inline..."
                        className="frappe-input"
                        style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                        value={newItemTexts[list.id] || ''}
                        onChange={e => setNewItemTexts({ ...newItemTexts, [list.id]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddItem(list.id, newItemTexts[list.id] || '');
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        style={{ padding: '4px 10px', height: 'auto', fontSize: '11px' }}
                        onClick={() => handleAddItem(list.id, newItemTexts[list.id] || '')}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
