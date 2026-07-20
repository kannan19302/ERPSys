import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiKeysService } from "./api-keys.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).default([]),
  allowedIps: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().int().min(0).optional(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  permissions: z.array(z.string()).optional(),
  allowedIps: z.array(z.string()).optional(),
  rateLimit: z.number().int().min(0).optional(),
});

const setExpirySchema = z.object({
  expiresAt: z.string().datetime().nullable(),
});

@ApiTags("saas-api-keys")
@ApiBearerAuth()
@Controller("saas/api-keys")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @ApiOperation({ summary: "List API keys" })
  @Permissions("saas.apikey.read")
  @Get()
  async listApiKeys(@Req() req: AuthReq) {
    return this.apiKeysService.listApiKeys(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create API key (returns full key once)" })
  @Permissions("saas.apikey.create")
  @Post()
  async createApiKey(@Req() req: AuthReq, @ZodBody(createApiKeySchema) body: z.infer<typeof createApiKeySchema>) {
    return this.apiKeysService.createApiKey(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get API key" })
  @Permissions("saas.apikey.read")
  @Get(":id")
  async getApiKey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apiKeysService.getApiKey(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Update API key" })
  @Permissions("saas.apikey.create")
  @Patch(":id")
  async updateApiKey(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateApiKeySchema) body: z.infer<typeof updateApiKeySchema>) {
    return this.apiKeysService.updateApiKey(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Revoke API key" })
  @Permissions("saas.apikey.delete")
  @Delete(":id")
  async revokeApiKey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apiKeysService.revokeApiKey(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Rotate API key" })
  @Permissions("saas.apikey.create")
  @Post(":id/rotate")
  async rotateApiKey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apiKeysService.rotateApiKey(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Set API key expiry" })
  @Permissions("saas.apikey.create")
  @Patch(":id/expiry")
  async setKeyExpiry(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(setExpirySchema) body: z.infer<typeof setExpirySchema>) {
    return this.apiKeysService.setKeyExpiry(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Get API key usage" })
  @Permissions("saas.apikey.read")
  @Get(":id/usage")
  async getApiKeyUsage(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apiKeysService.getApiKeyUsage(req.user.tenantId, id);
  }
}
