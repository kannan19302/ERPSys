'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Briefcase, Activity, Target, ShieldAlert, Plus, Sparkles } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
  }, [client]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await client.get<Portfolio[] | { data?: Portfolio[] }>('/projects/portfolios');
      setPortfolios(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/projects/portfolios', {
          ...newPortfolio,
          budget: newPortfolio.budget ? parseFloat(newPortfolio.budget) : undefined,
        });

      setIsModalOpen(false);
      setNewPortfolio({ name: '', description: '', strategicAlignment: 'MEDIUM', budget: '' });
      void fetchPortfolios();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create portfolio');
    }
  };

  return (
    <div className="ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Briefcase size={28} className="ui-text-primary" />
            Strategic Portfolios
          </h1>
          <p className={styles.p2}>
            Roll up KPIs, monitor strategic budgets, risk indexes, and strategic alignment mapping
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.p3}
        >
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {loading && <div className="ui-text-muted">Loading portfolios...</div>}
      {error && <div className="ui-text-danger">{error}</div>}

      {/* Grid of Portfolios */}
      {!loading && portfolios.length > 0 && (
        <div className={styles.p4}>
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className={["ui-card", styles.p5].filter(Boolean).join(' ')}
            >
              {/* Card Header */}
              <div className="ui-flex-between ui-items-start">
                <div>
                  <h3 className="ui-heading-lg">{portfolio.name}</h3>
                  <p className={styles.p6}>
                    {portfolio.description || 'No description provided.'}
                  </p>
                </div>
                <span
                  style={{ background: portfolio.strategicAlignment === 'HIGH'
                        ? 'var(--color-success-light)'
                        : 'var(--color-warning-light)', color: portfolio.strategicAlignment === 'HIGH'
                        ? 'var(--color-success)'
                        : 'var(--color-warning)' }} className={styles.s1}
                >
                  Alignment: {portfolio.strategicAlignment}
                </span>
              </div>

              {/* Rolling KPIs */}
              <div className={styles.p7}>
                <div className={styles.p8}>
                  <Target size={16} className="ui-text-primary" />
                  <span className={styles.p9}>PROJECTS</span>
                  <span className={styles.p10}>{portfolio.totalProjects}</span>
                </div>
                <div className={styles.p11}>
                  <Activity size={16} className={styles.p12} />
                  <span className={styles.p13}>BUDGET ROLLUP</span>
                  <span className={styles.p14}>
                    ${Number(portfolio.totalBudget).toLocaleString()}
                  </span>
                </div>
                <div className={styles.p15}>
                  <ShieldAlert size={16} className="ui-text-danger" />
                  <span className={styles.p16}>OPEN RISKS</span>
                  <span className={styles.p17}>{portfolio.openRisks}</span>
                </div>
              </div>

              {/* Projects List within Portfolio */}
              <div>
                <h4 className={styles.p18}>
                  Associated Projects
                </h4>
                {portfolio.projects.length > 0 ? (
                  <div className="ui-stack-2">
                    {portfolio.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className={styles.p19}
                      >
                        <div>
                          <span className={styles.p20}>{proj.name}</span>
                          <span className={styles.p21}>({proj.code})</span>
                        </div>
                        <span
                          style={{ background: proj.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg-hover)', color: proj.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s2}
                        >
                          {proj.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.p22}>
                    No projects associated with this portfolio.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && portfolios.length === 0 && (
        <div className={styles.p23}>
          No portfolios defined. Create a new portfolio to start rolling up project metrics.
        </div>
      )}

      {/* New Portfolio Modal */}
      {isModalOpen && (
        <div className={styles.p24}>
          <form onSubmit={handleCreatePortfolio} className={styles.p25}>
            <h3 className={styles.p26}>
              <Sparkles size={18} className="ui-text-primary" />
              Create Portfolio
            </h3>

            <div>
              <label className="ui-text-xs-label">Portfolio Name</label>
              <input required type="text" value={newPortfolio.name} onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })} className={styles.p27} />
            </div>

            <div>
              <label className="ui-text-xs-label">Description</label>
              <textarea value={newPortfolio.description} onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })} className={styles.p28} />
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Strategic Alignment</label>
                <select value={newPortfolio.strategicAlignment} onChange={(e) => setNewPortfolio({ ...newPortfolio, strategicAlignment: e.target.value })} className={styles.p29}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="ui-text-xs-label">Budget Allocation</label>
                <input type="number" placeholder="e.g. 500000" value={newPortfolio.budget} onChange={(e) => setNewPortfolio({ ...newPortfolio, budget: e.target.value })} className={styles.p30} />
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.p31}>Cancel</button>
              <button type="submit" className={styles.p32}>Save Portfolio</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
