'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert, 
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, PageHeader, Button, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';

interface ServiceTicket {
  id: string;
  title: string;
  customerName: string;
  priority: string;
  status: string;
  slaDeadline: string;
}

interface ServiceDispatch {
  id: string;
  technicianId: string;
  scheduledTime: string;
  status: string;
  ticket: {
    title: string;
    customerName: string;
  };
}

export default function FieldServicePage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [dispatches, setDispatches] = useState<ServiceDispatch[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'dispatches'>('dashboard');
  const [activeView, setActiveView] = useState<ViewMode>('chart');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [tRes, dRes] = await Promise.all([
        fetch('/api/v1/field-service/tickets', { headers }),
        fetch('/api/v1/field-service/dispatches', { headers }),
      ]);

      const [tData, dData] = await Promise.all([
        tRes.json(), dRes.json()
      ]);

      setTickets(Array.isArray(tData) ? tData : []);
      setDispatches(Array.isArray(dData) ? dData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async () => {
    const title = prompt('Enter service ticket issue:');
    if (!title) return;
    const customerName = prompt('Enter Customer Name:');
    if (!customerName) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/field-service/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          customerName,
          description: 'AC condenser maintenance request',
          priority: 'HIGH',
          slaDeadline: new Date(Date.now() + 14400000).toISOString() // 4 hours SLA
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to log ticket.');
      }
    } catch {
      alert('Error logging ticket.');
    }
  };

  const handleCreateDispatch = async () => {
    if (tickets.length === 0) {
      alert('Must have active tickets to schedule dispatches.');
      return;
    }
    const technicianId = prompt('Enter Technician ID (e.g. tech-01):', 'tech-01');
    if (!technicianId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/field-service/dispatches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: tickets[0]?.id,
          technicianId,
          scheduledTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          routeDetails: JSON.stringify({ startingPoint: 'Main Depot', route: ['5th Ave', 'Expressway'] })
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to dispatch technician.');
      }
    } catch {
      alert('Error dispatching technician.');
    }
  };

  // Computations
  const totalTickets = tickets.length;
  const dispatchedCount = dispatches.length;
  const criticalCount = useMemo(() => tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED' || t.status === 'COMPLETED').length, [tickets]);

  // Chart data
  const ticketPriorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const dispatchStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    dispatches.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dispatches]);

  const techWorkloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    dispatches.forEach(d => {
      counts[d.technicianId] = (counts[d.technicianId] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dispatches]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <Spinner size="lg" />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Service Dispatch Panel...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Header */}
      <PageHeader
        title="Field Service Control Panel"
        description="Dispatch routes, check customer SLA breach alerts, and schedule preventative routine inspections."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Field Service' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button onClick={handleCreateDispatch} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <UserCheck size={16} style={{ color: 'var(--color-primary)' }} /> Dispatch Tech
            </Button>
            <Button onClick={handleCreateTicket} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Log Ticket
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard
          title="Total Service Tickets"
          value={String(totalTickets)}
          icon={<ClipboardList size={18} />}
          color="var(--color-primary)"
          drillDown={{
            modalTitle: 'SLA Service Tickets',
            columns: [
              { key: 'title', label: 'Issue Title' },
              { key: 'customerName', label: 'Customer' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' }
            ],
            rows: tickets.map(t => ({ ...t }))
          }}
        />
        <DashboardKPICard
          title="Active Dispatches"
          value={String(dispatchedCount)}
          icon={<UserCheck size={18} />}
          color="var(--color-success)"
          drillDown={{
            modalTitle: 'Scheduled Dispatches',
            columns: [
              { key: 'ticketTitle', label: 'Ticket / Issue' },
              { key: 'customerName', label: 'Customer' },
              { key: 'technicianId', label: 'Technician ID' },
              { key: 'scheduledTime', label: 'Scheduled Time', render: (v) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString(); } },
              { key: 'status', label: 'Status' }
            ],
            rows: dispatches.map(d => ({
              ...d,
              ticketTitle: d.ticket?.title || '—',
              customerName: d.ticket?.customerName || '—'
            }))
          }}
        />
        <DashboardKPICard
          title="Critical Priority"
          value={String(criticalCount)}
          icon={<AlertTriangle size={18} />}
          color="var(--color-danger)"
          drillDown={{
            modalTitle: 'Critical Priority Tickets',
            columns: [
              { key: 'title', label: 'Issue Title' },
              { key: 'customerName', label: 'Customer' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' }
            ],
            rows: tickets.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').map(t => ({ ...t }))
          }}
        />
        <DashboardKPICard
          title="Resolved SLA Jobs"
          value={String(resolvedCount)}
          icon={<CheckCircle2 size={18} />}
          color="var(--color-success)"
          drillDown={{
            modalTitle: 'Resolved Service Tickets',
            columns: [
              { key: 'title', label: 'Issue Title' },
              { key: 'customerName', label: 'Customer' },
              { key: 'status', label: 'Status' }
            ],
            rows: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').map(t => ({ ...t }))
          }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Tickets by Priority"
            subtitle="Breakdown of critical vs low service tickets"
            data={ticketPriorityData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Tickets' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
          />
          <DashboardChart
            title="Dispatch Job Status"
            subtitle="Statuses of scheduled technician dispatches"
            data={dispatchStatusData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Dispatches', color: '#8b5cf6' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'donut', 'pie']}
            height={280}
          />
          <DashboardChart
            title="Tech Workload Distribution"
            subtitle="Number of active jobs assigned by technician"
            data={techWorkloadData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Jobs', color: '#10b981' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area']}
            height={280}
          />
        </div>
      )}

      {/* Standard List View */}
      {activeView === 'list' && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
                borderBottom: activeTab === 'dashboard' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}
            >
              Dashboard View
            </button>
            <button 
              onClick={() => setActiveTab('tickets')}
              style={{
                padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
                borderBottom: activeTab === 'tickets' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'tickets' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}
            >
              <ClipboardList size={16} /> SLA Service Tickets
            </button>
            <button 
              onClick={() => setActiveTab('dispatches')}
              style={{
                padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
                borderBottom: activeTab === 'dispatches' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'dispatches' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}
            >
              <UserCheck size={16} /> Dispatch Schedule
            </button>
          </div>

          {/* Grid content */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
            
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Welcome to the Field Service Control Panel. Select a tab above to manage service tickets or dispatches.
                  </p>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: 'var(--space-2.5)' }}>Issue Title</th>
                        <th style={{ padding: 'var(--space-2.5)' }}>Customer</th>
                        <th style={{ padding: 'var(--space-2.5)' }}>Priority</th>
                        <th style={{ padding: 'var(--space-2.5)' }}>SLA Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{t.title}</td>
                          <td style={{ padding: 'var(--space-2.5)' }}>{t.customerName}</td>
                          <td style={{ padding: 'var(--space-2.5)' }}>
                            <span style={{ fontSize: 'var(--text-xxs)', fontWeight: 'bold', background: t.priority === 'URGENT' || t.priority === 'HIGH' ? '#ffebee' : 'var(--color-bg)', color: t.priority === 'URGENT' || t.priority === 'HIGH' ? '#c62828' : 'var(--color-text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.priority}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{new Date(t.slaDeadline).toLocaleString()}</td>
                        </tr>
                      ))}
                      {tickets.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No service tickets registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'dispatches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {dispatches.map(d => (
                      <div key={d.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>Tech ID: {d.technicianId}</p>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Job: {d.ticket.title}</p>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Customer: {d.ticket.customerName}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{new Date(d.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <span style={{ fontSize: 'var(--text-xxs)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                    {dispatches.length === 0 && (
                      <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No dispatched jobs found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel: Rules info */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
                <ShieldAlert size={16} style={{ color: 'var(--color-primary)' }} />
                SLA Warning Levels
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Technicians log checklists and collect signature captures. Offline queues auto-reconcile through IndexDB when online connections resume.
              </p>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
