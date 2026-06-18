'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Calendar, DollarSign, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  isCompleted: boolean;
}

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  tasks: Task[];
  milestones: Milestone[];
}

export default function ClientPortalPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (res.ok) {
        const data = await res.json();
      setProjects(Array.isArray(data) ? data : (data?.data || []));
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
          fetchProjectDetails(data[0].id);
        }
      }
    } catch {
      // Ignored
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
        setSelectedProject(await res.json());
      }
    } catch {
      // Ignored
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProjectId(id);
    if (id) {
      fetchProjectDetails(id);
    } else {
      setSelectedProject(null);
    }
  };

  // Compute stats
  const completedTasks = selectedProject?.tasks?.filter(t => t.status === 'DONE').length || 0;
  const totalTasks = selectedProject?.tasks?.length || 0;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Eye size={28} style={{ color: 'var(--color-primary)' }} />
          Stakeholder Client Portal
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          External client view-only portal for project status tracking, deliverables verification, and milestones compliance
        </p>
      </div>

      {/* Selector */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
          Select Active Project:
        </span>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          style={{
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            minWidth: '250px',
            fontSize: 'var(--text-sm)',
          }}
        >
          {loading ? (
            <option>Loading active projects...</option>
          ) : (
            projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Main Grid Details */}
      {selectedProject ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-6)' }}>
          
          {/* Deliverables Checklist & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Progress Section */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Execution Progress</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, height: '14px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${percentComplete}%`, height: '100%', background: 'var(--color-success)', borderRadius: 'var(--radius-full)' }} />
                </div>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-success)' }}>
                  {percentComplete}% Complete
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>COMPLETED TASKS</p>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{completedTasks} / {totalTasks}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>PROJECT STATUS</p>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{selectedProject.status}</p>
                </div>
              </div>
            </div>

            {/* Tasks list */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>Project Tasks & Deliverables</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                  selectedProject.tasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{t.name}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{t.description || 'No description provided.'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: t.status === 'DONE' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {t.status}
                        </span>
                        {t.status === 'DONE' ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>No tasks defined.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Budget, Deadlines, Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Meta Cards */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Project Info</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>TIMELINE</p>
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                    {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'} - {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>BUDGET</p>
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                    {selectedProject.budget ? `$${Number(selectedProject.budget).toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Milestones Card */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Milestones Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                  selectedProject.milestones.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Award size={16} style={{ color: m.isCompleted ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', textDecoration: m.isCompleted ? 'line-through' : 'none', color: m.isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text)' }}>
                          {m.name}
                        </p>
                        <p style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: m.isCompleted ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {m.isCompleted ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No milestones set.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>No active project available to show client view.</div>
      )}
    </div>
  );
}
