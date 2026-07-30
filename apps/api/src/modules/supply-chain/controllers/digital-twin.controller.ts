// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyChainDigitalTwinService } from "../services/supply-chain-digital-twin.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const nodeSchema = z.object({
  nodeId: z.string().min(1),
  nodeType: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  label: z.string().min(1),
});
const createTwinSchema = z.object({
  twinName: z.string().min(1),
  twinType: z.string().min(1),
  description: z.string().optional(),
  config: z.any().optional(),
  supplyChainNodes: z.array(nodeSchema).optional(),
});
const addNodeSchema = z.object({
  nodeId: z.string().min(1),
  nodeType: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  label: z.string().min(1),
  metadata: z.any().optional(),
});
const simulateSchema = z.object({
  twinId: z.string().min(1),
  scenarioName: z.string().min(1),
  scenarioType: z.string().min(1),
  parameters: z.object({
    demandChange: z.number().optional(),
    supplyDisruption: z.boolean().optional(),
    leadTimeIncrease: z.number().optional(),
    costChange: z.number().optional(),
    weatherEvent: z.boolean().optional(),
    portClosure: z.boolean().optional(),
  }),
  description: z.string().optional(),
});
const compareSchema = z.object({
  simulationIds: z.array(z.string().min(1)).min(2).max(10),
});

@ApiTags("supply-chain / digital-twin")
@ApiBearerAuth()
@Controller("supply-chain/digital-twin")
@UseGuards(JwtAuthGuard, RbacGuard)
export class DigitalTwinController {
  constructor(private readonly svc: SupplyChainDigitalTwinService) {}

  @Get("dashboard")
  @Permissions("supply-chain.control-tower.read")
  @ApiOperation({ summary: "Digital twin dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getTwinDashboard(req.user.tenantId);
  }

  @Get()
  @Permissions("supply-chain.control-tower.read")
  @ApiOperation({ summary: "List digital twins" })
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("twinType") twinType?: string,
  ) {
    return this.svc.getDigitalTwins(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      twinType,
    });
  }

  @Post()
  @Permissions("supply-chain.control-tower.manage")
  @ApiOperation({ summary: "Create digital twin" })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @ZodBody(createTwinSchema) body: z.infer<typeof createTwinSchema>,
  ) {
    return this.svc.createDigitalTwin(
      req.user.tenantId,
      req.user.orgId ?? "",
      body,
    );
  }

  @Get(":id")
  @Permissions("supply-chain.control-tower.read")
  @ApiOperation({ summary: "Get digital twin detail" })
  get(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getDigitalTwinById(req.user.tenantId, id);
  }

  @Patch(":id")
  @Permissions("supply-chain.control-tower.manage")
  @ApiOperation({ summary: "Update digital twin" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) {
    return this.svc.updateDigitalTwin(req.user.tenantId, id, body);
  }

  @Post(":id/nodes")
  @Permissions("supply-chain.control-tower.manage")
  @ApiOperation({ summary: "Add node to twin" })
  @HttpCode(HttpStatus.CREATED)
  addNode(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(addNodeSchema) body: z.infer<typeof addNodeSchema>,
  ) {
    return this.svc.updateDigitalTwin(req.user.tenantId, id, body);
  }

  @Post("simulate")
  @Permissions("supply-chain.control-tower.manage")
  @ApiOperation({ summary: "Run simulation" })
  @HttpCode(HttpStatus.CREATED)
  simulate(
    @Req() req: AuthRequest,
    @ZodBody(simulateSchema) body: z.infer<typeof simulateSchema>,
  ) {
    return this.svc.runSimulation(req.user.tenantId, body);
  }

  @Get("simulations")
  @Permissions("supply-chain.control-tower.read")
  @ApiOperation({ summary: "List simulations" })
  listSimulations(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("twinId") twinId?: string,
    @Query("scenarioType") scenarioType?: string,
  ) {
    return this.svc.getSimulations(
      req.user.tenantId,
      twinId,
      limit ? Number(limit) : undefined,
    );
  }

  @Post("compare")
  @Permissions("supply-chain.control-tower.read")
  @ApiOperation({ summary: "Compare simulation scenarios" })
  compare(
    @Req() req: AuthRequest,
    @ZodBody(compareSchema) body: z.infer<typeof compareSchema>,
  ) {
    return this.svc.compareSimulations(req.user.tenantId, body.simulationIds);
  }
}
