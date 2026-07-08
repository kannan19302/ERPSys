import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { LeaseAccountingService } from './lease-accounting.service';

@Controller('finance/leases')
export class LeasesController {
  constructor(private readonly leaseService: LeaseAccountingService) {}

  @Get()
  async list(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.leaseService.getLeases(tenantId);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.leaseService.getLeaseById(tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const orgId = body.orgId || req.headers['x-org-id'];
    return this.leaseService.createLease(tenantId, orgId, body);
  }
}
