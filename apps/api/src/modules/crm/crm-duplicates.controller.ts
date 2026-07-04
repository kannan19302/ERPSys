import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmDuplicatesService,
  createDuplicateRuleSchema,
  updateDuplicateRuleSchema,
  mergePairSchema,
  CreateDuplicateRuleInput,
  UpdateDuplicateRuleInput,
  MergePairInput,
} from './crm-duplicates.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const findDuplicatesSchema = z.object({
  entity: z.enum(['leads', 'contacts', 'customers', 'accounts']),
  recordId: z.string().min(1),
});
type FindDuplicatesInput = z.infer<typeof findDuplicatesSchema>;

@ApiTags('crm-duplicates')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDuplicatesController {
  constructor(private readonly svc: CrmDuplicatesService) {}

  @Get('duplicate-rules')
  @Permissions('crm.duplicate-rules.read')
  async list(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.listRules(req.user.tenantId) };
  }

  @Get('duplicate-rules/:id')
  @Permissions('crm.duplicate-rules.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return { data: await this.svc.getRule(req.user.tenantId, id) };
  }

  @Post('duplicate-rules')
  @Permissions('crm.duplicate-rules.create')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createDuplicateRuleSchema) dto: CreateDuplicateRuleInput) {
    return { data: await this.svc.createRule(req.user.tenantId, dto) };
  }

  @Put('duplicate-rules/:id')
  @Permissions('crm.duplicate-rules.update')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateDuplicateRuleSchema) dto: UpdateDuplicateRuleInput) {
    return { data: await this.svc.updateRule(req.user.tenantId, id, dto) };
  }

  @Delete('duplicate-rules/:id')
  @Permissions('crm.duplicate-rules.delete')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return { data: await this.svc.deleteRule(req.user.tenantId, id) };
  }

  @Get('duplicates/scan')
  @Permissions('crm.duplicates.scan')
  @ApiOperation({ summary: 'Scan all records for an entity, group duplicates' })
  async scan(@Req() req: AuthenticatedRequest, @Query('entity') entity: 'leads' | 'contacts' | 'customers' | 'accounts') {
    return { data: await this.svc.scanEntity(req.user.tenantId, entity) };
  }

  @Post('duplicates/find')
  @Permissions('crm.duplicates.scan')
  async find(@Req() req: AuthenticatedRequest, @ZodBody(findDuplicatesSchema) dto: FindDuplicatesInput) {
    return { data: await this.svc.findDuplicates(req.user.tenantId, dto.entity, dto.recordId) };
  }

  @Post('leads/merge')
  @Permissions('crm.duplicates.merge')
  async mergeLeads(@Req() req: AuthenticatedRequest, @ZodBody(mergePairSchema) dto: MergePairInput) {
    return { data: await this.svc.mergeLeads(req.user.tenantId, dto) };
  }

  @Post('contacts/merge')
  @Permissions('crm.duplicates.merge')
  async mergeContacts(@Req() req: AuthenticatedRequest, @ZodBody(mergePairSchema) dto: MergePairInput) {
    return { data: await this.svc.mergeContacts(req.user.tenantId, dto) };
  }

  @Post('customers/merge')
  @Permissions('crm.duplicates.merge')
  async mergeCustomers(@Req() req: AuthenticatedRequest, @ZodBody(mergePairSchema) dto: MergePairInput) {
    return { data: await this.svc.mergeAccounts(req.user.tenantId, dto) };
  }

  @Post('accounts/merge')
  @Permissions('crm.duplicates.merge')
  async mergeAccounts(@Req() req: AuthenticatedRequest, @ZodBody(mergePairSchema) dto: MergePairInput) {
    return { data: await this.svc.mergeAccounts(req.user.tenantId, dto) };
  }
}
