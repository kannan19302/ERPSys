import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '../projects.service';

vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
  },
}));

vi.mock('@unerp/database', () => ({
  prisma: {
    project: { findMany: vi.fn() },
    employee: { findMany: vi.fn() },
    timesheet: { findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('ProjectsService.getRevenueRecognition', () => {
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectsService();
  });

  it('recognizes revenue proportionally to elapsed time for an in-progress project', async () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 30); // started 30 days ago
    const end = new Date(now);
    end.setDate(now.getDate() + 30); // ends in 30 days (60-day total project)

    (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', name: 'Website Revamp', code: 'PRJ-1', status: 'ACTIVE', budget: 10000, startDate: start, endDate: end, customerId: 'cust-1' },
    ]);

    const [result] = await service.getRevenueRecognition(TENANT);

    // ~50% elapsed of a 60-day project -> ~50% of $10,000 recognized.
    expect(result.percentComplete).toBeGreaterThan(45);
    expect(result.percentComplete).toBeLessThan(55);
    expect(result.recognizedRevenue).toBeGreaterThan(4500);
    expect(result.recognizedRevenue).toBeLessThan(5500);
    expect(result.recognizedRevenue + result.remainingRevenue).toBeCloseTo(10000, 0);
    expect(result.reason).toBeNull();
  });

  it('recognizes 100% of budget for a COMPLETED project regardless of dates', async () => {
    (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', name: 'Done Project', code: 'PRJ-2', status: 'COMPLETED', budget: 5000, startDate: new Date('2020-01-01'), endDate: new Date('2020-02-01'), customerId: 'cust-1' },
    ]);

    const [result] = await service.getRevenueRecognition(TENANT);
    expect(result.percentComplete).toBe(100);
    expect(result.recognizedRevenue).toBe(5000);
    expect(result.remainingRevenue).toBe(0);
  });

  it('recognizes 0% for a CANCELLED project', async () => {
    (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', name: 'Scrapped', code: 'PRJ-3', status: 'CANCELLED', budget: 5000, startDate: new Date('2020-01-01'), endDate: new Date('2020-02-01'), customerId: null },
    ]);

    const [result] = await service.getRevenueRecognition(TENANT);
    expect(result.percentComplete).toBe(0);
    expect(result.recognizedRevenue).toBe(0);
    expect(result.remainingRevenue).toBe(5000);
  });

  it('never recognizes more than 100% for a project already past its end date but not marked COMPLETED', async () => {
    (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', name: 'Overdue', code: 'PRJ-4', status: 'ON_HOLD', budget: 8000, startDate: new Date('2020-01-01'), endDate: new Date('2020-02-01'), customerId: 'cust-1' },
    ]);

    const [result] = await service.getRevenueRecognition(TENANT);
    expect(result.percentComplete).toBe(100);
    expect(result.recognizedRevenue).toBe(8000);
  });

  it('reports a reason instead of a fabricated schedule when budget/dates are missing', async () => {
    (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', name: 'Unscoped', code: 'PRJ-5', status: 'PLANNED', budget: null, startDate: null, endDate: null, customerId: null },
    ]);

    const [result] = await service.getRevenueRecognition(TENANT);
    expect(result.percentComplete).toBeNull();
    expect(result.recognizedRevenue).toBe(0);
    expect(result.reason).toContain('Missing');
  });
});

describe('ProjectsService.getResourceWorkload — date-scoping regression', () => {
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectsService();
    (prisma.employee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace', department: { name: 'Engineering' } },
    ]);
  });

  it('only counts hours within the requested week, not an employee\'s entire history', async () => {
    // Regression: the original implementation summed EVERY timesheet ever
    // logged (no date filter) and divided by a single week's 40h capacity,
    // producing e.g. 1000%+ utilization for anyone with more than ~1 week
    // of history. Simulate exactly that: 6 months of 40h/week timesheets.
    const sixMonthsOfTimesheets = Array.from({ length: 26 }, (_, i) => ({
      employeeId: 'emp-1',
      hours: 40,
      date: new Date(2025, 0, 1 + i * 7),
    }));
    (prisma.timesheet.findMany as ReturnType<typeof vi.fn>).mockImplementation(({ where }: { where: { date: { gte: Date; lt: Date } } }) => {
      return Promise.resolve(
        sixMonthsOfTimesheets.filter((ts) => ts.date >= where.date.gte && ts.date < where.date.lt),
      );
    });

    const [result] = await service.getResourceWorkload(TENANT, '2025-01-01');

    expect(result.allocatedHours).toBe(40);
    expect(result.utilizationRate).toBe(100);
    expect(result.utilizationRate).toBeLessThanOrEqual(150);
  });

  it('defaults to the current week when no weekStart is given, and scopes the Prisma query by date', async () => {
    (prisma.timesheet.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await service.getResourceWorkload(TENANT);

    const call = (prisma.timesheet.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.tenantId).toBe(TENANT);
    expect(call.where.date.gte).toBeInstanceOf(Date);
    expect(call.where.date.lt).toBeInstanceOf(Date);
    const spanMs = call.where.date.lt.getTime() - call.where.date.gte.getTime();
    expect(spanMs).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
