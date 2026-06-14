'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Award } from 'lucide-react';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [criticalPathIds, setCriticalPathIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          fetchProjectDetails(data[0].id);
        }
      }
    } catch {
      // Ignored
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
      }
    } catch {
      // Ignored
    }
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
        alert(`Critical path calculated! Status is ${data.overallHealth}. ${data.criticalPathTaskIds.length} tasks on critical path.`);
        fetchProjectDetails(selectedProject.id);
      }
    } catch {
      alert('Error calculating critical path');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Activity size={28} style={{ color: 'var(--color-primary)' }} />
          Project Health & Critical Path (CPM)
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Run critical path calculation simulations, analyze delay risks, and view overall project key metrics
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)' }}>
        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Select Project</h3>
          {projects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => fetchProjectDetails(p.id)}
                style={{
                  textAlign: 'left',
                  padding: 'var(--space-4)',
                  background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>{p.name}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{p.code}</p>
              </button>
            );
          })}
        </div>

        {/* Health Display */}
        {selectedProject ? (
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{selectedProject.name} Health Status</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{selectedProject.code}</p>
              </div>
              <button
                onClick={handleCalculateCriticalPath}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 'semibold',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Run CPM Optimization
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              {/* Health Score Card */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Overall Project Health</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <ShieldAlert size={32} style={{ color: selectedProject.overallHealth === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-success)' }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: selectedProject.overallHealth === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {selectedProject.overallHealth || 'HEALTHY'}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Based on active milestones & task delays</p>
                  </div>
                </div>
              </div>

              {/* Critical Path Tasks Count */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Critical Path Analysis</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Award size={32} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{criticalPathIds.length} Tasks</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Tasks that directly impact project end dates</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>CPM Risk Analysis Parameters</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', background: 'var(--color-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Resource Over-allocations Trigger:</span>
                  <strong style={{ color: 'var(--color-danger)' }}>Critical Danger (Util &gt; 110%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Task Predecessor Delay Threshold:</span>
                  <strong>2.5 business days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Baseline Alignment Variance:</span>
                  <strong>Strict (0 Tolerance for baseline shifts)</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', minHeight: '300px' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No project selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
