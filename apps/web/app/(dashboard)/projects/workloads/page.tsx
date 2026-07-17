'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Users, Clock, CalendarDays } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ResourceWorkload {
  employeeId: string;
  name: string;
  department: string;
  capacityHours: number;
  allocatedHours: number;
  utilizationRate: number;
}

export default function ResourceWorkloadsPage() {
  const client = useApiClient();
  const [resourceWorkloads, setResourceWorkloads] = useState<ResourceWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchWorkloads();
  }, [client]);

  const fetchWorkloads = async () => {
    try {
      setLoading(true);
      const data = await client.get<ResourceWorkload[] | { data?: ResourceWorkload[] }>('/projects/resource-workload');
      setResourceWorkloads(Array.isArray(data) ? data : (data.data || []));
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard permission="projects.resource-workload.read">
    <div className="ui-stack-6">
      {/* Page Header */}
      <div>
        <h1 className={styles.p1}>
          <Users size={28} className="ui-text-primary" />
          Resource Workloads
        </h1>
        <p className={styles.p2}>
          Monitor team allocations, verify capacity limits, and resolve over-allocations across active project tasks
        </p>
      </div>

      {loading ? (
        <div className="text-center p-12">Loading team workloads...</div>
      ) : (
        <div className={styles.p3}>
          {resourceWorkloads.map((wl) => {
            const dailyHours = wl.allocatedHours / 5;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            
            return (
              <div key={wl.employeeId} className={styles.p4}>
                <div className="ui-flex-between ui-items-start">
                  <div>
                    <h4 className={styles.p5}>{wl.name}</h4>
                    <p className={styles.p6}>Department: {wl.department}</p>
                  </div>
                  <span style={{ background: wl.utilizationRate > 100 ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: wl.utilizationRate > 100 ? 'var(--color-danger)' : 'var(--color-success)' }} className={styles.s1}>
                    {wl.utilizationRate.toFixed(0)}% Utilized
                  </span>
                </div>

                <div className={styles.p7}>
                  <div className={styles.p8}>
                    <Clock size={14} className="ui-text-tertiary" />
                    <div>
                      <p className={styles.p9}>ALLOCATED</p>
                      <p className={styles.p10}>{wl.allocatedHours} hrs</p>
                    </div>
                  </div>
                  <div className={styles.p11}>
                    <CalendarDays size={14} className="ui-text-tertiary" />
                    <div>
                      <p className={styles.p12}>CAPACITY</p>
                      <p className={styles.p13}>{wl.capacityHours} hrs</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.p14}>
                  <div style={{ width: `${Math.min(wl.utilizationRate, 100)}%`, background: wl.utilizationRate > 100 ? 'var(--color-danger)' : 'var(--color-primary)' }} className={styles.s2} />
                </div>

                {/* Availability Heat Map Calendar Grid */}
                <div className={styles.p15}>
                  <p className={styles.p16}>Availability Heat Map</p>
                  <div className="ui-flex ui-gap-2">
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
                        <div key={idx} className={styles.p17}>
                          <span className={styles.p18}>{day}</span>
                          <span className={styles.p19}>{wl.allocatedHours > 0 ? `${dailyHours.toFixed(1)}h` : '0h'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}

          {resourceWorkloads.length === 0 && (
            <div className={styles.p20}>
              No team allocation workloads recorded in database.
            </div>
          )}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
