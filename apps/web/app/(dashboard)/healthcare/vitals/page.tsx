'use client';
import React from 'react';
import { PageHeader, Card, KPICard, DashboardChart } from '@unerp/ui';
import { Activity, Heart, Thermometer, Wind } from 'lucide-react';

const BP_DATA = [
  { name: 'Mon', systolic: 120, diastolic: 80 }, { name: 'Tue', systolic: 125, diastolic: 82 },
  { name: 'Wed', systolic: 118, diastolic: 78 }, { name: 'Thu', systolic: 130, diastolic: 85 },
  { name: 'Fri', systolic: 122, diastolic: 79 }, { name: 'Sat', systolic: 119, diastolic: 77 },
];

const HR_DATA = [
  { name: 'Mon', rate: 72 }, { name: 'Tue', rate: 75 }, { name: 'Wed', rate: 68 },
  { name: 'Thu', rate: 80 }, { name: 'Fri', rate: 71 }, { name: 'Sat', rate: 69 },
];

const TEMP_DATA = [
  { name: 'Mon', temp: 98.6 }, { name: 'Tue', temp: 98.4 }, { name: 'Wed', temp: 99.1 },
  { name: 'Thu', temp: 98.7 }, { name: 'Fri', temp: 98.5 }, { name: 'Sat', temp: 98.8 },
];

const SPO2_DATA = [
  { name: 'Mon', level: 98 }, { name: 'Tue', level: 97 }, { name: 'Wed', level: 99 },
  { name: 'Thu', level: 96 }, { name: 'Fri', level: 98 }, { name: 'Sat', level: 99 },
];

export default function VitalsDashboardPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader title="Vitals Dashboard" description="Patient vitals monitoring and trend analysis"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Vitals' }]} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Avg Blood Pressure" value="122/80" icon={<Heart size={18} />} color="var(--color-primary)" />
        <KPICard title="Avg Heart Rate" value="72 bpm" icon={<Activity size={18} />} color="var(--color-danger)" />
        <KPICard title="Avg Temperature" value="98.7°F" icon={<Thermometer size={18} />} color="var(--color-warning)" />
        <KPICard title="Avg SpO2" value="98%" icon={<Wind size={18} />} color="var(--color-success)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Blood Pressure" subtitle="Systolic / Diastolic trends"
          data={BP_DATA}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'systolic', name: 'Systolic', color: '#ef4444' },
            { dataKey: 'diastolic', name: 'Diastolic', color: '#6366f1' },
          ] }}
          defaultChartType="line" allowedChartTypes={['line', 'area']} height={280} />
        <DashboardChart title="Heart Rate" subtitle="Daily resting heart rate"
          data={HR_DATA}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'BPM', color: '#ef4444' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line', 'bar']} height={280} />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Body Temperature" subtitle="Daily temperature readings"
          data={TEMP_DATA}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'temp', name: 'Temp (°F)', color: '#f59e0b' }] }}
          defaultChartType="line" allowedChartTypes={['line', 'area']} height={260} />
        <DashboardChart title="Oxygen Saturation (SpO2)" subtitle="Daily SpO2 levels"
          data={SPO2_DATA}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'level', name: 'SpO2 %', color: '#22c55e' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line']} height={260} />
      </div>
    </div>
  );
}
