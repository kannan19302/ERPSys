// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req, Body } from "@nestjs/common";
import { Request } from "express";
import { z } from "zod";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DriveDeepService } from "./drive-deep.service";
import {
  shareFolderSchema, createTagSchema, updateTagSchema, assignTagsSchema, generateDownloadLinkSchema,
} from "./drive-deep.dtos";

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags("drive-deep")
@ApiBearerAuth()
@Controller("drive")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DriveDeepController {
  constructor(private readonly svc: DriveDeepService) {}

  // ── Folder Sharing ──

  @ApiOperation({ summary: "Share folder with user" })
  @Permissions("drive.folder.share")
  @Post("folders/:folderId/share")
  async shareFolder(@Req() req: AuthReq, @Param("folderId") folderId: string, @Body() body: z.infer<typeof shareFolderSchema>) {
    const parsed = shareFolderSchema.parse(body);
    return this.svc.shareFolder(req.user.tenantId, folderId, parsed.sharedWithUserId, parsed.permission);
  }

  @ApiOperation({ summary: "Remove folder share" })
  @Permissions("drive.folder.share")
  @Delete("folders/:folderId/shares/:shareId")
  async removeFolderShare(@Req() req: AuthReq, @Param("folderId") folderId: string, @Param("shareId") shareId: string) {
    return this.svc.removeFolderShare(req.user.tenantId, folderId, shareId);
  }

  @ApiOperation({ summary: "List folder shares" })
  @Permissions("drive.folder.read")
  @Get("folders/:folderId/shares")
  async getFolderShares(@Req() req: AuthReq, @Param("folderId") folderId: string) {
    return this.svc.getFolderShares(req.user.tenantId, folderId);
  }

  @ApiOperation({ summary: "Get items shared with me" })
  @Permissions("drive.folder.read")
  @Get("shared-with-me")
  async getSharedWithMe(@Req() req: AuthReq) {
    return this.svc.getSharedWithMe(req.user.tenantId, req.user.userId);
  }

  // ── File Preview ──

  @ApiOperation({ summary: "Get file preview metadata" })
  @Permissions("drive.file.read")
  @Get("files/:id/preview")
  async getFilePreview(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getFilePreview(req.user.tenantId, id);
  }

  // ── Trash / Restore ──

  @ApiOperation({ summary: "Trash a file (soft-delete)" })
  @Permissions("drive.file.delete")
  @Delete("files/:id/trash")
  async trashFile(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.trashFile(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: "List trash items" })
  @Permissions("drive.trash.read")
  @Get("trash")
  async getTrashItems(@Req() req: AuthReq) {
    return this.svc.getTrashItems(req.user.tenantId);
  }

  @ApiOperation({ summary: "Empty trash (permanent delete)" })
  @Permissions("drive.trash.delete")
  @Delete("trash/empty")
  async emptyTrash(@Req() req: AuthReq) {
    return this.svc.emptyTrash(req.user.tenantId);
  }

  @ApiOperation({ summary: "Auto-purge trash older than 30 days" })
  @Permissions("drive.trash.delete")
  @Post("trash/auto-purge")
  async autoPurgeTrash(@Req() req: AuthReq) {
    return this.svc.autoPurgeTrash(req.user.tenantId);
  }

  // ── Storage Usage Reports ──

  @ApiOperation({ summary: "Get storage usage summary" })
  @Permissions("drive.storage-quota.read")
  @Get("usage")
  async getStorageUsage(@Req() req: AuthReq) {
    return this.svc.getStorageUsage(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get storage usage by folder" })
  @Permissions("drive.storage-quota.read")
  @Get("usage/by-folder")
  async getStorageUsageByFolder(@Req() req: AuthReq, @Query("folderId") folderId?: string) {
    return this.svc.getStorageUsageByFolder(req.user.tenantId, folderId || undefined);
  }

  // ── File Tagging ──

  @ApiOperation({ summary: "List tags" })
  @Permissions("drive.tag.read")
  @Get("tags")
  async getTags(@Req() req: AuthReq) {
    return this.svc.getTags(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create tag" })
  @Permissions("drive.tag.create")
  @Post("tags")
  async createTag(@Req() req: AuthReq, @Body() body: z.infer<typeof createTagSchema>) {
    const parsed = createTagSchema.parse(body);
    return this.svc.createTag(req.user.tenantId, parsed);
  }

  @ApiOperation({ summary: "Update tag" })
  @Permissions("drive.tag.update")
  @Patch("tags/:id")
  async updateTag(@Req() req: AuthReq, @Param("id") id: string, @Body() body: z.infer<typeof updateTagSchema>) {
    const parsed = updateTagSchema.parse(body);
    return this.svc.updateTag(req.user.tenantId, id, parsed);
  }

  @ApiOperation({ summary: "Delete tag" })
  @Permissions("drive.tag.delete")
  @Delete("tags/:id")
  async deleteTag(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteTag(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Assign tags to file" })
  @Permissions("drive.tag.assign")
  @Post("files/:fileId/tags")
  async assignTags(@Req() req: AuthReq, @Param("fileId") fileId: string, @Body() body: z.infer<typeof assignTagsSchema>) {
    const parsed = assignTagsSchema.parse(body);
    return this.svc.assignTags(req.user.tenantId, fileId, parsed.tagIds);
  }

  @ApiOperation({ summary: "Get tags for a file" })
  @Permissions("drive.tag.read")
  @Get("files/:fileId/tags")
  async getFileTags(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.getFileTags(req.user.tenantId, fileId);
  }

  @ApiOperation({ summary: "Get files by tag name" })
  @Permissions("drive.file.read")
  @Get("files/by-tag/:tagName")
  async getFilesByTag(@Req() req: AuthReq, @Param("tagName") tagName: string) {
    return this.svc.getFilesByTag(req.user.tenantId, tagName);
  }

  // ── Direct Download Links ──

  @ApiOperation({ summary: "Generate expiring download link" })
  @Permissions("drive.share-link.create")
  @Post("files/:id/download-link")
  async generateDownloadLink(@Req() req: AuthReq, @Param("id") id: string, @Body() body: z.infer<typeof generateDownloadLinkSchema>) {
    const parsed = generateDownloadLinkSchema.parse(body);
    return this.svc.generateDownloadLink(req.user.tenantId, id, parsed.expiresInHours);
  }

  @ApiOperation({ summary: "Resolve download token" })
  @Permissions("drive.file.read")
  @Get("download/:token")
  async resolveDownloadToken(@Param("token") token: string) {
    return this.svc.resolveDownloadToken(token);
  }
}
