'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, Activity, Target, ShieldAlert, Plus, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  budget: number | null;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  riskScore: number | null;
  strategicAlignment: string | null;
  budget: number | null;
  projects: Project[];
  totalProjects: number;
  totalBudget: number;
  activeProjects: number;
  totalRisks: number;
  openRisks: number;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Portfolio Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    description: '',
    strategicAlignment: 'MEDIUM',
    budget: '',
  });

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects/portfolios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      const data = await res.json();
      setPortfolios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/projects/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newPortfolio,
          budget: newPortfolio.budget ? parseFloat(newPortfolio.budget) : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create portfolio');

      setIsModalOpen(false);
      setNewPortfolio({ name: '', description: '', strategicAlignment: 'MEDIUM', budget: '' });
      fetchPortfolios();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create portfolio');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Briefcase size={28} style={{ color: 'var(--color-primary)' }} />
            Strategic Portfolios
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Roll up KPIs, monitor strategic budgets, risk indexes, and strategic alignment mapping
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1.5)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-2.5) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {loading && <div style={{ color: 'var(--color-text-secondary)' }}>Loading portfolios...</div>}
      {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}

      {/* Grid of Portfolios */}
      {!loading && portfolios.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-5)' }}>
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="frappe-card"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{portfolio.name}</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {portfolio.description || 'No description provided.'}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background:
                      portfolio.strategicAlignment === 'HIGH'
                        ? 'var(--color-success-light)'
                        : 'var(--color-warning-light)',
                    color:
                      portfolio.strategicAlignment === 'HIGH'
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                  }}
                >
                  Alignment: {portfolio.strategicAlignment}
                </span>
              </div>

              {/* Rolling KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Target size={16} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>PROJECTS</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{portfolio.totalProjects}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Activity size={16} style={{ color: 'var(--color-info)' }} />
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>BUDGET ROLLUP</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
                    ${Number(portfolio.totalBudget).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>OPEN RISKS</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{portfolio.openRisks}</span>
                </div>
              </div>

              {/* Projects List within Portfolio */}
              <div>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Associated Projects
                </h4>
                {portfolio.projects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {portfolio.projects.map((proj) => (
                      <div
                        key={proj.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{proj.name}</span>
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', marginLeft: 'var(--space-2)' }}>({proj.code})</span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            background: proj.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg-hover)',
                            color: proj.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 'bold',
                          }}
                        >
                          {proj.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                    No projects associated with this portfolio.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && portfolios.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', color: 'var(--color-text-secondary)' }}>
          No portfolios defined. Create a new portfolio to start rolling up project metrics.
        </div>
      )}

      {/* New Portfolio Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreatePortfolio} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              Create Portfolio
            </h3>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Portfolio Name</label>
              <input required type="text" value={newPortfolio.name} onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea value={newPortfolio.description} onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px', height: '60px', resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Strategic Alignment</label>
                <select value={newPortfolio.strategicAlignment} onChange={(e) => setNewPortfolio({ ...newPortfolio, strategicAlignment: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Budget Allocation</label>
                <input type="number" placeholder="e.g. 500000" value={newPortfolio.budget} onChange={(e) => setNewPortfolio({ ...newPortfolio, budget: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save Portfolio</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
