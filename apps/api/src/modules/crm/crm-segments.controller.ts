import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmSegmentsService,
  createSegmentSchema,
  updateSegmentSchema,
  CreateSegmentInput,
  UpdateSegmentInput,
} from './crm-segments.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-segments')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSegmentsController {
  constructor(private readonly svc: CrmSegmentsService) {}

  @Get('segments')
  @Permissions('crm.segments.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.svc.listSegments(req.user.tenantId);
  }

  @Get('segments/:id')
  @Permissions('crm.segments.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getSegment(req.user.tenantId, id);
  }

  @Post('segments')
  @Permissions('crm.segments.create')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createSegmentSchema) dto: CreateSegmentInput) {
    return this.svc.createSegment(req.user.tenantId, dto);
  }

  @Put('segments/:id')
  @Permissions('crm.segments.update')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateSegmentSchema) dto: UpdateSegmentInput) {
    return this.svc.updateSegment(req.user.tenantId, id, dto);
  }

  @Delete('segments/:id')
  @Permissions('crm.segments.delete')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteSegment(req.user.tenantId, id);
  }

  @Post('segments/:id/refresh')
  @Permissions('crm.segments.update')
  async refresh(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.evaluate(req.user.tenantId, id);
  }

  @Get('segments/:id/members')
  @Permissions('crm.segments.read')
  async members(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.listMembers(req.user.tenantId, id);
  }
}
