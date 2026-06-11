import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DocumentsService } from './documents.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('documents')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('folders')
  @Permissions('documents.folder.read')
  async getFolders(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getFolders(req.user.tenantId);
  }

  @Post('folders')
  @Permissions('documents.folder.create')
  async createFolder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; parentId?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.documentsService.createFolder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Get()
  @Permissions('documents.document.read')
  async getDocuments(@Req() req: AuthenticatedRequest, @Query('folderId') folderId?: string) {
    return this.documentsService.getDocuments(req.user.tenantId, folderId);
  }

  @Post()
  @Permissions('documents.document.create')
  async createDocument(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; folderId?: string; templateId?: string; fileUrl?: string; fileSize?: number }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.documentsService.createDocument(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Post(':id/versions')
  @Permissions('documents.document.create')
  async addVersion(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { fileUrl: string; fileSize: number }
  ) {
    return this.documentsService.addVersion(req.user.tenantId, id, dto, req.user.userId || 'system');
  }

  @Get('templates')
  @Permissions('documents.template.read')
  async getTemplates(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getTemplates(req.user.tenantId);
  }

  @Post('templates')
  @Permissions('documents.template.create')
  async createTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; content: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.documentsService.createTemplate(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Post(':id/signatures/request')
  @Permissions('documents.signature.create')
  async requestSignature(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { signerEmail: string }
  ) {
    return this.documentsService.requestSignature(req.user.tenantId, id, dto);
  }

  @Post(':id/signatures/:signatureId/sign')
  @Permissions('documents.signature.create')
  async signDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('signatureId') signatureId: string,
    @Body() dto: { signatureData: string }
  ) {
    const ipAddress = req.ip || '127.0.0.1';
    return this.documentsService.signDocument(req.user.tenantId, id, signatureId, { ...dto, ipAddress });
  }
}
