import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmSlaService,
  createSlaPolicySchema,
  updateSlaPolicySchema,
  CreateSlaPolicyInput,
  UpdateSlaPolicyInput,
} from './crm-sla.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-sla')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSlaController {
  constructor(private readonly svc: CrmSlaService) {}

  @Get('sla-policies')
  @Permissions('crm.sla-policies.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.svc.listPolicies(req.user.tenantId);
  }

  @Get('sla-policies/:id')
  @Permissions('crm.sla-policies.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getPolicy(req.user.tenantId, id);
  }

  @Post('sla-policies')
  @Permissions('crm.sla-policies.create')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createSlaPolicySchema) dto: CreateSlaPolicyInput) {
    return this.svc.createPolicy(req.user.tenantId, dto);
  }

  @Put('sla-policies/:id')
  @Permissions('crm.sla-policies.update')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateSlaPolicySchema) dto: UpdateSlaPolicyInput) {
    return this.svc.updatePolicy(req.user.tenantId, id, dto);
  }

  @Delete('sla-policies/:id')
  @Permissions('crm.sla-policies.delete')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deletePolicy(req.user.tenantId, id);
  }

  @Get('sla/breaches')
  @Permissions('crm.sla-policies.read')
  async breaches(@Req() req: AuthenticatedRequest) {
    return this.svc.listBreaches(req.user.tenantId);
  }

  @Post('sla/detect-breaches')
  @Permissions('crm.sla-policies.update')
  async detect(@Req() req: AuthenticatedRequest) {
    return this.svc.detectBreaches(req.user.tenantId);
  }
}
