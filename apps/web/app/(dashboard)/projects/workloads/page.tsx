'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, CalendarDays } from 'lucide-react';

interface ResourceWorkload {
  employeeId: string;
  name: string;
  department: string;
  capacityHours: number;
  allocatedHours: number;
  utilizationRate: number;
}

export default function ResourceWorkloadsPage() {
  const [resourceWorkloads, setResourceWorkloads] = useState<ResourceWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkloads();
  }, []);

  const fetchWorkloads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects/resource-workload', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setResourceWorkloads(await res.json());
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Users size={28} style={{ color: 'var(--color-primary)' }} />
          Resource Workloads
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Monitor team allocations, verify capacity limits, and resolve over-allocations across active project tasks
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading team workloads...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          {resourceWorkloads.map((wl) => {
            const dailyHours = wl.allocatedHours / 5;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            
            return (
              <div key={wl.employeeId} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>{wl.name}</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Department: {wl.department}</p>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: wl.utilizationRate > 100 ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                    color: wl.utilizationRate > 100 ? 'var(--color-danger)' : 'var(--color-success)',
                  }}>
                    {wl.utilizationRate.toFixed(0)}% Utilized
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-1)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <Clock size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <div>
                      <p style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>ALLOCATED</p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{wl.allocatedHours} hrs</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <CalendarDays size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <div>
                      <p style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>CAPACITY</p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{wl.capacityHours} hrs</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: 'var(--space-1)' }}>
                  <div style={{
                    width: `${Math.min(wl.utilizationRate, 100)}%`,
                    height: '100%',
                    background: wl.utilizationRate > 100 ? 'var(--color-danger)' : 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                  }} />
                </div>

                {/* Availability Heat Map Calendar Grid */}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>Availability Heat Map</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {days.map((day, idx) => {
                      // Determine heat color based on dailyHours
                      let heatBg = 'var(--color-success-light)';
                      let heatBorder = '1px solid var(--color-success)';
                      let heatText = 'var(--color-success)';
                      
                      if (wl.allocatedHours === 0) {
                        heatBg = 'var(--color-bg)';
                        heatBorder = '1px solid var(--color-border)';
                        heatText = 'var(--color-text-secondary)';
                      } else if (dailyHours > 8) {
                        heatBg = 'var(--color-danger-light)';
                        heatBorder = '1px solid var(--color-danger)';
                        heatText = 'var(--color-danger)';
                      } else if (dailyHours > 6) {
                        heatBg = 'var(--color-warning-light)';
                        heatBorder = '1px solid var(--color-warning)';
                        heatText = 'var(--color-warning)';
                      }
                      
                      return (
                        <div key={idx} style={{
                          flex: 1,
                          padding: 'var(--space-2)',
                          background: heatBg,
                          border: heatBorder,
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: heatText }}>{day}</span>
                          <span style={{ fontSize: '10px', color: heatText }}>{wl.allocatedHours > 0 ? `${dailyHours.toFixed(1)}h` : '0h'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}

          {resourceWorkloads.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', color: 'var(--color-text-secondary)' }}>
              No team allocation workloads recorded in database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
