'use client';
import React from 'react';
import { PageHeader, Card, KPICard, DashboardChart } from '@unerp/ui';
import { GraduationCap, DollarSign, BookOpen, TrendingUp, Users, Award } from 'lucide-react';

const ENROLLMENT_BY_YEAR = [
  { name: '2022', students: 280 }, { name: '2023', students: 320 },
  { name: '2024', students: 380 }, { name: '2025', students: 420 },
  { name: '2026', students: 465 },
];

const FEE_COLLECTION = [
  { name: 'Jan', collected: 85000, outstanding: 12000 },
  { name: 'Feb', collected: 92000, outstanding: 8000 },
  { name: 'Mar', collected: 78000, outstanding: 22000 },
  { name: 'Apr', collected: 95000, outstanding: 5000 },
  { name: 'May', collected: 88000, outstanding: 15000 },
  { name: 'Jun', collected: 91000, outstanding: 10000 },
];

const GRADE_DISTRIBUTION = [
  { name: 'A', count: 85 }, { name: 'B', count: 120 },
  { name: 'C', count: 95 }, { name: 'D', count: 40 }, { name: 'F', count: 15 },
];

const COURSE_POPULARITY = [
  { name: 'Mathematics', enrolled: 145 },
  { name: 'English', enrolled: 130 },
  { name: 'Physics', enrolled: 98 },
  { name: 'Chemistry', enrolled: 87 },
  { name: 'Biology', enrolled: 76 },
  { name: 'History', enrolled: 62 },
];

export default function EducationReportsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader title="Reports & Analytics" description="Enrollment trends, fee collection, and academic performance analysis"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Reports' }]} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Total Enrollment" value="465" change={10} changeLabel="vs last year" icon={<GraduationCap size={18} />} color="var(--color-primary)" />
        <KPICard title="Fee Collection Rate" value="88%" icon={<DollarSign size={18} />} color="var(--color-success)" />
        <KPICard title="Average GPA" value="3.2" icon={<Award size={18} />} color="var(--color-info)" />
        <KPICard title="Course Offerings" value="24" icon={<BookOpen size={18} />} color="var(--color-warning)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Enrollment Trend" subtitle="Year-over-year student enrollment"
          data={ENROLLMENT_BY_YEAR}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'students', name: 'Students', color: '#6366f1' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line', 'bar']} height={280} />

        <DashboardChart title="Fee Collection" subtitle="Monthly collected vs outstanding"
          data={FEE_COLLECTION}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'collected', name: 'Collected', color: '#22c55e' },
            { dataKey: 'outstanding', name: 'Outstanding', color: '#ef4444' },
          ] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Grade Distribution" subtitle="Student grade breakdown"
          data={GRADE_DISTRIBUTION}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Students', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie', 'donut']} height={260} />

        <DashboardChart title="Course Popularity" subtitle="Enrollment by course"
          data={COURSE_POPULARITY}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'enrolled', name: 'Enrolled', color: '#8b5cf6' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie']} height={260} />
      </div>
    </div>
  );
}
