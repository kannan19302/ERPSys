import type { Meta, StoryObj } from '@storybook/react';
import { KPICard, MiniBarChart, MiniDonutChart, Sparkline } from './charts';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

export default { title: 'Components/Charts' } as Meta;

export const KPI: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <KPICard title="Revenue" value="$124,560" change="+12.3%" trend="up" icon={DollarSign} />
      <KPICard title="Users" value="2,450" change="+8.1%" trend="up" icon={Users} />
      <KPICard title="Growth" value="18.5%" change="-2.3%" trend="down" icon={TrendingUp} />
    </div>
  ),
};

export const BarChart: StoryObj = {
  render: () => (
    <MiniBarChart
      data={[
        { label: 'Jan', value: 400 },
        { label: 'Feb', value: 300 },
        { label: 'Mar', value: 500 },
        { label: 'Apr', value: 450 },
        { label: 'May', value: 600 },
        { label: 'Jun', value: 550 },
      ]}
      height={120}
    />
  ),
};

export const DonutChart: StoryObj = {
  render: () => (
    <MiniDonutChart
      segments={[
        { label: 'Paid', value: 65, color: 'var(--color-success)' },
        { label: 'Pending', value: 25, color: 'var(--color-warning)' },
        { label: 'Overdue', value: 10, color: 'var(--color-danger)' },
      ]}
      size={120}
    />
  ),
};

export const SparklineChart: StoryObj = {
  render: () => <Sparkline data={[10, 25, 15, 30, 20, 35, 28, 40]} height={40} width={200} />,
};
