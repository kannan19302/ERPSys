'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, Calendar, DollarSign, Activity, ShieldAlert, AlertCircle, Plus, FileText } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  baselineSchedule: string | null;
  tasks?: Task[];
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface EVMMetrics {
  plannedValue: number;
  actualCost: number;
  earnedValue: number;
  scheduleVariance: number;
  costVariance: number;
  cpi: number;
  spi: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  predictiveEndDate: string | null;
}

interface ProjectRisk {
  id: string;
  title: string;
  description: string | null;
  probability: string;
  impact: string;
  mitigationPlan: string | null;
  status: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  requestedAmount: number;
  requestedScheduleDays: number;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab & sub-feature states
  const [activeTab, setActiveTab] = useState<'tasks' | 'evm' | 'risks' | 'changes'>('tasks');
  const [criticalPathIds, setCriticalPathIds] = useState<string[]>([]);
  const [projectHealth, setProjectHealth] = useState<string>('HEALTHY');
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  // New Project Form State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
  });

  // New Task Form State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  // Log Time Form State
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timeLog, setTimeLog] = useState({
    hours: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  // New Risk Form State
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    mitigationPlan: '',
  });

  // New Change Request Form State
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [newChange, setNewChange] = useState({
    title: '',
    description: '',
    requestedAmount: '',
    requestedScheduleDays: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : (data?.data || []));
      if (data.length > 0 && !selectedProject) {
        fetchProjectDetails(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
        if (data.criticalPath) {
          try {
            setCriticalPathIds(JSON.parse(data.criticalPath));
          } catch {
            setCriticalPathIds([]);
          }
        } else {
          setCriticalPathIds([]);
        }
        setProjectHealth(data.overallHealth || 'HEALTHY');
        
        // Fetch EVM, Risks, Changes
        fetchEVMData(projectId);
        fetchRisksData(projectId);
        fetchChangesData(projectId);
      }
    } catch {
      // Ignored
    }
  };

  const fetchEVMData = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${projectId}/evm`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEvmMetrics(await res.json());
      }
    } catch {}
  };

  const fetchRisksData = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${projectId}/risks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        (async () => { const _d = await res.json(); setRisks(Array.isArray(_d) ? _d : (_d?.data || [])); })();
      }
    } catch {}
  };

  const fetchChangesData = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${projectId}/change-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        (async () => { const _d = await res.json(); setChangeRequests(Array.isArray(_d) ? _d : (_d?.data || [])); })();
      }
    } catch {}
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/critical-path`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCriticalPathIds(data.criticalPathTaskIds || []);
        setProjectHealth(data.overallHealth || 'HEALTHY');
        alert(`Critical path calculated! Status is ${data.overallHealth}. ${data.criticalPathTaskIds.length} tasks on critical path.`);
        fetchProjectDetails(selectedProject.id);
      }
    } catch {
      alert('Error calculating critical path');
    }
  };

  const handleSaveBaseline = async () => {
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const baseline = JSON.stringify(selectedProject.tasks?.map(t => ({ taskId: t.id, dueDate: t.dueDate })));
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/baseline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ baselineSchedule: baseline }),
      });
      if (res.ok) {
        alert('Baseline schedule captured successfully!');
        fetchProjectDetails(selectedProject.id);
      } else {
        alert('Failed to save baseline schedule.');
      }
    } catch {
      alert('Error saving baseline schedule');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProject,
          budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create project');
      }

      setIsNewProjectModalOpen(false);
      setNewProject({ name: '', code: '', description: '', budget: '', startDate: '', endDate: '' });
      fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) throw new Error('Failed to create task');

      setIsNewTaskModalOpen(false);
      setNewTask({ name: '', description: '', priority: 'MEDIUM', dueDate: '' });
      fetchProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const empRes = await fetch('http://localhost:3001/api/v1/hr/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employees = await empRes.json();
      const employeeId = employees[0]?.id;

      if (!employeeId) throw new Error('No employee record found to log time against.');

      const res = await fetch(`http://localhost:3001/api/v1/projects/tasks/${selectedTaskId}/timesheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId,
          date: timeLog.date,
          hours: parseFloat(timeLog.hours),
          notes: timeLog.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to log timesheet');

      setIsLogTimeModalOpen(false);
      setTimeLog({ hours: '', notes: '', date: new Date().toISOString().split('T')[0] });
      if (selectedProject) fetchProjectDetails(selectedProject.id);
      alert('Time logged successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log time');
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/risks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRisk),
      });
      if (res.ok) {
        setIsRiskModalOpen(false);
        setNewRisk({ title: '', description: '', probability: 'MEDIUM', impact: 'MEDIUM', mitigationPlan: '' });
        fetchRisksData(selectedProject.id);
        alert('Risk logged successfully!');
      }
    } catch {
      alert('Failed to log risk');
    }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/change-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newChange.title,
          description: newChange.description,
          requestedAmount: parseFloat(newChange.requestedAmount),
          requestedScheduleDays: parseInt(newChange.requestedScheduleDays),
        }),
      });
      if (res.ok) {
        setIsChangeModalOpen(false);
        setNewChange({ title: '', description: '', requestedAmount: '', requestedScheduleDays: '' });
        fetchChangesData(selectedProject.id);
        alert('Change request submitted!');
      }
    } catch {
      alert('Failed to submit change request');
    }
  };

  const handleApproveChangeRequest = async (changeRequestId: string) => {
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/change-requests/${changeRequestId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProjectDetails(selectedProject.id);
        alert('Change request approved! Project budget and schedule adjusted.');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to approve');
      }
    } catch {
      alert('Error approving change request');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedProject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/projects/${selectedProject.id}/invoice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const inv = await res.json();
        alert(`Invoice generated successfully! Invoice Number: ${inv.invoiceNumber}, Total Amount: $${Number(inv.totalAmount).toLocaleString()}`);
        fetchEVMData(selectedProject.id);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate invoice');
      }
    } catch {
      alert('Error generating invoice');
    }
  };

  // Parse baseline dates
  let baselineMap: Record<string, string> = {};
  if (selectedProject?.baselineSchedule) {
    try {
      const parsed = JSON.parse(selectedProject.baselineSchedule);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: { taskId?: string; dueDate?: string }) => {
          if (item.taskId && item.dueDate) {
            baselineMap[item.taskId] = item.dueDate;
          }
        });
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {loading && <div style={{ color: 'var(--color-text-secondary)' }}>Loading projects...</div>}
      {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Briefcase size={28} style={{ color: 'var(--color-primary)' }} />
            Project Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Orchestrate deliverables, track timelines, and log employee hours
          </p>
        </div>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-2.5) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          New Project
        </button>
      </div>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)' }}>
        {/* Project Selector Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Projects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => fetchProjectDetails(proj.id)}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-4)',
                    background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>{proj.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    <span>{proj.code}</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: proj.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg-hover)',
                      color: proj.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      fontWeight: 'var(--weight-bold)',
                    }}>{proj.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Details Right Panel */}
        {selectedProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
            {/* Project Header Metrics */}
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{selectedProject.name} ({selectedProject.code})</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>{selectedProject.description || 'No description provided.'}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                    background: projectHealth === 'HEALTHY' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                    color: projectHealth === 'HEALTHY' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    Health: {projectHealth}
                  </span>
                  <button 
                    onClick={handleSaveBaseline}
                    style={{
                      background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                      padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                    }}
                  >
                    Save Baseline
                  </button>
                  <button 
                    onClick={handleCalculateCriticalPath}
                    style={{
                      background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)',
                      padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                    }}
                  >
                    Calculate CPM
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>DATES</p>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                      {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'} - {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <DollarSign size={16} style={{ color: 'var(--color-success)' }} />
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>BUDGET</p>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                      {selectedProject.budget ? `$${Number(selectedProject.budget).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Activity size={16} style={{ color: 'var(--color-info)' }} />
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>STATUS</p>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{selectedProject.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: '2px' }}>
              <button onClick={() => setActiveTab('tasks')} style={{ background: 'none', border: 'none', color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'tasks' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Tasks Checklist</button>
              <button onClick={() => setActiveTab('evm')} style={{ background: 'none', border: 'none', color: activeTab === 'evm' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'evm' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>EVM & Billing</button>
              <button onClick={() => setActiveTab('risks')} style={{ background: 'none', border: 'none', color: activeTab === 'risks' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'risks' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Risk Register</button>
              <button onClick={() => setActiveTab('changes')} style={{ background: 'none', border: 'none', color: activeTab === 'changes' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'changes' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Change Control</button>
            </div>

            {/* TAB 1: TASKS CHECKLIST */}
            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Project Tasks</h3>
                  <button onClick={() => setIsNewTaskModalOpen(true)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer' }}>Add Task</button>
                </div>

                {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
                    {selectedProject.tasks.map((task) => {
                      const isCritical = criticalPathIds.includes(task.id);
                      const baselineDateStr = baselineMap[task.id];
                      let delayDays = 0;
                      if (baselineDateStr && task.dueDate) {
                        const diff = new Date(task.dueDate).getTime() - new Date(baselineDateStr).getTime();
                        delayDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      }
                      
                      return (
                        <div key={task.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)',
                          background: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg)',
                          border: isCritical ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-xl)'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', margin: 0 }}>{task.name}</p>
                              {isCritical && (
                                <span style={{ fontSize: '9px', background: 'var(--color-danger)', color: 'white', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                                  CRITICAL PATH
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{task.description || 'No description.'}</p>
                            
                            {/* Baseline comparison */}
                            {baselineDateStr && (
                              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px' }}>
                                <span style={{ color: 'var(--color-text-tertiary)' }}>Baseline: {new Date(baselineDateStr).toLocaleDateString()}</span>
                                <span style={{ color: 'var(--color-text-tertiary)' }}>Live: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                                {delayDays > 0 && (
                                  <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <AlertCircle size={12} /> Delayed by {delayDays} days!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <span style={{
                              fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                              background: task.priority === 'HIGH' || task.priority === 'URGENT' ? 'var(--color-danger-light)' : 'var(--color-bg-hover)',
                              color: task.priority === 'HIGH' || task.priority === 'URGENT' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                              fontWeight: 'var(--weight-bold)',
                            }}>{task.priority}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                              Status: <strong>{task.status}</strong>
                            </span>
                            {task.status !== 'DONE' && (
                              <button
                                onClick={() => {
                                  setSelectedTaskId(task.id);
                                  setIsLogTimeModalOpen(true);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-primary)', color: 'white',
                                  border: 'none', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                                  fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
                                }}
                              >
                                <Clock size={12} /> Log Time
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                    No tasks defined.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EVM & BILLING */}
            {activeTab === 'evm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Earned Value Performance (EVM)</h3>
                  <button onClick={handleGenerateInvoice} style={{ background: 'var(--color-success)', color: 'white', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> One-Click Auto-Bill Invoice
                  </button>
                </div>

                {evmMetrics ? (
                  <>
                    {/* Gauges */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>COST PERFORMANCE (CPI)</span>
                        <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: evmMetrics.cpi >= 1.0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{evmMetrics.cpi.toFixed(2)}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{evmMetrics.cpi >= 1.0 ? 'Under Budget' : 'Over Budget'}</span>
                      </div>
                      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>SCHEDULE INDEX (SPI)</span>
                        <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: evmMetrics.spi >= 1.0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{evmMetrics.spi.toFixed(2)}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{evmMetrics.spi >= 1.0 ? 'Ahead of Schedule' : 'Behind Schedule'}</span>
                      </div>
                      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>COST VARIANCE (CV)</span>
                        <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: evmMetrics.costVariance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>${Number(evmMetrics.costVariance).toLocaleString()}</span>
                      </div>
                      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>SCHEDULE VARIANCE (SV)</span>
                        <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: evmMetrics.scheduleVariance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>${Number(evmMetrics.scheduleVariance).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Detailed rollups */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-tertiary)' }}>VALUE AGGREGATIONS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Planned Value (PV):</span>
                          <strong>${Number(evmMetrics.plannedValue).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Earned Value (EV):</span>
                          <strong>${Number(evmMetrics.earnedValue).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Actual Cost (AC):</span>
                          <strong>${Number(evmMetrics.actualCost).toLocaleString()}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-tertiary)' }}>FORECASTS & PREDICTIONS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Estimate at Completion (EAC):</span>
                          <strong>${Number(evmMetrics.estimateAtCompletion).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Estimate to Complete (ETC):</span>
                          <strong>${Number(evmMetrics.estimateToComplete).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span>Predictive End Date:</span>
                          <strong>{evmMetrics.predictiveEndDate ? new Date(evmMetrics.predictiveEndDate).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Calculating EVM values...</p>
                )}
              </div>
            )}

            {/* TAB 3: RISK REGISTER */}
            {activeTab === 'risks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Project Risks & Mitigations</h3>
                  <button onClick={() => setIsRiskModalOpen(true)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer' }}>Log Risk Item</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {risks.length > 0 ? (
                    risks.map((risk) => (
                      <div key={risk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 'var(--space-4)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                        <div>
                          <h4 style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
                            {risk.title}
                          </h4>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{risk.description || 'No description provided.'}</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: '4px', fontWeight: 'bold' }}>Mitigation Plan: {risk.mitigationPlan || 'None specified.'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', background: risk.probability === 'HIGH' ? 'var(--color-danger-light)' : 'var(--color-bg-hover)', color: risk.probability === 'HIGH' ? 'var(--color-danger)' : 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: '10px' }}>Prob: {risk.probability}</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', background: risk.impact === 'HIGH' ? 'var(--color-danger-light)' : 'var(--color-bg-hover)', color: risk.impact === 'HIGH' ? 'var(--color-danger)' : 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: '10px' }}>Impact: {risk.impact}</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', background: risk.status === 'OPEN' ? 'var(--color-warning-light)' : 'var(--color-success-light)', color: risk.status === 'OPEN' ? 'var(--color-warning)' : 'var(--color-success)', borderRadius: '10px' }}>{risk.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>No risk items logged.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CHANGE CONTROL */}
            {activeTab === 'changes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Change Request Tracking Logs</h3>
                  <button onClick={() => setIsChangeModalOpen(true)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer' }}>Submit Change Request</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {changeRequests.length > 0 ? (
                    changeRequests.map((cr) => (
                      <div key={cr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                        <div>
                          <h4 style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{cr.title}</h4>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{cr.description}</p>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                            <span>Budget Adjustment: <strong>+${Number(cr.requestedAmount).toLocaleString()}</strong></span>
                            <span>Timeline Adjustment: <strong>+{cr.requestedScheduleDays} days</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', background: cr.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: cr.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '10px' }}>{cr.status}</span>
                          {cr.status === 'PENDING' && (
                            <button onClick={() => handleApproveChangeRequest(cr.id)} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Approve Changes</button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>No change requests filed.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', minHeight: '300px' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Select or create a project to get started.</p>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateProject} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '480px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create New Project</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Project Name</label>
                <input required type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Project Code</label>
                <input required type="text" placeholder="e.g. PRJ-001" value={newProject.code} onChange={(e) => setNewProject({ ...newProject, code: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '80px', resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input type="date" value={newProject.startDate} onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>End Date</label>
                <input type="date" value={newProject.endDate} onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Budget</label>
              <input type="number" placeholder="Budget allocation" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsNewProjectModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save Project</button>
            </div>
          </form>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateTask} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Add Task</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Task Name</label>
              <input required type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '60px', resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Priority</label>
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Due Date</label>
                <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsNewTaskModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Add Task</button>
            </div>
          </form>
        </div>
      )}

      {/* Log Time Modal */}
      {isLogTimeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleLogTime} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '380px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Log Time / Timesheet</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Hours worked</label>
                <input required type="number" step="0.5" placeholder="e.g. 8" value={timeLog.hours} onChange={(e) => setTimeLog({ ...timeLog, hours: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Date</label>
                <input required type="date" value={timeLog.date} onChange={(e) => setTimeLog({ ...timeLog, date: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Work Notes</label>
              <textarea placeholder="Specify what you completed..." value={timeLog.notes} onChange={(e) => setTimeLog({ ...timeLog, notes: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '60px', resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsLogTimeModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Log Time</button>
            </div>
          </form>
        </div>
      )}

      {/* Log Risk Modal */}
      {isRiskModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateRisk} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
              Log Project Risk
            </h3>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Risk Title</label>
              <input required type="text" value={newRisk.title} onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Risk Description</label>
              <textarea value={newRisk.description} onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '60px', resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Probability</label>
                <select value={newRisk.probability} onChange={(e) => setNewRisk({ ...newRisk, probability: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Impact</label>
                <select value={newRisk.impact} onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Mitigation Plan</label>
              <textarea value={newRisk.mitigationPlan} onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '50px', resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsRiskModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Log Risk</button>
            </div>
          </form>
        </div>
      )}

      {/* Change Request Modal */}
      {isChangeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateChangeRequest} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--color-primary)' }} />
              Submit Change Request
            </h3>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Change Scope Title</label>
              <input required type="text" value={newChange.title} onChange={(e) => setNewChange({ ...newChange, title: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Justification / Details</label>
              <textarea value={newChange.description} onChange={(e) => setNewChange({ ...newChange, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '60px', resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Requested Budget ($)</label>
                <input required type="number" placeholder="e.g. 5000" value={newChange.requestedAmount} onChange={(e) => setNewChange({ ...newChange, requestedAmount: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Schedule Impact (Days)</label>
                <input required type="number" placeholder="e.g. 10" value={newChange.requestedScheduleDays} onChange={(e) => setNewChange({ ...newChange, requestedScheduleDays: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsChangeModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Submit Request</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
