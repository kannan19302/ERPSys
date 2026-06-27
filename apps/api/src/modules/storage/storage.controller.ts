import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StorageService } from './storage.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, RbacGuard)
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @ApiOperation({ summary: 'Get files' })
  @Permissions('storage.read')
  @Get('files')
  @Permissions('documents.document.read')
  async getFiles(@Req() req: AuthenticatedRequest) {
    return this.service.getFiles(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Register file' })
  @Permissions('storage.create')
  @Post('files')
  @Permissions('documents.document.create')
  async registerFile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; bucket: string; fileKey: string; size: number; mimeType: string }
  ) {
    const userId = req.user.userId || 'system';
    return this.service.registerFile(req.user.tenantId, dto, userId);
  }

  @ApiOperation({ summary: 'Get generated documents' })
  @Permissions('storage.read')
  @Get('generated')
  @Permissions('documents.document.read')
  async getGeneratedDocuments(@Req() req: AuthenticatedRequest) {
    return this.service.getGeneratedDocuments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Generate document' })
  @Permissions('storage.create')
  @Post('generate')
  @Permissions('documents.document.create')
  async generateDocument(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { documentId: string; templateId: string; format?: string }
  ) {
    return this.service.generateDocument(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Generate presigned url' })
  @Permissions('storage.create')
  @Post('presigned')
  @Permissions('documents.document.read')
  async generatePresignedUrl(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { fileId: string; expiresSeconds: number }
  ) {
    return this.service.generatePresignedUrl(req.user.tenantId, dto.fileId, dto.expiresSeconds);
  }

  @ApiOperation({ summary: 'Update lifecycle policy' })
  @Permissions('storage.create')
  @Post('lifecycle')
  @Permissions('documents.document.create')
  async updateLifecyclePolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { glacierAfterDays: number; purgeAfterDays: number }
  ) {
    return this.service.updateLifecyclePolicy(req.user.tenantId, dto);
  }
}
