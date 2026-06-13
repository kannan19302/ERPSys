import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '../projects.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    timesheet: {
      create: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(() => {
    service = new ProjectsService();
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should return all projects in a tenant', async () => {
      const mockProjects = [
        { id: 'p-1', name: 'Test Project', code: 'PRJ-1', status: 'ACTIVE' },
      ];
      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as never);

      const result = await service.getProjects('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('PRJ-1');
    });
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.project.create).mockResolvedValue({ id: 'p-1', name: 'New Project', code: 'PRJ-NEW' } as never);

      const dto = { name: 'New Project', code: 'PRJ-NEW' };
      const result = await service.createProject('tenant-1', 'org-1', dto, 'user-1');
      
      expect(result).toBeDefined();
      expect(result.code).toBe('PRJ-NEW');
    });
  });
});
