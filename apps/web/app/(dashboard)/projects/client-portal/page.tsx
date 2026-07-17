'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Eye, Calendar, DollarSign, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [client]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await client.get<Project[] | { data?: Project[] }>('/projects');
      const projectList = Array.isArray(data) ? data : (data.data || []);
      setProjects(projectList);
      const initialProject = projectList[0];
      if (initialProject) {
        setSelectedProjectId(initialProject.id);
        void fetchProjectDetails(initialProject.id);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      setSelectedProject(await client.get<Project>(`/projects/${projectId}`));
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
    <div className="ui-stack-6">
      {/* Header */}
      <div>
        <h1 className={styles.p1}>
          <Eye size={28} className="ui-text-primary" />
          Stakeholder Client Portal
        </h1>
        <p className={styles.p2}>
          External client view-only portal for project status tracking, deliverables verification, and milestones compliance
        </p>
      </div>

      {/* Selector */}
      <div className={styles.p3}>
        <span className={styles.p4}>
          Select Active Project:
        </span>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          className={styles.p5}
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
        <div className={styles.p6}>
          
          {/* Deliverables Checklist & Timeline */}
          <div className="ui-stack-6">
            
            {/* Progress Section */}
            <div className={styles.p7}>
              <h3 className={styles.p8}>Execution Progress</h3>
              <div className="ui-hstack-4">
                <div className={styles.p9}>
                  <div style={{ width: `${percentComplete}%` }} className={styles.s1} />
                </div>
                <span className={styles.p10}>
                  {percentComplete}% Complete
                </span>
              </div>
              <div className={styles.p11}>
                <div>
                  <p className="ui-text-caption ui-text-tertiary">COMPLETED TASKS</p>
                  <p className={styles.p12}>{completedTasks} / {totalTasks}</p>
                </div>
                <div>
                  <p className="ui-text-caption ui-text-tertiary">PROJECT STATUS</p>
                  <p className={styles.p13}>{selectedProject.status}</p>
                </div>
              </div>
            </div>

            {/* Tasks list */}
            <div className={styles.p14}>
              <h3 className={styles.p15}>Project Tasks & Deliverables</h3>
              <div className="ui-stack-3">
                {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                  selectedProject.tasks.map(t => (
                    <div key={t.id} className={styles.p16}>
                      <div>
                        <p className="ui-heading-sm">{t.name}</p>
                        <p className={styles.p17}>{t.description || 'No description provided.'}</p>
                      </div>
                      <div className="ui-hstack-3">
                        <span style={{ color: t.status === 'DONE' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s2}>
                          {t.status}
                        </span>
                        {t.status === 'DONE' ? (
                          <CheckCircle2 size={16} className="ui-text-success" />
                        ) : (
                          <AlertCircle size={16} className="ui-text-warning" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.p18}>No tasks defined.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Budget, Deadlines, Milestones */}
          <div className="ui-stack-6">
            {/* Meta Cards */}
            <div className={styles.p19}>
              <h3 className={styles.p20}>Project Info</h3>
              
              <div className="ui-hstack-3">
                <Calendar size={18} className="ui-text-primary" />
                <div>
                  <p className="ui-text-micro">TIMELINE</p>
                  <p className={styles.p21}>
                    {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'} - {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="ui-hstack-3">
                <DollarSign size={18} className="ui-text-success" />
                <div>
                  <p className="ui-text-micro">BUDGET</p>
                  <p className={styles.p22}>
                    {selectedProject.budget ? `$${Number(selectedProject.budget).toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Milestones Card */}
            <div className={styles.p23}>
              <h3 className={styles.p24}>Milestones Timeline</h3>
              <div className="ui-stack-3">
                {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                  selectedProject.milestones.map(m => (
                    <div key={m.id} className="ui-hstack-3">
                      <Award size={16} style={{ color: m.isCompleted ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} />
                      <div className="flex-1">
                        <p style={{ textDecoration: m.isCompleted ? 'line-through' : 'none', color: m.isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text)' }} className={styles.s2}>
                          {m.name}
                        </p>
                        <p className={styles.p25}>
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ color: m.isCompleted ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} className={styles.s3}>
                        {m.isCompleted ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="ui-text-xs-muted">No milestones set.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center p-12">No active project available to show client view.</div>
      )}
    </div>
  );
}
