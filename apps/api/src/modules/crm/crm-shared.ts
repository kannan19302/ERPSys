import { BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Resolve a usable orgId for a tenant. Callers may pass the sentinel
 * `org-system-default` (or nothing) when the org is implied by the tenant;
 * in that case we fall back to the tenant's first organization.
 *
 * Shared by the CRM domain services so org-resolution is defined once.
 */
export async function resolveOrgId(tenantId: string, orgId: string): Promise<string> {
  if (orgId && orgId !== 'org-system-default') return orgId;
  const org = await prisma.organization.findFirst({ where: { tenantId } });
  if (!org) throw new BadRequestException('No Organization registered in this tenant');
  return org.id;
}
