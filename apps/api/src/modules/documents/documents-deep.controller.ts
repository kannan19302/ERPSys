// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req, Body } from "@nestjs/common";
import { Request } from "express";
import { z } from "zod";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DocumentsDeepService } from "./documents-deep.service";
import {
  createTemplateSchema, updateTemplateSchema, renderTemplateSchema,
  createCategorySchema, updateCategorySchema,
  bulkUploadSchema, submitApprovalSchema, reviewApprovalSchema,
} from "./documents-deep.dtos";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("documents-deep")
@ApiBearerAuth()
@Controller("documents")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DocumentsDeepController {
  constructor(private readonly svc: DocumentsDeepService) {}

  // ── Templates ──

  @ApiOperation({ summary: "List document templates" })
  @Permissions("documents.template.read")
  @Get("templates")
  async getTemplates(@Req() req: AuthReq) {
    return this.svc.getTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get template" })
  @Permissions("documents.template.read")
  @Get("templates/:id")
  async getTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create template" })
  @Permissions("documents.template.create")
  @Post("templates")
  async createTemplate(@Req() req: AuthReq, @Body() body: z.infer<typeof createTemplateSchema>) {
    const parsed = createTemplateSchema.parse(body);
    return this.svc.createTemplate(req.user.tenantId, req.user.orgId || "", parsed, req.user.userId);
  }

  @ApiOperation({ summary: "Update template" })
  @Permissions("documents.template.update")
  @Patch("templates/:id")
  async updateTemplate(@Req() req: AuthReq, @Param("id") id: string, @Body() body: z.infer<typeof updateTemplateSchema>) {
    const parsed = updateTemplateSchema.parse(body);
    return this.svc.updateTemplate(req.user.tenantId, id, parsed);
  }

  @ApiOperation({ summary: "Delete template" })
  @Permissions("documents.template.delete")
  @Delete("templates/:id")
  async deleteTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Render template with variable substitution" })
  @Permissions("documents.template.render")
  @Post("templates/render")
  async renderTemplate(@Req() req: AuthReq, @Body() body: z.infer<typeof renderTemplateSchema>) {
    const parsed = renderTemplateSchema.parse(body);
    return this.svc.renderTemplate(req.user.tenantId, parsed.templateId, parsed.values);
  }

  // ── Categories ──

  @ApiOperation({ summary: "List document categories (tree)" })
  @Permissions("documents.category.read")
  @Get("categories")
  async getCategories(@Req() req: AuthReq) {
    return this.svc.getCategories(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get category" })
  @Permissions("documents.category.read")
  @Get("categories/:id")
  async getCategory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getCategory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create category" })
  @Permissions("documents.category.create")
  @Post("categories")
  async createCategory(@Req() req: AuthReq, @Body() body: z.infer<typeof createCategorySchema>) {
    const parsed = createCategorySchema.parse(body);
    return this.svc.createCategory(req.user.tenantId, parsed);
  }

  @ApiOperation({ summary: "Update category" })
  @Permissions("documents.category.update")
  @Patch("categories/:id")
  async updateCategory(@Req() req: AuthReq, @Param("id") id: string, @Body() body: z.infer<typeof updateCategorySchema>) {
    const parsed = updateCategorySchema.parse(body);
    return this.svc.updateCategory(req.user.tenantId, id, parsed);
  }

  @ApiOperation({ summary: "Delete category" })
  @Permissions("documents.category.delete")
  @Delete("categories/:id")
  async deleteCategory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteCategory(req.user.tenantId, id);
  }

  // ── Bulk Upload ──

  @ApiOperation({ summary: "Bulk upload documents" })
  @Permissions("documents.document.bulk-upload")
  @Post("bulk-upload")
  async bulkUpload(@Req() req: AuthReq, @Body() body: z.infer<typeof bulkUploadSchema>) {
    const parsed = bulkUploadSchema.parse(body);
    return this.svc.bulkUpload(req.user.tenantId, req.user.orgId || "", parsed.files, req.user.userId);
  }

  // ── Approval Routing ──

  @ApiOperation({ summary: "Submit document for approval" })
  @Permissions("documents.approval.submit")
  @Post(":documentId/approvals")
  async submitForApproval(@Req() req: AuthReq, @Param("documentId") documentId: string, @Body() body: z.infer<typeof submitApprovalSchema>) {
    const parsed = submitApprovalSchema.parse(body);
    return this.svc.submitForApproval(req.user.tenantId, documentId, parsed.approverId);
  }

  @ApiOperation({ summary: "Get approvals for document" })
  @Permissions("documents.approval.read")
  @Get(":documentId/approvals")
  async getApprovals(@Req() req: AuthReq, @Param("documentId") documentId: string) {
    return this.svc.getApprovals(req.user.tenantId, documentId);
  }

  @ApiOperation({ summary: "List all approvals" })
  @Permissions("documents.approval.read")
  @Get("approvals")
  async getAllApprovals(@Req() req: AuthReq) {
    return this.svc.getApprovals(req.user.tenantId);
  }

  @ApiOperation({ summary: "Approve or reject approval" })
  @Permissions("documents.approval.review")
  @Patch("approvals/:approvalId")
  async approveOrReject(@Req() req: AuthReq, @Param("approvalId") approvalId: string, @Body() body: z.infer<typeof reviewApprovalSchema>) {
    const parsed = reviewApprovalSchema.parse(body);
    return this.svc.approveOrReject(req.user.tenantId, approvalId, parsed.status, parsed.comment);
  }

  @ApiOperation({ summary: "Get pending approvals for current user" })
  @Permissions("documents.approval.read")
  @Get("approvals/pending")
  async getPendingApprovals(@Req() req: AuthReq) {
    return this.svc.getPendingApprovals(req.user.tenantId, req.user.userId);
  }

  // ── OCR Placeholder ──

  @ApiOperation({ summary: "Process OCR on document (placeholder)" })
  @Permissions("documents.document.ocr")
  @Post(":documentId/ocr")
  async processOcr(@Req() req: AuthReq, @Param("documentId") documentId: string) {
    return this.svc.processOcr(req.user.tenantId, documentId);
  }

  // ── Version Diff Viewer ──

  @ApiOperation({ summary: "Compare two versions of a document" })
  @Permissions("documents.version.read")
  @Get(":documentId/versions/:v1/diff/:v2")
  async getVersionDiff(@Req() req: AuthReq, @Param("documentId") documentId: string, @Param("v1") v1: string, @Param("v2") v2: string) {
    return this.svc.getVersionDiff(req.user.tenantId, documentId, parseInt(v1, 10), parseInt(v2, 10));
  }

  @ApiOperation({ summary: "Get all versions for document" })
  @Permissions("documents.version.read")
  @Get(":documentId/versions")
  async getVersions(@Req() req: AuthReq, @Param("documentId") documentId: string) {
    return this.svc.getVersions(req.user.tenantId, documentId);
  }
}
