import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { z } from 'zod';
import {
  createDriveFolderSchema,
  updateDriveFolderSchema,
  createDriveCommentSchema,
  createDriveShareLinkSchema,
  type CreateDriveFolderInput,
  type UpdateDriveFolderInput,
  type CreateDriveCommentInput,
  type CreateDriveShareLinkInput,
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { DriveService } from './drive.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('drive')
@ApiBearerAuth()
@Controller('drive')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DriveController {
  constructor(private readonly svc: DriveService) {}

  // ── Folders ──

  @ApiOperation({ summary: 'List folders' })
  @Permissions('drive.folder.read')
  @Get('folders')
  async getFolders(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '100', 10);
    return this.svc.getFolders(req.user.tenantId, { parentId: query.parentId || null, view: query.view, search: query.search, page, limit });
  }

  @ApiOperation({ summary: 'Get folder' })
  @Permissions('drive.folder.read')
  @Get('folders/:id')
  async getFolder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create folder' })
  @Permissions('drive.folder.create')
  @Post('folders')
  async createFolder(@Req() req: AuthReq, @ZodBody(createDriveFolderSchema) body: CreateDriveFolderInput) {
    const folder = await this.svc.createFolder(req.user.tenantId, req.user.userId, body);
    await this.svc.logActivity(req.user.tenantId, req.user.userId, 'CREATE_FOLDER', { type: 'FOLDER', id: folder.id, name: folder.name });
    return folder;
  }

  @ApiOperation({ summary: 'Update folder' })
  @Permissions('drive.folder.update')
  @Patch('folders/:id')
  async updateFolder(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateDriveFolderSchema) body: UpdateDriveFolderInput) {
    return this.svc.updateFolder(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete folder' })
  @Permissions('drive.folder.delete')
  @Delete('folders/:id')
  async deleteFolder(@Req() req: AuthReq, @Param('id') id: string) {
    await this.svc.deleteFolder(req.user.tenantId, id);
    await this.svc.logActivity(req.user.tenantId, req.user.userId, 'DELETE_FOLDER', { type: 'FOLDER', id });
    return { success: true };
  }

  @ApiOperation({ summary: 'Restore folder' })
  @Permissions('drive.folder.restore')
  @Post('folders/:id/restore')
  async restoreFolder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.restoreFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Star folder' })
  @Permissions('drive.folder.star')
  @Post('folders/:id/star')
  async starFolder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.starFolder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Permanent delete folder' })
  @Permissions('drive.folder.delete')
  @Delete('folders/:id/permanent')
  async permanentDeleteFolder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.permanentDeleteFolder(req.user.tenantId, id);
  }

  // ── Files ──

  @ApiOperation({ summary: 'List files' })
  @Permissions('drive.file.read')
  @Get('files')
  async getFiles(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '100', 10);
    return this.svc.getFiles(req.user.tenantId, { folderId: query.folderId || null, view: query.view, search: query.search, page, limit });
  }

  @ApiOperation({ summary: 'Get file' })
  @Permissions('drive.file.read')
  @Get('files/:id')
  async getFile(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getFile(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Upload file' })
  @Permissions('drive.file.create')
  @Post('files')
  async createFile(@Req() req: AuthReq, @ZodBody(z.object({
    folderId: z.string().optional(),
    name: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().positive(),
    storagePath: z.string().min(1),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })) body: { folderId?: string; name: string; mimeType: string; size: number; storagePath: string; description?: string; metadata?: Record<string, unknown> }) {
    const file = await this.svc.createFile(req.user.tenantId, req.user.userId, body);
    await this.svc.logActivity(req.user.tenantId, req.user.userId, 'UPLOAD_FILE', { type: 'FILE', id: file.id, name: file.name });
    return file;
  }

  @ApiOperation({ summary: 'Update file' })
  @Permissions('drive.file.update')
  @Patch('files/:id')
  async updateFile(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isStarred: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })) body: { name?: string; description?: string; isStarred?: boolean; metadata?: Record<string, unknown> }) {
    return this.svc.updateFile(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete file' })
  @Permissions('drive.file.delete')
  @Delete('files/:id')
  async deleteFile(@Req() req: AuthReq, @Param('id') id: string) {
    await this.svc.deleteFile(req.user.tenantId, id);
    await this.svc.logActivity(req.user.tenantId, req.user.userId, 'DELETE_FILE', { type: 'FILE', id });
    return { success: true };
  }

  @ApiOperation({ summary: 'Restore file' })
  @Permissions('drive.file.restore')
  @Post('files/:id/restore')
  async restoreFile(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.restoreFile(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Star file' })
  @Permissions('drive.file.star')
  @Post('files/:id/star')
  async starFile(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.starFile(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Permanent delete file' })
  @Permissions('drive.file.delete')
  @Delete('files/:id/permanent')
  async permanentDeleteFile(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.permanentDeleteFile(req.user.tenantId, id);
  }

  // ── File Versions ──

  @ApiOperation({ summary: 'Create file version' })
  @Permissions('drive.file-version.create')
  @Post('files/:fileId/versions')
  async createFileVersion(@Req() req: AuthReq, @Param('fileId') fileId: string, @ZodBody(z.object({
    size: z.number().int().positive(),
    storagePath: z.string().min(1),
    notes: z.string().optional(),
  })) body: { size: number; storagePath: string; notes?: string }) {
    return this.svc.createFileVersion(req.user.tenantId, fileId, req.user.userId, body);
  }

  // ── Comments ──

  @ApiOperation({ summary: 'Get file comments' })
  @Permissions('drive.comment.read')
  @Get('files/:fileId/comments')
  async getComments(@Req() req: AuthReq, @Param('fileId') fileId: string) {
    return this.svc.getComments(req.user.tenantId, fileId);
  }

  @ApiOperation({ summary: 'Create comment' })
  @Permissions('drive.comment.create')
  @Post('files/:fileId/comments')
  async createComment(@Req() req: AuthReq, @Param('fileId') fileId: string, @ZodBody(createDriveCommentSchema) body: CreateDriveCommentInput) {
    return this.svc.createComment(req.user.tenantId, req.user.userId, { ...body, fileId });
  }

  // ── Share Links ──

  @ApiOperation({ summary: 'Create share link' })
  @Permissions('drive.share-link.create')
  @Post('files/:fileId/share-links')
  async createShareLink(@Req() req: AuthReq, @Param('fileId') fileId: string, @ZodBody(createDriveShareLinkSchema) body: CreateDriveShareLinkInput) {
    return this.svc.createShareLink(req.user.tenantId, req.user.userId, { ...body, fileId });
  }

  // ── Storage Quota ──

  @ApiOperation({ summary: 'Get storage quota' })
  @Permissions('drive.storage-quota.read')
  @Get('storage-quota')
  async getStorageQuota(@Req() req: AuthReq) {
    return this.svc.getStorageQuota(req.user.tenantId);
  }

  // ── Activity ──

  @ApiOperation({ summary: 'Get recent activity' })
  @Permissions('drive.activity.read')
  @Get('activity')
  async getRecentActivity(@Req() req: AuthReq) {
    return this.svc.getRecentActivity(req.user.tenantId);
  }

  // ── Search ──

  @ApiOperation({ summary: 'Search drive' })
  @Permissions('drive.file.read')
  @Get('search')
  async search(@Req() req: AuthReq, @Query('q') query: string) {
    if (!query) return { folders: [], files: [] };
    return this.svc.search(req.user.tenantId, query);
  }
}
