import {
  Controller, Get, Post, Param,
  UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/gdpr')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  /* ── Retention Policies ─────────────────────── */

  @ApiOperation({ summary: 'Get retention policies' })
  @Get('retention-policies')
  @Permissions('admin.setting.read')
  async getRetentionPolicies(@Req() req: AuthenticatedRequest) {
    return this.gdprService.getRetentionPolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Upsert retention policy' })
  @Post('retention-policies')
  @Permissions('admin.setting.read')
  async upsertRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { entityType: string; retentionDays: number; action: string; isActive: boolean },
  ) {
    return this.gdprService.upsertRetentionPolicy(req.user.tenantId, body);
  }

  /* ── Erasure Requests ───────────────────────── */

  @ApiOperation({ summary: 'Get erasure requests' })
  @Get('erasure-requests')
  @Permissions('admin.setting.read')
  async getErasureRequests(@Req() req: AuthenticatedRequest) {
    return this.gdprService.getErasureRequests(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create erasure request' })
  @Post('erasure-requests')
  @Permissions('admin.setting.read')
  async createErasureRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { subjectEmail: string; subjectName?: string; entityTypes: string[] },
  ) {
    return this.gdprService.createErasureRequest(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Execute erasure' })
  @Post('erasure-requests/:id/execute')
  @Permissions('admin.setting.read')
  async executeErasure(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.gdprService.executeErasure(req.user.tenantId, id);
  }

  /* ── Data Export (Right of Access) ──────────── */

  @ApiOperation({ summary: 'Export subject data' })
  @Post('data-export/:email')
  @Permissions('admin.setting.read')
  async exportSubjectData(
    @Req() req: AuthenticatedRequest,
    @Param('email') email: string,
  ) {
    return this.gdprService.exportSubjectData(req.user.tenantId, email);
  }
}
