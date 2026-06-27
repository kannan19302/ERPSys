import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Delete, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DocumentsService } from './documents.service';
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

@ApiTags('documents')
@ApiBearerAuth()
@Controller('drive')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DriveController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'Get folders' })
  @Permissions('documents.read')
  @Get('folders')
  @Permissions('documents.folder.read')
  async getFolders(
    @Req() req: AuthenticatedRequest,
    @Query('parentId') parentId?: string,
    @Query('view') view?: string
  ) {
    return this.documentsService.getFolders(req.user.tenantId, parentId, view, req.user.userId);
  }

  @ApiOperation({ summary: 'Create folder' })
  @Permissions('documents.create')
  @Post('folders')
  @Permissions('documents.folder.create')
  async createFolder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; parentId?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.documentsService.createFolder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Toggle folder starred' })
  @Permissions('documents.create')
  @Post('folders/:id/star')
  @Permissions('documents.folder.create')
  async toggleFolderStarred(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.toggleFolderStarred(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Share folder' })
  @Permissions('documents.create')
  @Post('folders/:id/share')
  @Permissions('documents.folder.create')
  async shareFolder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { userId: string; role: string; password?: string; expiresAt?: string }
  ) {
    return this.documentsService.shareFolder(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Toggle folder legal hold' })
  @Permissions('documents.create')
  @Post('folders/:id/legal-hold')
  @Permissions('documents.folder.create')
  async toggleFolderLegalHold(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.toggleFolderLegalHold(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Trash folder' })
  @Permissions('documents.delete')
  @Delete('folders/:id')
  @Permissions('documents.folder.create')
  async trashFolder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.trashFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Restore folder' })
  @Permissions('documents.create')
  @Post('folders/:id/restore')
  @Permissions('documents.folder.create')
  async restoreFolder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.restoreFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Permanently delete folder' })
  @Permissions('documents.delete')
  @Delete('folders/:id/permanent')
  @Permissions('documents.folder.create')
  async permanentlyDeleteFolder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.permanentlyDeleteFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get documents' })
  @Permissions('documents.read')
  @Get('documents')
  @Permissions('documents.document.read')
  async getDocuments(
    @Req() req: AuthenticatedRequest,
    @Query('folderId') folderId?: string,
    @Query('view') view?: string
  ) {
    return this.documentsService.getDocuments(req.user.tenantId, folderId, view, req.user.userId);
  }

  @ApiOperation({ summary: 'Create document' })
  @Permissions('documents.create')
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('documents.document.create')
  async createDocument(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('folderId') folderId?: string,
    @Body('templateId') templateId?: string
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.documentsService.createDocument(
      req.user.tenantId,
      orgId,
      { name: name || (file ? file.originalname : 'Unnamed Document'), folderId, templateId },
      req.user.userId || 'system',
      file
    );
  }

  @ApiOperation({ summary: 'Toggle document starred' })
  @Permissions('documents.create')
  @Post('documents/:id/star')
  @Permissions('documents.document.create')
  async toggleDocumentStarred(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.toggleDocumentStarred(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Share document' })
  @Permissions('documents.create')
  @Post('documents/:id/share')
  @Permissions('documents.document.create')
  async shareDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { userId: string; role: string; password?: string; expiresAt?: string }
  ) {
    return this.documentsService.shareDocument(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Toggle document legal hold' })
  @Permissions('documents.create')
  @Post('documents/:id/legal-hold')
  @Permissions('documents.document.create')
  async toggleDocumentLegalHold(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.toggleDocumentLegalHold(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add version' })
  @Permissions('documents.create')
  @Post('documents/:id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('documents.document.create')
  async addVersion(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.documentsService.addVersion(req.user.tenantId, id, req.user.userId || 'system', file);
  }

  @ApiOperation({ summary: 'Download version' })
  @Permissions('documents.read')
  @Get('documents/versions/:versionId/download')
  @Permissions('documents.document.read')
  async downloadVersion(
    @Req() req: AuthenticatedRequest,
    @Param('versionId') versionId: string,
    @Res() res: Response
  ) {
    const fileData = await this.documentsService.downloadVersion(req.user.tenantId, versionId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.filename)}"`);
    res.send(fileData.buffer);
  }

  @ApiOperation({ summary: 'Trash document' })
  @Permissions('documents.delete')
  @Delete('documents/:id')
  @Permissions('documents.document.create')
  async trashDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.trashDocument(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Restore document' })
  @Permissions('documents.create')
  @Post('documents/:id/restore')
  @Permissions('documents.document.create')
  async restoreDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.restoreDocument(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Permanently delete document' })
  @Permissions('documents.delete')
  @Delete('documents/:id/permanent')
  @Permissions('documents.document.create')
  async permanentlyDeleteDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.documentsService.permanentlyDeleteDocument(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get usage' })
  @Permissions('documents.read')
  @Get('usage')
  @Permissions('documents.document.read')
  async getUsage(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getUsage(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Search' })
  @Permissions('documents.read')
  @Get('search')
  @Permissions('documents.document.read')
  async search(@Req() req: AuthenticatedRequest, @Query('q') query: string) {
    return this.documentsService.search(req.user.tenantId, query);
  }

  @ApiOperation({ summary: 'Get users' })
  @Permissions('documents.read')
  @Get('users')
  @Permissions('documents.document.read')
  async getUsers(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getUsers(req.user.tenantId);
  }
}
