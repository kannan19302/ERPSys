'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  UserPlus, 
  Calendar, 
  Pill, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
}

interface Practitioner {
  id: string;
  specialty: string;
  licenseNumber: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  notes: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  practitioner: {
    employee: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function HealthcarePage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'patients' | 'practitioners' | 'appointments'>('patients');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, prRes, appRes] = await Promise.all([
        fetch('http://localhost:3001/healthcare/patients', { headers }),
        fetch('http://localhost:3001/healthcare/practitioners', { headers }),
        fetch('http://localhost:3001/healthcare/appointments', { headers }),
      ]);

      const [pData, prData, appData] = await Promise.all([
        pRes.json(), prRes.json(), appRes.json()
      ]);

      setPatients(Array.isArray(pData) ? pData : []);
      setPractitioners(Array.isArray(prData) ? prData : []);
      setAppointments(Array.isArray(appData) ? appData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePatient = async () => {
    const firstName = prompt('Enter Patient First Name:');
    if (!firstName) return;
    const lastName = prompt('Enter Patient Last Name:');
    if (!lastName) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/healthcare/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: '1995-04-12',
          gender: 'FEMALE',
          email: `${firstName.toLowerCase()}@gmail.com`
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to register patient.');
      }
    } catch {
      alert('Error registering patient.');
    }
  };

  const handleCreateAppointment = async () => {
    if (patients.length === 0 || practitioners.length === 0) {
      alert('Must have patients and practitioners to book appointments.');
      return;
    }
    const notes = prompt('Enter appointment notes:');
    if (!notes) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/healthcare/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patients[0]?.id,
          practitionerId: practitioners[0]?.id,
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endTime: new Date(Date.now() + 90000000).toISOString(),
          notes
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to book appointment.');
      }
    } catch {
      alert('Error booking appointment.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Medical Workspace...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity style={{ color: 'var(--color-primary)' }} />
            Healthcare Operations Hub
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Register patient medical profiles, coordinate practitioner calendars, and route encounters for billing claims.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateAppointment} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} /> Book Appointment
          </button>
          <button onClick={handleCreatePatient} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: 'var(--color-bg-elevated)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <UserPlus size={16} /> Register Patient
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('patients')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'patients' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'patients' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <ClipboardList size={16} /> Patient Registry (EHR)
        </button>
        <button 
          onClick={() => setActiveTab('practitioners')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'practitioners' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'practitioners' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Pill size={16} /> Medical Practitioners
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'appointments' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'appointments' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Calendar size={16} /> Patient Scheduling
        </button>
      </div>

      {/* Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'patients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Gender</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>DOB</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{p.firstName} {p.lastName}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{p.gender}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{p.email || 'N/A'}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No patient profiles registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'practitioners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Practitioner Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Specialty</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>License Number</th>
                  </tr>
                </thead>
                <tbody>
                  {practitioners.map(pr => (
                    <tr key={pr.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>Dr. {pr.employee.firstName} {pr.employee.lastName}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{pr.specialty}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{pr.licenseNumber}</td>
                    </tr>
                  ))}
                  {practitioners.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No medical practitioners registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {appointments.map(a => (
                  <div key={a.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Patient: {a.patient.firstName} {a.patient.lastName}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Doctor: Dr. {a.practitioner.employee.firstName} {a.practitioner.employee.lastName}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Notes: {a.notes}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xxs)', color: 'var(--color-text-secondary)' }}>{new Date(a.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No scheduled patient appointments found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            Insurance Billing
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Medical encounters register diagnosis codes and invoice treatments automatically linking through to Ledger Accounts.
          </p>
        </div>

      </div>
    </div>
  );
}
