import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatCardRow } from '../stat-card-row';
import { ListPageTemplate } from '../list-page-template';
import { DetailPageTemplate } from '../detail-page-template';

describe('StatCardRow', () => {
  it('renders stat labels and values', () => {
    render(
      <StatCardRow
        stats={[
          { label: 'Products', value: 42 },
          { label: 'Users', value: '1.2K' },
        ]}
      />
    );
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(
      <StatCardRow stats={[{ label: 'Revenue', value: 0, loading: true }]} />
    );
    // Skeleton renders an aria-hidden span; no numeric value shown
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});

describe('ListPageTemplate', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
  ];
  const data = [
    { name: 'Alice', role: 'Admin' },
    { name: 'Bob', role: 'Member' },
  ];

  it('renders column headers and rows', () => {
    render(<ListPageTemplate title="Users" columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('fires onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <ListPageTemplate title="Users" columns={columns} data={data} onRowClick={onRowClick} />
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith({ name: 'Alice', role: 'Admin' });
  });

  it('shows empty state when data is empty', () => {
    render(
      <ListPageTemplate
        title="Users"
        columns={columns}
        data={[]}
        emptyTitle="Nothing here"
      />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('DetailPageTemplate', () => {
  const tabs = [
    { key: 'overview', label: 'Overview', content: <div>Overview panel</div> },
    { key: 'activity', label: 'Activity', count: 5, content: <div>Activity panel</div> },
  ];

  it('renders title and first tab panel', () => {
    render(<DetailPageTemplate title="Acme Corp" tabs={tabs} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Overview panel')).toBeInTheDocument();
  });

  it('switches tab on click', () => {
    render(<DetailPageTemplate title="Acme Corp" tabs={tabs} />);
    fireEvent.click(screen.getByRole('tab', { name: /Activity/i }));
    expect(screen.getByText('Activity panel')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<DetailPageTemplate title="X" tabs={tabs} onBack={onBack} backLabel="Go back" />);
    fireEvent.click(screen.getByText(/Go back/));
    expect(onBack).toHaveBeenCalled();
  });
});
