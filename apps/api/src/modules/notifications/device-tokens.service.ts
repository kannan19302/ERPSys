// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

/**
 * Push notification device tokens for Flutter mobile/desktop clients
 * (.ai/MULTI_CLIENT_MASTER_PLAN.md § 7). One row per installed app
 * instance, keyed by (tenantId, deviceId) so re-registering the same
 * device just refreshes its token instead of accumulating duplicates.
 */
@Injectable()
export class DeviceTokensService {
  async register(
    tenantId: string,
    userId: string,
    dto: {
      deviceId: string;
      token: string;
      platform: string;
      appVersion?: string;
    },
  ) {
    return prisma.pushDeviceToken.upsert({
      where: { tenantId_deviceId: { tenantId, deviceId: dto.deviceId } },
      create: {
        tenantId,
        userId,
        deviceId: dto.deviceId,
        token: dto.token,
        platform: dto.platform,
        appVersion: dto.appVersion ?? null,
      },
      update: {
        userId,
        token: dto.token,
        platform: dto.platform,
        appVersion: dto.appVersion ?? null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  /** Idempotent — unregistering an unknown device is a no-op. */
  async unregister(tenantId: string, userId: string, deviceId: string) {
    await prisma.pushDeviceToken.updateMany({
      where: { tenantId, userId, deviceId },
      data: { isActive: false },
    });
    return { unregistered: true };
  }

  async listActiveTokens(tenantId: string, userId: string) {
    return prisma.pushDeviceToken.findMany({
      where: { tenantId, userId, isActive: true },
    });
  }
}
