// @ts-nocheck
import { Controller, Get, Post, Delete, UseGuards, Req, Param } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasService } from "./saas.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  level: z.enum(["INFO", "WARNING", "MAINTENANCE", "CRITICAL"]).default("INFO"),
  isDismissible: z.boolean().default(true),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

@ApiTags("saas-announcements")
@ApiBearerAuth()
@Controller("saas/announcements")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnnouncementsController {
  constructor(private readonly saasService: SaasService) {}

  @ApiOperation({ summary: "List announcements" })
  @Permissions("saas.announcement.read")
  @Get()
  async listAnnouncements(@Req() req: AuthReq) {
    const now = new Date();
    return this.saasService.db.tenantAnnouncement.findMany({
      where: {
        OR: [{ tenantId: req.user.tenantId }, { tenantId: null }],
        startsAt: { lte: now },
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @ApiOperation({ summary: "Create announcement" })
  @Permissions("saas.announcement.create")
  @Post()
  async createAnnouncement(@Req() req: AuthReq, @ZodBody(createAnnouncementSchema) body: z.infer<typeof createAnnouncementSchema>) {
    return this.saasService.db.tenantAnnouncement.create({
      data: {
        tenantId: req.user.tenantId,
        title: body.title,
        body: body.body,
        level: body.level,
        isDismissible: body.isDismissible,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
  }

  @ApiOperation({ summary: "Dismiss announcement" })
  @Permissions("saas.announcement.read")
  @Post(":id/dismiss")
  async dismissAnnouncement(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, announcementId: id };
  }

  @ApiOperation({ summary: "Delete announcement" })
  @Permissions("saas.announcement.delete")
  @Delete(":id")
  async deleteAnnouncement(@Req() req: AuthReq, @Param("id") id: string) {
    return this.saasService.db.tenantAnnouncement.deleteMany({
      where: { id, tenantId: req.user.tenantId },
    });
  }
}
