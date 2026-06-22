'use client';

import React from 'react';
import Link from 'next/link';
import { Card, PageHeader } from '@unerp/ui';
import {
  Clock, Monitor, FileText, UserPlus, UserMinus,
  Briefcase, Target, MessageSquare, TrendingUp, Star,
  Award, BarChart3, HelpCircle, CheckSquare, ChevronRight,
  CalendarDays, GraduationCap, DollarSign, Coffee, Users,
  Settings, CreditCard
} from 'lucide-react';

const groups = [
  {
    title: 'Talent Management',
    description: 'Manage recruitment pipelines, onboarding workflows, goals/OKRs, appraisals, and employee growth.',
    colorClass: 'text-primary bg-primary/5',
    icon: <Users size={20} />,
    modules: [
      { href: '/hr/advanced/recruitment', label: 'Recruitment', icon: <Briefcase size={18} />, desc: 'Jobs, applicant stages, interviews' },
      { href: '/hr/advanced/onboarding', label: 'Onboarding Checklists', icon: <UserPlus size={18} />, desc: 'IT setup, documentation, workflows' },
      { href: '/hr/advanced/offboarding', label: 'Offboarding Checklists', icon: <UserMinus size={18} />, desc: 'Exit checklists, clearings' },
      { href: '/hr/advanced/goals', label: 'Goals & OKRs', icon: <Target size={18} />, desc: 'Objectives, key results, tracking' },
      { href: '/hr/advanced/skills', label: 'Skills Matrix', icon: <Star size={18} />, desc: 'Proficiency profiles, certifications' },
      { href: '/hr/advanced/appraisals', label: 'Performance Appraisals', icon: <Award size={18} />, desc: 'Annual reviews, self-scores' },
      { href: '/hr/advanced/feedback', label: '360° Feedback', icon: <MessageSquare size={18} />, desc: 'Multi-rater anonymous reviews' },
      { href: '/hr/advanced/succession', label: 'Succession Plan', icon: <TrendingUp size={18} />, desc: 'Role readiness, talent pipeline' },
    ]
  },
  {
    title: 'Operations & Service',
    description: 'Administer day-to-day employee items, shifts, company devices, training sessions, and internal tickets.',
    colorClass: 'text-success bg-success/5',
    icon: <Settings size={20} />,
    modules: [
      { href: '/hr/advanced/attendance', label: 'Attendance Record', icon: <Clock size={18} />, desc: 'Check-in/out, logs, overtime' },
      { href: '/hr/advanced/shifts', label: 'Shift Scheduling', icon: <CalendarDays size={18} />, desc: 'Roster builder, employee shifts' },
      { href: '/hr/advanced/assets', label: 'Asset Management', icon: <Monitor size={18} />, desc: 'Company laptops, phones, cards' },
      { href: '/hr/advanced/documents', label: 'Documents Manager', icon: <FileText size={18} />, desc: 'Contracts, signatures, folders' },
      { href: '/hr/advanced/trainings', label: 'Trainings & Certs', icon: <GraduationCap size={18} />, desc: 'Training schedules, completions' },
      { href: '/hr/advanced/tickets', label: 'HR Helpdesk', icon: <HelpCircle size={18} />, desc: 'Employee support tickets, issues' },
      { href: '/hr/advanced/surveys', label: 'Engagement Surveys', icon: <CheckSquare size={18} />, desc: 'Pulse checks, general polls' },
    ]
  },
  {
    title: 'Compensation & BI',
    description: 'Calculate payroll periods, track time-off balances, and view global cost reports.',
    colorClass: 'text-warning bg-warning/5',
    icon: <CreditCard size={20} />,
    modules: [
      { href: '/hr/advanced/payroll', label: 'Payroll & Salaries', icon: <DollarSign size={18} />, desc: 'Grid settings, calculators, runs' },
      { href: '/hr/advanced/leaves', label: 'Leave Management', icon: <Coffee size={18} />, desc: 'Leave requests, balance registry' },
      { href: '/hr/advanced/analytics', label: 'Workforce Analytics', icon: <BarChart3 size={18} />, desc: 'Compensations, headcounts, data' },
    ]
  }
];

export default function AdvancedHRPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Advanced HR"
        description="Configure talent management, day-to-day employee operations, and compensation details"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced' }]}
      />

      {groups.map((group) => (
        <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
            <div className={`p-2 rounded-lg ${group.colorClass}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {group.icon}
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{group.title}</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{group.description}</p>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {group.modules.length} modules
            </span>
          </div>

          <div className="frappe-grid-3">
            {group.modules.map((mod) => (
              <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                <Card padding="md" className="hover:shadow-md transition-all hover:border-primary/30" style={{ cursor: 'pointer', border: '1px solid transparent', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', height: '100%' }}>
                    <div style={{ borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {mod.icon}
                    </div>
                    <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0 }} className="text-foreground">
                        {mod.label}
                      </h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {mod.desc}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 'auto', marginBottom: 'auto' }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}