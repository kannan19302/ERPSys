import { Controller, Get, Post, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { UseInterceptors } from '@nestjs/common';
import {
  CustomerPortalService,
  inviteCustomerPortalUserSchema,
  InviteCustomerPortalUserInput,
} from './customer-portal.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Tenant-admin management of the CRM customer self-service portal accounts.
 * Real portal-facing (customer-authenticated) endpoints live in
 * `CustomerPortalController` under `/portal/*`, guarded by
 * `CustomerPortalAuthGuard` instead of `RbacGuard`.
 */
@ApiTags('crm-customer-portal')
@ApiBearerAuth()
@Controller('crm/customers/:customerId/portal-users')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CustomerPortalAdminController {
  constructor(private readonly svc: CustomerPortalService) {}

  @ApiOperation({ summary: 'Invite a customer portal user' })
  @Permissions('crm.customer-portal.manage')
  @TrackChanges('CustomerPortalUser')
  @UseInterceptors(ChangeHistoryInterceptor)
  @Post()
  async invite(
    @Req() req: AuthenticatedRequest,
    @Param('customerId') customerId: string,
    @ZodBody(inviteCustomerPortalUserSchema) dto: InviteCustomerPortalUserInput,
  ) {
    return this.svc.inviteUser(req.user.tenantId, customerId, dto);
  }

  @ApiOperation({ summary: 'List customer portal users' })
  @Permissions('crm.customer-portal.manage')
  @Get()
  async list(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.svc.listUsers(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Disable a customer portal user' })
  @Permissions('crm.customer-portal.manage')
  @TrackChanges('CustomerPortalUser', 'userId')
  @UseInterceptors(ChangeHistoryInterceptor)
  @Patch(':userId/disable')
  async disable(@Req() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.svc.disableUser(req.user.tenantId, userId);
  }

  @ApiOperation({ summary: 'Reactivate a customer portal user' })
  @Permissions('crm.customer-portal.manage')
  @TrackChanges('CustomerPortalUser', 'userId')
  @UseInterceptors(ChangeHistoryInterceptor)
  @Patch(':userId/reactivate')
  async reactivate(@Req() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.svc.reactivateUser(req.user.tenantId, userId);
  }
}
