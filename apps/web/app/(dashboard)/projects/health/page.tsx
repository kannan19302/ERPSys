'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Award } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  overallHealth?: string | null;
  criticalPath?: string | null;
}

export default function ProjectHealthPage() {
  const client = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [criticalPathIds, setCriticalPathIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, [client]);

  const fetchProjects = async () => {
    try {
      const data = await client.get<Project[] | { data?: Project[] }>('/projects');
      const projectList = Array.isArray(data) ? data : (data.data || []);
      setProjects(projectList);
      const initialProject = projectList[0];
      if (initialProject) {
        void fetchProjectDetails(initialProject.id);
      }
    } catch {
      // Ignored
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const data = await client.get<Project>(`/projects/${projectId}`);
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
    } catch {
      // Ignored
    }
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProject) return;
    try {
      const data = await client.post<{ criticalPathTaskIds: string[]; overallHealth: string }>(`/projects/${selectedProject.id}/critical-path`);
        setCriticalPathIds(data.criticalPathTaskIds || []);
        alert(`Critical path calculated! Status is ${data.overallHealth}. ${data.criticalPathTaskIds.length} tasks on critical path.`);
        void fetchProjectDetails(selectedProject.id);
    } catch {
      alert('Error calculating critical path');
    }
  };

  return (
    <div className="ui-stack-6">
      {/* Page Header */}
      <div>
        <h1 className={styles.p1}>
          <Activity size={28} className="ui-text-primary" />
          Project Health & Critical Path (CPM)
        </h1>
        <p className={styles.p2}>
          Run critical path calculation simulations, analyze delay risks, and view overall project key metrics
        </p>
      </div>

      <div className={styles.p3}>
        {/* Project List */}
        <div className="ui-stack-2">
          <h3 className={styles.p4}>Select Project</h3>
          {projects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => fetchProjectDetails(p.id)}
                style={{ background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)', border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }} className={styles.s1}
              >
                <p style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }} className={styles.s2}>{p.name}</p>
                <p className={styles.p5}>{p.code}</p>
              </button>
            );
          })}
        </div>

        {/* Health Display */}
        {selectedProject ? (
          <div className={styles.p6}>
            <div className={styles.p7}>
              <div>
                <h3 className={styles.p8}>{selectedProject.name} Health Status</h3>
                <p className={styles.p9}>{selectedProject.code}</p>
              </div>
              <button
                onClick={handleCalculateCriticalPath}
                className={styles.p10}
              >
                Run CPM Optimization
              </button>
            </div>

            <div className="ui-grid-2 ui-gap-6">
              {/* Health Score Card */}
              <div className={styles.p11}>
                <h4 className={styles.p12}>Overall Project Health</h4>
                <div className="ui-hstack-3">
                  <ShieldAlert size={32} style={{ color: selectedProject.overallHealth === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-success)' }} />
                  <div>
                    <p style={{ color: selectedProject.overallHealth === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-success)' }} className={styles.s3}>
                      {selectedProject.overallHealth || 'HEALTHY'}
                    </p>
                    <p className={styles.p13}>Based on active milestones & task delays</p>
                  </div>
                </div>
              </div>

              {/* Critical Path Tasks Count */}
              <div className={styles.p14}>
                <h4 className={styles.p15}>Critical Path Analysis</h4>
                <div className="ui-hstack-3">
                  <Award size={32} className="ui-text-primary" />
                  <div>
                    <p className={styles.p16}>{criticalPathIds.length} Tasks</p>
                    <p className={styles.p17}>Tasks that directly impact project end dates</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className={styles.p18}>CPM Risk Analysis Parameters</h4>
              <div className={styles.p19}>
                <div className="ui-flex-between text-xs">
                  <span className="ui-text-muted">Resource Over-allocations Trigger:</span>
                  <strong className="ui-text-danger">Critical Danger (Util &gt; 110%)</strong>
                </div>
                <div className={styles.p20}>
                  <span className="ui-text-muted">Task Predecessor Delay Threshold:</span>
                  <strong>2.5 business days</strong>
                </div>
                <div className={styles.p21}>
                  <span className="ui-text-muted">Baseline Alignment Variance:</span>
                  <strong>Strict (0 Tolerance for baseline shifts)</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.p22}>
            <p className="ui-text-muted">No project selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
