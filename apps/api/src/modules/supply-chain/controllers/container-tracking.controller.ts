import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ContainerTrackingService } from "../services/container-tracking.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSchema = z.object({
  containerNumber: z.string().min(1),
  containerType: z.string().optional(),
  size: z.string().optional(),
  carrierId: z.string().optional(),
  status: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  estimatedDeparture: z.string().optional(),
  estimatedArrival: z.string().optional(),
  actualDeparture: z.string().optional(),
  actualArrival: z.string().optional(),
  sealNumber: z.string().optional(),
  weight: z.number().optional(),
  volume: z.number().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

const eventSchema = z.object({
  eventType: z.string().min(1),
  eventDate: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  remarks: z.string().optional(),
});

const linkShipmentSchema = z.object({
  shipmentType: z.string().min(1),
  shipmentId: z.string().min(1),
});

@ApiTags("supply-chain / containers")
@ApiBearerAuth()
@Controller("supply-chain/containers")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ContainerTrackingController {
  constructor(private readonly svc: ContainerTrackingService) {}

  @Get()
  @Permissions("supply-chain.container.read")
  @ApiOperation({ summary: "List shipping containers" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string, @Query("carrierId") carrierId?: string) {
    return this.svc.list(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status, carrierId });
  }

  @Get("at-risk")
  @Permissions("supply-chain.container.read")
  @ApiOperation({ summary: "Get containers at risk of delay" })
  getAtRiskContainers(@Req() req: AuthRequest) {
    return this.svc.getAtRiskContainers(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("supply-chain.container.read")
  @ApiOperation({ summary: "Get container by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.container.create")
  @ApiOperation({ summary: "Create shipping container record" })
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @ZodBody(createSchema) body: z.infer<typeof createSchema>) {
    return this.svc.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @Permissions("supply-chain.container.update")
  @ApiOperation({ summary: "Update container record" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateSchema) body: z.infer<typeof updateSchema>) {
    return this.svc.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  @Permissions("supply-chain.container.delete")
  @ApiOperation({ summary: "Delete container record" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/events")
  @Permissions("supply-chain.container.update")
  @ApiOperation({ summary: "Add tracking event to container" })
  @HttpCode(HttpStatus.CREATED)
  addEvent(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(eventSchema) body: z.infer<typeof eventSchema>) {
    return this.svc.addEvent(req.user.tenantId, id, body);
  }

  @Post(":id/link-shipment")
  @Permissions("supply-chain.container.update")
  @ApiOperation({ summary: "Link container to a shipment" })
  linkToShipment(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(linkShipmentSchema) body: z.infer<typeof linkShipmentSchema>) {
    return this.svc.linkToShipment(req.user.tenantId, id, body);
  }
}
