import { Controller, Post, Delete, Param, UseGuards, Req, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { DeviceTokensService } from "./device-tokens.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

const registerDeviceSchema = z.object({
  deviceId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "windows", "macos", "linux"]),
  appVersion: z.string().optional(),
});

/**
 * Push device-token registration for Flutter mobile/desktop clients
 * (.ai/MULTI_CLIENT_MASTER_PLAN.md § 7) — Phase 0 prerequisite before any
 * module's Parity Phase can rely on push as a cache-invalidation signal.
 */
@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications/devices")
@UseGuards(JwtAuthGuard, RbacGuard)
export class DeviceTokensController {
  constructor(private readonly service: DeviceTokensService) {}

  @ApiOperation({ summary: "Register (or refresh) a push device token" })
  @Post()
  @Permissions("communication.notification.update")
  @HttpCode(HttpStatus.OK)
  async register(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: Record<string, unknown>,
  ) {
    const parsed = registerDeviceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? "Invalid device registration");
    }
    return this.service.register(req.user.tenantId, req.user.userId, parsed.data);
  }

  @ApiOperation({ summary: "Unregister a push device token" })
  @Delete(":deviceId")
  @Permissions("communication.notification.update")
  @HttpCode(HttpStatus.OK)
  async unregister(
    @Req() req: AuthenticatedRequest,
    @Param("deviceId") deviceId: string,
  ) {
    return this.service.unregister(req.user.tenantId, req.user.userId, deviceId);
  }
}
