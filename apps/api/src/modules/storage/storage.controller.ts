import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StorageService } from './storage.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('storage')
@UseGuards(JwtAuthGuard, RbacGuard)
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Get('files')
  @Permissions('documents.document.read')
  async getFiles(@Req() req: AuthenticatedRequest) {
    return this.service.getFiles(req.user.tenantId);
  }

  @Post('files')
  @Permissions('documents.document.create')
  async registerFile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; bucket: string; fileKey: string; size: number; mimeType: string }
  ) {
    const userId = req.user.userId || 'system';
    return this.service.registerFile(req.user.tenantId, dto, userId);
  }

  @Get('generated')
  @Permissions('documents.document.read')
  async getGeneratedDocuments(@Req() req: AuthenticatedRequest) {
    return this.service.getGeneratedDocuments(req.user.tenantId);
  }

  @Post('generate')
  @Permissions('documents.document.create')
  async generateDocument(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { documentId: string; templateId: string; format?: string }
  ) {
    return this.service.generateDocument(req.user.tenantId, dto);
  }

  @Post('presigned')
  @Permissions('documents.document.read')
  async generatePresignedUrl(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { fileId: string; expiresSeconds: number }
  ) {
    return this.service.generatePresignedUrl(req.user.tenantId, dto.fileId, dto.expiresSeconds);
  }

  @Post('lifecycle')
  @Permissions('documents.document.create')
  async updateLifecyclePolicy(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { glacierAfterDays: number; purgeAfterDays: number }
  ) {
    return this.service.updateLifecyclePolicy(req.user.tenantId, dto);
  }
}
