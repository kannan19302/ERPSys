import { Controller, Get, Post, Patch, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { SaasPortalDelegationService } from '../services/delegation.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
}

const createDelegationSchema = z.object({
  delegatorId: z.string().cuid(),
  delegateId: z.string().cuid(),
  type: z.string().min(1).max(100),
  workflowId: z.string().cuid().optional(),
  reason: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

// Only client-updatable fields — tenantId/delegatorId/delegateId are never
// accepted from the request body (mass-assignment / cross-tenant guard).
const updateDelegationSchema = z.object({
  type: z.string().min(1).max(100).optional(),
  workflowId: z.string().cuid().optional(),
  reason: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']).optional(),
});

/**
 * SaaS Portal home for delegation rules. Consolidates `/admin/delegations`
 * into `/saas-portal/delegations`. Independent implementation, not a
 * cross-module delegate (see services/delegation.service.ts header). Reuses
 * the existing `admin.delegations.*` permission codes.
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/delegations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalDelegationController {
  constructor(private readonly delegationService: SaasPortalDelegationService) {}

  @ApiOperation({ summary: 'List delegations' })
  @Get()
  @Permissions('admin.delegations.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.delegationService.list(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create delegation' })
  @Post()
  @Permissions('admin.delegations.create')
  async create(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDelegationSchema) body: z.infer<typeof createDelegationSchema>,
  ) {
    return this.delegationService.create(req.user.tenantId, req.user.userId, req.user.roles, body);
  }

  @ApiOperation({ summary: 'Update delegation' })
  @Patch(':id')
  @Permissions('admin.delegations.update')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateDelegationSchema) body: z.infer<typeof updateDelegationSchema>,
  ) {
    return this.delegationService.update(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Revoke delegation' })
  @Post(':id/revoke')
  @Permissions('admin.delegations.update')
  async revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.delegationService.revoke(req.user.tenantId, id);
  }
}
