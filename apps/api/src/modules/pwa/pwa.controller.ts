import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  Body,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PwaService } from "./pwa.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  UpdateManifestSchema,
  UpdateServiceWorkerSchema,
  CreateCacheRuleSchema,
  UpdateCacheRuleSchema,
  UpdateInstallPromptSchema,
  CreateSyncQueueSchema,
  CreatePushSubscriptionSchema,
} from "@unerp/shared";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("pwa")
@Controller()
export class PwaController {
  constructor(private readonly pwaService: PwaService) {}

  // Public endpoints (no auth - served to browsers)
  @Get("pwa/manifest.json")
  @ApiOperation({ summary: "Get PWA manifest JSON (public)" })
  async getManifestJson(@Req() req: AuthReq, @Res() res: Response) {
    const tenantId = (req.headers["x-tenant-id"] as string) || "default";
    const manifest = await this.pwaService.getManifestJson(tenantId);
    res.setHeader("Content-Type", "application/json");
    res.json(manifest);
  }

  @Get("pwa/sw.js")
  @ApiOperation({ summary: "Get service worker script (public)" })
  async getServiceWorkerScript(@Req() req: AuthReq, @Res() res: Response) {
    const tenantId = (req.headers["x-tenant-id"] as string) || "default";
    const script = await this.pwaService.getServiceWorkerScript(tenantId);
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.send(script);
  }

  @Get("pwa/cache-rules.json")
  @ApiOperation({ summary: "Get cache rules JSON (public)" })
  async getCacheRulesJson(@Req() req: AuthReq, @Res() res: Response) {
    const tenantId = (req.headers["x-tenant-id"] as string) || "default";
    const rules = await this.pwaService.getCacheRulesJson(tenantId);
    res.json(rules);
  }

  // Admin endpoints
  @Get("admin/pwa/manifest")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.manifest.read")
  @ApiOperation({ summary: "Get PWA manifest config" })
  async getManifest(@Req() req: AuthReq) {
    return this.pwaService.getManifest(req.user.tenantId);
  }

  @Put("admin/pwa/manifest")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.manifest.update")
  @ApiOperation({ summary: "Update PWA manifest" })
  async updateManifest(
    @Req() req: AuthReq,
    @ZodBody(UpdateManifestSchema) dto: any,
  ) {
    return this.pwaService.updateManifest(req.user.tenantId, dto);
  }

  @Get("admin/pwa/service-worker")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.service-worker.read")
  @ApiOperation({ summary: "Get service worker config" })
  async getServiceWorker(@Req() req: AuthReq) {
    return this.pwaService.getServiceWorker(req.user.tenantId);
  }

  @Put("admin/pwa/service-worker")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.service-worker.update")
  @ApiOperation({ summary: "Update service worker" })
  async updateServiceWorker(
    @Req() req: AuthReq,
    @ZodBody(UpdateServiceWorkerSchema) dto: any,
  ) {
    return this.pwaService.updateServiceWorker(req.user.tenantId, dto);
  }

  @Get("admin/pwa/cache-rules")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.cache.read")
  @ApiOperation({ summary: "List cache rules" })
  async getCacheRules(@Req() req: AuthReq) {
    return this.pwaService.getCacheRules(req.user.tenantId);
  }

  @Post("admin/pwa/cache-rules")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.cache.create")
  @ApiOperation({ summary: "Create cache rule" })
  async createCacheRule(
    @Req() req: AuthReq,
    @ZodBody(CreateCacheRuleSchema) dto: any,
  ) {
    return this.pwaService.createCacheRule(req.user.tenantId, dto);
  }

  @Put("admin/pwa/cache-rules/:id")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.cache.update")
  @ApiOperation({ summary: "Update cache rule" })
  async updateCacheRule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateCacheRuleSchema) dto: any,
  ) {
    return this.pwaService.updateCacheRule(req.user.tenantId, id, dto);
  }

  @Delete("admin/pwa/cache-rules/:id")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.cache.delete")
  @ApiOperation({ summary: "Delete cache rule" })
  async deleteCacheRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.pwaService.deleteCacheRule(req.user.tenantId, id);
  }

  @Get("admin/pwa/install-prompt")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.install-prompt.read")
  @ApiOperation({ summary: "Get install prompt config" })
  async getInstallPrompt(@Req() req: AuthReq) {
    return this.pwaService.getInstallPrompt(req.user.tenantId);
  }

  @Put("admin/pwa/install-prompt")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.install-prompt.update")
  @ApiOperation({ summary: "Update install prompt config" })
  async updateInstallPrompt(
    @Req() req: AuthReq,
    @ZodBody(UpdateInstallPromptSchema) dto: any,
  ) {
    return this.pwaService.updateInstallPrompt(req.user.tenantId, dto);
  }

  @Get("admin/pwa/sync-queue")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.sync-queue.read")
  @ApiOperation({ summary: "List sync queue" })
  async getSyncQueue(
    @Req() req: AuthReq,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.pwaService.getSyncQueue(
      req.user.tenantId,
      status,
      +page,
      +limit,
    );
  }

  @Post("admin/pwa/sync-queue")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.sync-queue.read")
  @ApiOperation({ summary: "Create sync queue item" })
  async createSyncQueue(
    @Req() req: AuthReq,
    @ZodBody(CreateSyncQueueSchema) dto: any,
  ) {
    return this.pwaService.createSyncQueue(req.user.tenantId, dto);
  }

  @Put("admin/pwa/sync-queue/:id/status")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.sync-queue.update")
  @ApiOperation({ summary: "Update sync status" })
  async updateSyncStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("errorMessage") errorMessage?: string,
  ) {
    return this.pwaService.updateSyncStatus(
      req.user.tenantId,
      id,
      status,
      errorMessage,
    );
  }

  @Get("admin/pwa/push-subscriptions")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.push.read")
  @ApiOperation({ summary: "List push subscriptions" })
  async getPushSubscriptions(
    @Req() req: AuthReq,
    @Query("userId") userId?: string,
  ) {
    return this.pwaService.getPushSubscriptions(req.user.tenantId, userId);
  }

  @Post("admin/pwa/push-subscriptions")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.push.create")
  @ApiOperation({ summary: "Create push subscription" })
  async createPushSubscription(
    @Req() req: AuthReq,
    @ZodBody(CreatePushSubscriptionSchema) dto: any,
  ) {
    return this.pwaService.createPushSubscription(req.user.tenantId, dto);
  }

  @Delete("admin/pwa/push-subscriptions/:id")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions("pwa.push.delete")
  @ApiOperation({ summary: "Delete push subscription" })
  async deletePushSubscription(@Req() req: AuthReq, @Param("id") id: string) {
    return this.pwaService.deletePushSubscription(req.user.tenantId, id);
  }
}
