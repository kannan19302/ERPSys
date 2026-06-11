'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  Plus, 
  UserCheck, 
  ShieldAlert, 
  ClipboardList
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'tickets' | 'dispatches'>('tickets');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [tRes, dRes] = await Promise.all([
        fetch('http://localhost:3001/field-service/tickets', { headers }),
        fetch('http://localhost:3001/field-service/dispatches', { headers }),
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
      const res = await fetch('http://localhost:3001/field-service/tickets', {
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
      const res = await fetch('http://localhost:3001/field-service/dispatches', {
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Service Dispatch Panel...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Wrench style={{ color: 'var(--color-primary)' }} />
            Field Service Control Panel
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
             dispatch routes, check customer SLA breach alerts, and schedule preventative routine inspections.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateDispatch} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <UserCheck size={16} style={{ color: 'var(--color-primary)' }} /> Dispatch Tech
          </button>
          <button onClick={handleCreateTicket} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Plus size={16} /> Log Ticket
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
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
                        <span style={{ fontSize: 'var(--text-xxs)', fontWeight: 'bold', background: t.priority === 'URGENT' ? '#ffebee' : 'var(--color-bg)', color: t.priority === 'URGENT' ? '#c62828' : 'var(--color-text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
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
    </div>
  );
}
