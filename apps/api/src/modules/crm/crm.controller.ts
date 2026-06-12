import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CrmService } from './crm.service';
import { CreateCustomerInput, CreateVendorInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  @Permissions('crm.contact.read')
  async getCustomers(@Req() req: AuthenticatedRequest): Promise<any> {
    const tenantId = req.user.tenantId;
    return this.crmService.getCustomers(tenantId);
  }

  @Post('customers')
  @Permissions('crm.contact.create')
  async createCustomer(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomerInput): Promise<any> {
    const tenantId = req.user.tenantId;
    const orgId = req.user.orgId || 'org-system-default';
    return this.crmService.createCustomer(tenantId, orgId, dto);
  }

  @Get('vendors')
  @Permissions('procurement.vendor.read')
  async getVendors(@Req() req: AuthenticatedRequest): Promise<any> {
    const tenantId = req.user.tenantId;
    return this.crmService.getVendors(tenantId);
  }

  @Post('vendors')
  @Permissions('procurement.vendor.create')
  async createVendor(@Req() req: AuthenticatedRequest, @Body() dto: CreateVendorInput): Promise<any> {
    const tenantId = req.user.tenantId;
    const orgId = req.user.orgId || 'org-system-default';
    return this.crmService.createVendor(tenantId, orgId, dto);
  }
}
