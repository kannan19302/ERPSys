// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { z } from "zod";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DocumentsAdvancedService } from "./documents-advanced.service";
import {
  createAnnotationSchema,
  updateAnnotationSchema,
  createCommentSchema,
  updateCommentSchema,
  createTagSchema,
  updateTagSchema,
  assignTagsSchema,
  lockDocumentSchema,
  initiateWorkflowSchema,
  updateWorkflowStatusSchema,
  exportDocumentSchema,
  createSmartCollectionSchema,
  updateSmartCollectionSchema,
  watermarkDocumentSchema,
  mergeDocumentsSchema,
  splitDocumentSchema,
  batchOperationSchema,
} from "./documents-advanced.dtos";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string };
}

@ApiTags("documents-advanced")
@ApiBearerAuth()
@Controller("documents")
@UseGuards(JwtAuthGuard, RbacGuard)
export class DocumentsAdvancedController {
  constructor(private readonly svc: DocumentsAdvancedService) {}

  // ── Annotations ──
  @Get(":documentId/annotations")
  @Permissions("documents.annotation.read")
  @ApiOperation({ summary: "List document annotations" })
  async getAnnotations(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getAnnotations(req.user.tenantId, documentId);
  }

  @Post(":documentId/annotations")
  @Permissions("documents.annotation.create")
  @ApiOperation({ summary: "Create annotation" })
  async createAnnotation(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(createAnnotationSchema) body: any,
  ) {
    return this.svc.createAnnotation(
      req.user.tenantId,
      { ...body, documentId },
      req.user.userId,
    );
  }

