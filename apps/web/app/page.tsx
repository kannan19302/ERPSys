'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@unerp/ui';
import {
  Building2,
  BarChart3,
  Users,
  Package,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token !== 'mock-token-xyz') {
        fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            router.push('/apps');
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }).catch(() => {});
      } else {
        router.push('/apps');
      }
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-sunken) 100%)',
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '800px',
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <ShieldCheck size={14} />
          Phase 0 — Foundation Complete
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 'var(--space-4)',
            background: 'linear-gradient(135deg, var(--color-text) 0%, var(--color-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          UniERP
        </h1>

        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto var(--space-8)',
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          A fully-packed, composable, industry-agnostic Enterprise Resource Planning
          system — built for every business, every industry.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            View Architecture
          </Button>
        </div>
      </div>

      {/* Module Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          maxWidth: '900px',
          width: '100%',
          marginTop: 'var(--space-16)',
        }}
      >
        {[
          { icon: CreditCard, label: 'Finance & Accounting', phase: 'Phase 1' },
          { icon: Users, label: 'Human Resources', phase: 'Phase 1' },
          { icon: BarChart3, label: 'CRM & Sales', phase: 'Phase 1' },
          { icon: Package, label: 'Inventory & Warehouse', phase: 'Phase 1' },
          { icon: Building2, label: 'Manufacturing', phase: 'Phase 2' },
          { icon: ShieldCheck, label: 'Administration', phase: 'Phase 0' },
        ].map(({ icon: Icon, label, phase }) => (
          <div
            key={label}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--color-primary)';
              el.style.boxShadow = 'var(--shadow-glow)';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--color-border)';
              el.style.boxShadow = 'none';
              el.style.transform = 'translateY(0)';
            }}
          >
            <Icon
              size={24}
              style={{ color: 'var(--color-primary)' }}
            />
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{label}</p>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '2px',
                }}
              >
                {phase}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: 'var(--space-16)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Built with AI-Agent Driven Development (AADD) • Powered by Next.js + NestJS +
        PostgreSQL
      </p>
    </main>
  );
}
