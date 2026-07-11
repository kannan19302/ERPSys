import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmDealRoomService,
  createDealRoomSchema,
  CreateDealRoomInput,
  createMilestoneSchema,
  CreateMilestoneInput,
  updateMilestoneSchema,
  UpdateMilestoneInput,
  createStakeholderSchema,
  CreateStakeholderInput,
  createDocumentSchema,
  CreateDocumentInput,
} from './crm-deal-room.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Deal room / mutual action plan API (Up Next item 48, benchmark: DealHub,
 * Recapped, Salesforce Digital Sales Room). Seller-facing (authenticated)
 * endpoints — see `CrmDealRoomPublicController` for the buyer-facing view.
 */
@ApiTags('crm-deal-room')
@ApiBearerAuth()
@Controller('crm/deal-rooms')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDealRoomController {
  constructor(private readonly svc: CrmDealRoomService) {}

  @ApiOperation({ summary: 'Create a deal room for an opportunity' })
  @Post()
  @Permissions('crm.dealroom.create')
  @TrackChanges('DealRoom')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createDealRoomSchema) dto: CreateDealRoomInput) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.createDealRoom(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'List deal rooms' })
  @Get()
  @Permissions('crm.dealroom.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.svc.listDealRooms(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get one deal room with milestones/stakeholders/documents' })
  @Get(':id')
  @Permissions('crm.dealroom.read')
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getDealRoom(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get the deal room for a given opportunity (null if none exists)' })
  @Get('by-opportunity/:opportunityId')
  @Permissions('crm.dealroom.read')
  async getByOpportunity(@Req() req: AuthenticatedRequest, @Param('opportunityId') opportunityId: string) {
    return this.svc.getDealRoomByOpportunity(req.user.tenantId, opportunityId);
  }

  @ApiOperation({ summary: 'Archive a deal room' })
  @Put(':id/archive')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoom')
  async archive(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.archiveDealRoom(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add a mutual action plan milestone' })
  @Post(':id/milestones')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomMilestone')
  async addMilestone(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(createMilestoneSchema) dto: CreateMilestoneInput) {
    return this.svc.addMilestone(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update a milestone (status, owner, due date)' })
  @Put('milestones/:milestoneId')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomMilestone')
  async updateMilestone(@Req() req: AuthenticatedRequest, @Param('milestoneId') milestoneId: string, @ZodBody(updateMilestoneSchema) dto: UpdateMilestoneInput) {
    return this.svc.updateMilestone(req.user.tenantId, milestoneId, dto);
  }

  @ApiOperation({ summary: 'Delete a milestone' })
  @Delete('milestones/:milestoneId')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomMilestone')
  async deleteMilestone(@Req() req: AuthenticatedRequest, @Param('milestoneId') milestoneId: string) {
    return this.svc.deleteMilestone(req.user.tenantId, milestoneId);
  }

  @ApiOperation({ summary: 'Add a stakeholder to the deal room stakeholder map' })
  @Post(':id/stakeholders')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomStakeholder')
  async addStakeholder(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(createStakeholderSchema) dto: CreateStakeholderInput) {
    return this.svc.addStakeholder(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a stakeholder' })
  @Delete('stakeholders/:stakeholderId')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomStakeholder')
  async removeStakeholder(@Req() req: AuthenticatedRequest, @Param('stakeholderId') stakeholderId: string) {
    return this.svc.removeStakeholder(req.user.tenantId, stakeholderId);
  }

  @ApiOperation({ summary: 'Share a document into the deal room' })
  @Post(':id/documents')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomDocument')
  async addDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(createDocumentSchema) dto: CreateDocumentInput) {
    return this.svc.addDocument(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Remove a shared document' })
  @Delete('documents/:documentId')
  @Permissions('crm.dealroom.update')
  @TrackChanges('DealRoomDocument')
  async removeDocument(@Req() req: AuthenticatedRequest, @Param('documentId') documentId: string) {
    return this.svc.removeDocument(req.user.tenantId, documentId);
  }
}

/**
 * Buyer-facing (unauthenticated, token-gated) deal room view — mirrors the
 * `CrmQuoteSignaturePublicController` pattern: the token itself is the
 * credential, mounted under `/public/*` so the CSRF exemption applies.
 */
@ApiTags('crm-deal-room-public')
@Controller('public/deal-rooms')
export class CrmDealRoomPublicController {
  constructor(private readonly svc: CrmDealRoomService) {}

  @ApiOperation({ summary: 'Buyer: view the deal room via their access token' })
  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.svc.getByBuyerToken(token);
  }

  @ApiOperation({ summary: 'Buyer: mark a buyer/mutual-owned milestone complete' })
  @Post(':token/milestones/:milestoneId/complete')
  async completeMilestone(@Param('token') token: string, @Param('milestoneId') milestoneId: string) {
    return this.svc.buyerCompleteMilestone(token, milestoneId);
  }

  @ApiOperation({ summary: 'Buyer: record that a shared document was viewed' })
  @Post(':token/documents/:documentId/view')
  async viewDocument(@Param('token') token: string, @Param('documentId') documentId: string) {
    return this.svc.buyerViewDocument(token, documentId);
  }
}
