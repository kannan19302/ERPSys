import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import {
  CrmContractsService,
  createContractSchema,
  updateContractSchema,
  contractStatusSchema,
  renewContractSchema,
  CreateContractInput,
  UpdateContractInput,
  ContractStatusInput,
  RenewContractInput,
} from './crm-contracts.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-contracts')
@ApiBearerAuth()
@Controller('crm/contracts')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractsController {
  constructor(private readonly svc: CrmContractsService) {}

  @ApiOperation({ summary: 'List contracts (paginated, searchable, sortable)' })
  @Get()
  @Permissions('crm.contracts.read')
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.svc.getContracts(req.user.tenantId, {
      status,
      type,
      customerId,
      vendorId,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @ApiOperation({ summary: 'Contract KPI stats (active/expiring-soon/expired/total value)' })
  @Get('stats')
  @Permissions('crm.contracts.read')
  async stats(@Req() req: AuthenticatedRequest) {
    return this.svc.getStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Scan and auto-transition contracts nearing renewal/expiry' })
  @Post('scan-renewals')
  @Permissions('crm.contracts.update')
  async scanRenewals(@Req() req: AuthenticatedRequest) {
    return this.svc.scanRenewals(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get contract by ID' })
  @Get(':id')
  @Permissions('crm.contracts.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getContractById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create contract' })
  @Post()
  @Permissions('crm.contracts.create')
  @TrackChanges('Contract')
  @UseInterceptors(ChangeHistoryInterceptor)
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createContractSchema) dto: CreateContractInput) {
    return this.svc.createContract(req.user.tenantId, req.user.orgId || '', dto);
  }

  @ApiOperation({ summary: 'Update contract' })
  @Put(':id')
  @Permissions('crm.contracts.update')
  @TrackChanges('Contract')
  @UseInterceptors(ChangeHistoryInterceptor)
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateContractSchema) dto: UpdateContractInput) {
    return this.svc.updateContract(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Change contract status' })
  @Patch(':id/status')
  @Permissions('crm.contracts.update')
  @TrackChanges('Contract')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(contractStatusSchema) dto: ContractStatusInput) {
    return this.svc.updateStatus(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Renew contract (extend in place or create a follow-on contract)' })
  @Post(':id/renew')
  @Permissions('crm.contracts.update')
  @TrackChanges('Contract')
  @UseInterceptors(ChangeHistoryInterceptor)
  async renew(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(renewContractSchema) dto: RenewContractInput) {
    return this.svc.renewContract(req.user.tenantId, req.user.orgId || '', id, dto);
  }

  @ApiOperation({ summary: 'Delete contract (soft)' })
  @Delete(':id')
  @Permissions('crm.contracts.delete')
  @TrackChanges('Contract')
  @UseInterceptors(ChangeHistoryInterceptor)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteContract(req.user.tenantId, id);
  }
}