  @Patch("annotations/:id")
  @Permissions("documents.annotation.update")
  @ApiOperation({ summary: "Update annotation" })
  async updateAnnotation(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateAnnotationSchema) body: any,
  ) {
    return this.svc.updateAnnotation(req.user.tenantId, id, body);
  }

  @Delete("annotations/:id")
  @Permissions("documents.annotation.delete")
  @ApiOperation({ summary: "Delete annotation" })
  async deleteAnnotation(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteAnnotation(req.user.tenantId, id);
  }

  // ── Comments ──
  @Get(":documentId/comments")
  @Permissions("documents.comment.read")
  @ApiOperation({ summary: "List document comments" })
  async getComments(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getComments(req.user.tenantId, documentId);
  }

  @Post(":documentId/comments")
  @Permissions("documents.comment.create")
  @ApiOperation({ summary: "Create comment" })
  async createComment(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(createCommentSchema) body: any,
  ) {
    return this.svc.createComment(
      req.user.tenantId,
      { ...body, documentId },
      req.user.userId,
    );
  }

  @Patch("comments/:id")
  @Permissions("documents.comment.update")
  @ApiOperation({ summary: "Update comment" })
  async updateComment(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateCommentSchema) body: any,
  ) {
    return this.svc.updateComment(req.user.tenantId, id, body, req.user.userId);
  }

  @Delete("comments/:id")
  @Permissions("documents.comment.delete")
  @ApiOperation({ summary: "Delete comment" })
  async deleteComment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteComment(req.user.tenantId, id);
  }

  // ── Tags ──
  @Get("tags")
  @Permissions("documents.tag.read")
  @ApiOperation({ summary: "List all tags" })
  async getTags(@Req() req: AuthReq) {
    return this.svc.getTags(req.user.tenantId);
  }

  @Post("tags")
  @Permissions("documents.tag.create")
  @ApiOperation({ summary: "Create tag" })
  async createTag(@Req() req: AuthReq, @ZodBody(createTagSchema) body: any) {
    return this.svc.createTag(req.user.tenantId, body, req.user.userId);
  }

  @Patch("tags/:id")
  @Permissions("documents.tag.update")
  @ApiOperation({ summary: "Update tag" })
  async updateTag(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateTagSchema) body: any,
  ) {
    return this.svc.updateTag(req.user.tenantId, id, body);
  }

  @Delete("tags/:id")
  @Permissions("documents.tag.delete")
  @ApiOperation({ summary: "Delete tag" })
  async deleteTag(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteTag(req.user.tenantId, id);
  }

  @Post(":documentId/tags")
  @Permissions("documents.tag.assign")
  @ApiOperation({ summary: "Assign tags to document" })
  async assignTags(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(assignTagsSchema) body: any,
  ) {
    return this.svc.assignTags(req.user.tenantId, documentId, body.tagIds);
  }

  @Get(":documentId/tags")
  @Permissions("documents.tag.read")
  @ApiOperation({ summary: "Get tags for document" })
  async getDocumentTags(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getDocumentTags(req.user.tenantId, documentId);
  }

  // ── Locking ──
  @Post(":documentId/lock")
  @Permissions("documents.lock.manage")
  @ApiOperation({ summary: "Lock document" })
  async lockDocument(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(lockDocumentSchema) body: any,
  ) {
    return this.svc.lockDocument(
      req.user.tenantId,
      documentId,
      body,
      req.user.userId,
    );
  }

  @Delete(":documentId/lock")
  @Permissions("documents.lock.manage")
  @ApiOperation({ summary: "Unlock document" })
  async unlockDocument(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.unlockDocument(req.user.tenantId, documentId);
  }

  @Get(":documentId/lock")
  @Permissions("documents.lock.manage")
  @ApiOperation({ summary: "Get lock status" })
  async getLockStatus(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getLockStatus(req.user.tenantId, documentId);
  }

  // ── Document Workflows ──
  @Get(":documentId/workflows")
  @Permissions("documents.workflow.read")
  @ApiOperation({ summary: "Get document workflows" })
  async getDocumentWorkflows(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getDocumentWorkflows(req.user.tenantId, documentId);
  }

  @Post(":documentId/workflows")
  @Permissions("documents.workflow.create")
  @ApiOperation({ summary: "Initiate document workflow" })
  async initiateWorkflow(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(initiateWorkflowSchema) body: any,
  ) {
    return this.svc.initiateWorkflow(
      req.user.tenantId,
      documentId,
      body.workflowId,
      req.user.userId,
    );
  }

  @Patch("workflows/:id")
  @Permissions("documents.workflow.manage")
  @ApiOperation({ summary: "Update workflow status" })
  async updateWorkflowStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateWorkflowStatusSchema) body: any,
  ) {
    return this.svc.updateWorkflowStatus(req.user.tenantId, id, body.status);
  }

  // ── Export ──
  @Get(":documentId/exports")
  @Permissions("documents.export.read")
  @ApiOperation({ summary: "Get document exports" })
  async getExports(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.getExports(req.user.tenantId, documentId);
  }

  @Post(":documentId/exports")
  @Permissions("documents.export.create")
  @ApiOperation({ summary: "Export document" })
  async exportDocument(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(exportDocumentSchema) body: any,
  ) {
    return this.svc.exportDocument(
      req.user.tenantId,
      documentId,
      body.format,
      req.user.userId,
    );
  }

  // ── Audit Log ──
  @Get(":documentId/audit")
  @Permissions("documents.audit.read")
  @ApiOperation({ summary: "Get document audit log" })
  async getAuditLogs(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @Query("action") action?: string,
  ) {
    return this.svc.getAuditLogs(req.user.tenantId, documentId, action);
  }

  // ── Smart Collections ──
  @Get("smart-collections")
  @Permissions("documents.smart-collection.read")
  @ApiOperation({ summary: "List smart collections" })
  async getSmartCollections(@Req() req: AuthReq) {
    return this.svc.getSmartCollections(req.user.tenantId);
  }

  @Post("smart-collections")
  @Permissions("documents.smart-collection.create")
  @ApiOperation({ summary: "Create smart collection" })
  async createSmartCollection(
    @Req() req: AuthReq,
    @ZodBody(createSmartCollectionSchema) body: any,
  ) {
    return this.svc.createSmartCollection(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Patch("smart-collections/:id")
  @Permissions("documents.smart-collection.update")
  @ApiOperation({ summary: "Update smart collection" })
  async updateSmartCollection(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateSmartCollectionSchema) body: any,
  ) {
    return this.svc.updateSmartCollection(req.user.tenantId, id, body);
  }

  @Delete("smart-collections/:id")
  @Permissions("documents.smart-collection.delete")
  @ApiOperation({ summary: "Delete smart collection" })
  async deleteSmartCollection(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSmartCollection(req.user.tenantId, id);
  }

  // ── Favorites ──
  @Post(":documentId/favorite")
  @Permissions("documents.favorite.manage")
  @ApiOperation({ summary: "Toggle favorite" })
  async toggleFavorite(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.toggleFavorite(
      req.user.tenantId,
      documentId,
      req.user.userId,
    );
  }

  @Get("favorites")
  @Permissions("documents.favorite.manage")
  @ApiOperation({ summary: "Get favorites" })
  async getFavorites(@Req() req: AuthReq) {
    return this.svc.getFavorites(req.user.tenantId, req.user.userId);
  }

  // ── Recent Items ──
  @Post(":documentId/recent")
  @Permissions("documents.recent.read")
  @ApiOperation({ summary: "Track recent view" })
  async trackRecent(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.trackRecent(req.user.tenantId, documentId, req.user.userId);
  }

  @Get("recent")
  @Permissions("documents.recent.read")
  @ApiOperation({ summary: "Get recent items" })
  async getRecentItems(@Req() req: AuthReq) {
    return this.svc.getRecentItems(req.user.tenantId, req.user.userId);
  }

  // ── Watermark ──
  @Post(":documentId/watermark")
  @Permissions("documents.watermark.manage")
  @ApiOperation({ summary: "Set watermark" })
  async setWatermark(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(watermarkDocumentSchema) body: any,
  ) {
    return this.svc.setWatermark(
      req.user.tenantId,
      documentId,
      body,
      req.user.userId,
    );
  }

  @Delete(":documentId/watermark")
  @Permissions("documents.watermark.manage")
  @ApiOperation({ summary: "Remove watermark" })
  async removeWatermark(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.removeWatermark(req.user.tenantId, documentId);
  }

  // ── Merge / Split ──
  @Post("merge")
  @Permissions("documents.merge.create")
  @ApiOperation({ summary: "Merge documents" })
  async mergeDocuments(
    @Req() req: AuthReq,
    @ZodBody(mergeDocumentsSchema) body: any,
  ) {
    return this.svc.mergeDocuments(
      req.user.tenantId,
      body.documentIds,
      body.outputName,
      req.user.userId,
    );
  }

  @Post(":documentId/split")
  @Permissions("documents.split.create")
  @ApiOperation({ summary: "Split document" })
  async splitDocument(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @ZodBody(splitDocumentSchema) body: any,
  ) {
    return this.svc.splitDocument(
      req.user.tenantId,
      documentId,
      body.pageRanges,
      req.user.userId,
    );
  }

  // ── Preview ──
  @Get(":documentId/preview")
  @Permissions("documents.preview.read")
  @ApiOperation({ summary: "Preview document" })
  async previewDocument(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
  ) {
    return this.svc.previewDocument(req.user.tenantId, documentId);
  }

  // ── Analytics ──
  @Get("analytics")
  @Permissions("documents.analytics.read")
  @ApiOperation({ summary: "Get document analytics" })
  async getAnalytics(@Req() req: AuthReq) {
    return this.svc.getAnalytics(req.user.tenantId);
  }

  // ── Batch Operations ──
  @Post("batch")
  @Permissions("documents.batch.manage")
  @ApiOperation({ summary: "Batch document operations" })
  async batchOperation(
    @Req() req: AuthReq,
    @ZodBody(batchOperationSchema) body: any,
  ) {
    return this.svc.batchOperation(
      req.user.tenantId,
      body.documentIds,
      body.operation,
      body.params || {},
      req.user.userId,
    );
  }
}
