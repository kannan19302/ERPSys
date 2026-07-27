import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { StorageService } from "./storage.service";
import { StorageBucketsService } from "./storage-buckets.service";
import { StoragePoliciesService } from "./storage-policies.service";
import {
  createFolderSchema,
  updateFolderSchema,
  registerFileSchema,
  createShareLinkSchema,
  updateQuotaSchema,
  generateDocumentSchema,
  lifecyclePolicySchema,
} from "./storage.dtos";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const presignedUrlSchema = z.object({
  fileId: z.string().min(1),
  expiresSeconds: z.number().int().positive(),
});

@ApiTags("storage")
@ApiBearerAuth()
@Controller("storage")
@UseGuards(JwtAuthGuard, RbacGuard)
export class StorageController {
  constructor(
    private readonly service: StorageService,
    private readonly bucketsService: StorageBucketsService,
    private readonly policiesService: StoragePoliciesService,
  ) {}

  @Get("buckets")
  @Permissions("storage.quota.read")
  @ApiOperation({ summary: "List storage bucket configurations" })
  async getBuckets(@Req() req: AuthenticatedRequest) {
    return this.bucketsService.getBuckets(req.user.tenantId);
  }

  @Post("buckets")
  @Permissions("storage.quota.manage")
  @ApiOperation({ summary: "Create storage bucket configuration" })
  async createBucket(@Req() req: AuthenticatedRequest, @ZodBody() body: any) {
    return this.bucketsService.createBucket(req.user.tenantId, body);
  }

  @Get("access-policies")
  @Permissions("storage.quota.read")
  @ApiOperation({ summary: "List storage access policies" })
  async getAccessPolicies(
    @Req() req: AuthenticatedRequest,
    @Query("bucket") bucket?: string,
  ) {
    return this.policiesService.getAccessPolicies(req.user.tenantId, bucket);
  }

  @Get("folders")
  @Permissions("storage.folders.read")
  @ApiOperation({ summary: "List folders" })
  async getFolders(
    @Req() req: AuthenticatedRequest,
    @Query("parentId") parentId?: string,
  ) {
    return this.service.getFolders(req.user.tenantId, parentId);
  }

  @Post("folders")
  @Permissions("storage.folders.create")
  @ApiOperation({ summary: "Create folder" })
  async createFolder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFolderSchema) body: { name: string; parentId?: string },
  ) {
    return this.service.createFolder(req.user.tenantId, body, req.user.userId);
  }

  @Put("folders/:id")
  @Permissions("storage.folders.update")
  @ApiOperation({ summary: "Update folder" })
  async updateFolder(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateFolderSchema) body: { name?: string },
  ) {
    return this.service.updateFolder(req.user.tenantId, id, body);
  }

  @Delete("folders/:id")
  @Permissions("storage.folders.delete")
  @ApiOperation({ summary: "Delete folder" })
  async deleteFolder(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteFolder(req.user.tenantId, id);
  }

  @Get("files")
  @Permissions("storage.files.read")
  @ApiOperation({ summary: "List files" })
  async getFiles(
    @Req() req: AuthenticatedRequest,
    @Query("folderId") folderId?: string,
  ) {
    return this.service.getFiles(req.user.tenantId, folderId);
  }

  @Post("files")
  @Permissions("storage.files.create")
  @ApiOperation({ summary: "Register file" })
  async registerFile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(registerFileSchema)
    body: {
      name: string;
      folderId?: string;
      bucket: string;
      fileKey: string;
      size: number;
      mimeType: string;
    },
  ) {
    return this.service.registerFile(req.user.tenantId, body, req.user.userId);
  }

  @Delete("files/:id")
  @Permissions("storage.files.delete")
  @ApiOperation({ summary: "Delete file" })
  async deleteFile(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.deleteFile(req.user.tenantId, id);
  }

  @Get("versions/:fileId")
  @Permissions("storage.files.read")
  @ApiOperation({ summary: "Get file versions" })
  async getFileVersions(
    @Req() req: AuthenticatedRequest,
    @Param("fileId") fileId: string,
  ) {
    return this.service.getFileVersions(req.user.tenantId, fileId);
  }

  @Post("share")
  @Permissions("storage.share.create")
  @ApiOperation({ summary: "Create share link" })
  async createShareLink(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createShareLinkSchema)
    body: {
      fileId: string;
      permission?: string;
      expiresInHours?: number;
      maxDownloads?: number;
    },
  ) {
    return this.service.createShareLink(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Delete("share/:linkId")
  @Permissions("storage.share.delete")
  @ApiOperation({ summary: "Delete share link" })
  async deleteShareLink(
    @Req() req: AuthenticatedRequest,
    @Param("linkId") linkId: string,
  ) {
    return this.service.deleteShareLink(req.user.tenantId, linkId);
  }

  @Get("share")
  @Permissions("storage.share.read")
  @ApiOperation({ summary: "List share links" })
  async getShareLinks(@Req() req: AuthenticatedRequest) {
    return this.service.getShareLinks(req.user.tenantId);
  }

  @Get("quota")
  @Permissions("storage.quota.read")
  @ApiOperation({ summary: "Get storage quota" })
  async getQuota(@Req() req: AuthenticatedRequest) {
    return this.service.getQuota(req.user.tenantId);
  }

  @Put("quota")
  @Permissions("storage.quota.manage")
  @ApiOperation({ summary: "Update storage quota" })
  async updateQuota(
    @Req() req: AuthenticatedRequest,
    @ZodBody(updateQuotaSchema) body: { storageLimit?: number },
  ) {
    return this.service.updateQuota(req.user.tenantId, body);
  }

  @Post("presigned")
  @Permissions("storage.files.read")
  @ApiOperation({ summary: "Generate presigned URL" })
  async generatePresignedUrl(
    @Req() req: AuthenticatedRequest,
    @ZodBody(presignedUrlSchema)
    body: { fileId: string; expiresSeconds: number },
  ) {
    return this.service.generatePresignedUrl(
      req.user.tenantId,
      body.fileId,
      body.expiresSeconds,
    );
  }

  @Get("generated")
  @Permissions("storage.files.read")
  @ApiOperation({ summary: "List generated documents" })
  async getGeneratedDocuments(@Req() req: AuthenticatedRequest) {
    return this.service.getGeneratedDocuments(req.user.tenantId);
  }

  @Post("generate")
  @Permissions("storage.files.create")
  @ApiOperation({ summary: "Generate document from template" })
  async generateDocument(
    @Req() req: AuthenticatedRequest,
    @ZodBody(generateDocumentSchema)
    body: { documentId: string; templateId: string; format?: string },
  ) {
    return this.service.generateDocument(req.user.tenantId, body);
  }

  @Post("lifecycle")
  @Permissions("storage.files.create")
  @ApiOperation({ summary: "Update lifecycle policy" })
  async updateLifecyclePolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(lifecyclePolicySchema)
    body: { glacierAfterDays: number; purgeAfterDays: number },
  ) {
    return this.service.updateLifecyclePolicy(req.user.tenantId, body);
  }
}
