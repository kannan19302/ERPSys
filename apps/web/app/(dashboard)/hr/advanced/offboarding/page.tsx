'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { UserMinus, Plus, Calendar, CheckCircle, Circle, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface OffboardingItem {
  id: string;
  task: string;
  isCompleted: boolean;
  sortOrder: number;
  status?: string;
  comments?: string | null;
}

interface OffboardingChecklist {
  id: string;
  employeeId: string;
  exitDate: string;
  exitReason: string | null;
  items: OffboardingItem[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function OffboardingPage() {
  const client = useApiClient();
  const [checklists, setChecklists] = useState<OffboardingChecklist[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [exitReason, setExitReason] = useState('Career Advancement');
  const [tasksText, setTasksText] = useState("Revoke system login access\nCollect laptop & security badge\nProcess final paycheck calculation\nPerform exit feedback interview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chkRes, empRes] = await Promise.all([
        client.get<OffboardingChecklist[]>('/api/v1/advanced-hr/offboarding/checklists'),
        client.get<Employee[]>('/api/v1/hr/employees'),
      ]);
      setChecklists(chkRes); setEmployees(empRes);
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
        sortOrder: idx + 1
      }));

    try {
      await client.post('/api/v1/advanced-hr/offboarding/checklists', { employeeId, exitDate, exitReason, items: parsedItems });
      {
        setMsg('Offboarding checklist scheduled successfully.');
        setShowForm(false);
        setEmployeeId('');
        setExitDate('');
        setTasksText("Revoke system login access\nCollect laptop & security badge\nProcess final paycheck calculation\nPerform exit feedback interview");
        fetchData();
      }
    } catch {
      setMsg('Error assigning offboarding checklists.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: { task?: string; status?: string; comments?: string }) => {
    try {
      await client.request(`/api/v1/advanced-hr/offboarding/items/${itemId}`, { method: 'PUT', body: JSON.stringify(updates) });
      {
        setEditingItemId(null);
        fetchData();
      }
    } catch {}
  };

  const handleAddItem = async (checklistId: string, task: string) => {
    if (!task.trim()) return;
    try {
      await client.post(`/api/v1/advanced-hr/offboarding/checklists/${checklistId}/items`, { task });
      {
        setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }));
        fetchData();
      }
    } catch {}
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await client.delete(`/api/v1/advanced-hr/offboarding/items/${itemId}`);
      fetchData();
    } catch {}
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <RouteGuard permission="hr.offboarding.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Offboarding Checklists"
        description="Oversee exit checklists, clear company assets, and record resignation feedback."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Offboarding' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Schedule Offboarding
          </Button>
        }
      />

      {msg && (
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 className={styles.s1}>Schedule Exit Process for Employee</h4>
          <form onSubmit={createChecklist} className="ui-stack-3">
            <select
              className="ui-input"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Exit Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={exitDate}
                  onChange={e => setExitDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Resignation/Exit Reason</label>
                <select
                  className="ui-input"
                  value={exitReason}
                  onChange={e => setExitReason(e.target.value)}
                >
                  <option value="Career Advancement">Career Advancement</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Contract Termination">Contract Termination</option>
                  <option value="Involuntary Termination">Involuntary Termination</option>
                </select>
              </div>
            </div>
            <div>
              <label className="ui-text-caption">Exit Clearance Procedures (one per line)</label>
              <textarea
                className="ui-input"
                value={tasksText}
                onChange={e => setTasksText(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Schedule Exit</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.auto0}>
          {checklists.length === 0 ? (
            <div className={styles.s2}>
              <Card>
                <div className={styles.s3}>
                  <UserMinus size={32} className={styles.s4} />
                  <p className="m-0">No active exit procedures cataloged.</p>
                </div>
              </Card>
            </div>
          ) : (
            checklists.map(list => (
              <Card key={list.id} padding="md">
                <div className={styles.s5}>
                  <div>
                    <h4 className="m-0">{getEmpName(list.employeeId)}</h4>
                    <span className={styles.s6}>Reason: {list.exitReason || 'N/A'}</span>
                  </div>
                  <StatusBadge status="EXITING" />
                </div>
                
                <div className={styles.s7}>
                  <Calendar size={12} /> Last Date: {new Date(list.exitDate).toLocaleDateString()}
                </div>

                <div className={styles.s8}>
                  {list.items.map(item => {
                    const itemStatus = item.status || (item.isCompleted ? 'COMPLETED' : 'PENDING');
                    const isEditing = editingItemId === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        className={styles.dyn0} style={{ background: itemStatus === 'ONHOLD' ? 'var(--color-warning-light)' : 'transparent' }}
                      >
                        <div className={styles.s9}>
                          {/* Checkbox Icon */}
                          <div 
                            onClick={() => {
                              if (itemStatus !== 'COMPLETED') {
                                handleUpdateItem(item.id, { status: 'COMPLETED' });
                              } else {
                                handleUpdateItem(item.id, { status: 'PENDING' });
                              }
                            }}
                            className={styles.s10}
                          >
                            {itemStatus === 'COMPLETED' ? (
                              <CheckCircle size={16} className="text-success ui-text-success" />
                            ) : itemStatus === 'ONHOLD' ? (
                              <AlertCircle size={16} className={styles.s11} />
                            ) : (
                              <Circle size={16} className="text-muted-foreground" />
                            )}
                          </div>

                          {/* Task editing vs text */}
                          {isEditing ? (
                            <div className={styles.s12}>
                              <input
                                type="text"
                                className={`ui-input ${styles.s13}`}
                                value={editTaskText}
                                onChange={e => setEditTaskText(e.target.value)}
                                autoFocus
                              />
                              <Button
                                variant="primary"
                                className={styles.s14}
                                onClick={() => handleUpdateItem(item.id, { task: editTaskText })}
                              >
                                <Save size={12} />
                              </Button>
                              <Button
                                variant="outline"
                                className={styles.s15}
                                onClick={() => setEditingItemId(null)}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className={styles.dyn1} style={{ textDecoration: itemStatus === 'COMPLETED' ? 'line-through' : 'none', color: itemStatus === 'COMPLETED' ? 'var(--color-text-tertiary)' : 'var(--color-text)' }}>
                                {item.task}
                              </span>

                              {/* Status Dropdown Selector */}
                              <select
                                className={`ui-input ${styles.s16}`}
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
                                className={styles.s17}
                                title="Edit Task"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className={styles.s18}
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Comments text field for comments/reason */}
                        {!isEditing && (
                          <div className={styles.s19}>
                            <input
                              type="text"
                              placeholder={itemStatus === 'ONHOLD' ? "Reason for Hold..." : "Add comments / efforts log..."}
                              className={`ui-input ${styles.dyn2}`} style={{ background: itemStatus === 'ONHOLD' ? 'rgba(255,255,255,0.7)' : 'var(--color-bg-sunken)' }}
                              defaultValue={item.comments || ''}
                              onBlur={e => handleUpdateItem(item.id, { comments: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Inline Add Item Form */}
                  <div className={styles.s20}>
                    <input
                      type="text"
                      placeholder="Add exit task inline..."
                      className={`ui-input ${styles.s21}`}
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
                      className={styles.s22}
                      onClick={() => handleAddItem(list.id, newItemTexts[list.id] || '')}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}




