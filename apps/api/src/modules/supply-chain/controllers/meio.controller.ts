import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyChainMEIOService } from "../services/supply-chain-meio.service";

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
  leadTimeDays: z.number().int().positive(),
  holdingCostPct: z.number().min(0).max(100),
  serviceLevel: z.number().min(0).max(1),
  minStock: z.number().optional(),
  maxStock: z.number().optional(),
});
const buildModelSchema = z.object({
  modelName: z.string().min(1),
  modelType: z.string().min(1),
  nodes: z.array(nodeSchema).min(1),
  parameters: z.any().optional(),
});
const simulateSchema = z.object({
  modelId: z.string().min(1),
  scenarioName: z.string().min(1),
  scenarioType: z.string().min(1),
  parameters: z.object({
    demandChangePct: z.number().optional(),
    leadTimeChangePct: z.number().optional(),
    serviceLevelChange: z.number().optional(),
    costChangePct: z.number().optional(),
  }),
});

@ApiTags("supply-chain / meio")
@ApiBearerAuth()
@Controller("supply-chain/meio")
@UseGuards(JwtAuthGuard, RbacGuard)
export class MEIOController {
  constructor(private readonly svc: SupplyChainMEIOService) {}

  @Get("dashboard")
  @Permissions("supply-chain.meio.read")
  @ApiOperation({ summary: "MEIO dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getMEIODashboard(req.user.tenantId);
  }

  @Post("models")
  @Permissions("supply-chain.meio.create")
  @ApiOperation({ summary: "Build multi-echelon inventory model" })
  @HttpCode(HttpStatus.CREATED)
  buildModel(
    @Req() req: AuthRequest,
    @ZodBody(buildModelSchema) body: z.infer<typeof buildModelSchema>,
  ) {
    return this.svc.buildInventoryModel(req.user.tenantId, body);
  }

  @Get("models")
  @Permissions("supply-chain.meio.read")
  @ApiOperation({ summary: "List MEIO models" })
  listModels(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.listModels(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get("models/:id")
  @Permissions("supply-chain.meio.read")
  @ApiOperation({ summary: "Get model detail" })
  getModel(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getModel(req.user.tenantId, id);
  }

  @Post("models/:id/optimize")
  @Permissions("supply-chain.meio.update")
  @ApiOperation({ summary: "Run optimization on model" })
  optimize(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.optimizeStockingLevels(req.user.tenantId, id);
  }

  @Post("simulate")
  @Permissions("supply-chain.meio.create")
  @ApiOperation({ summary: "Run scenario simulation" })
  @HttpCode(HttpStatus.CREATED)
  simulate(
    @Req() req: AuthRequest,
    @ZodBody(simulateSchema) body: z.infer<typeof simulateSchema>,
  ) {
    return this.svc.simulateScenario(req.user.tenantId, body);
  }

  @Get("simulations")
  @Permissions("supply-chain.meio.read")
  @ApiOperation({ summary: "List simulations" })
  listSimulations(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("modelId") modelId?: string,
  ) {
    return this.svc.listSimulations(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      modelId,
    });
  }

  @Get("models/:id/recommendations")
  @Permissions("supply-chain.meio.read")
  @ApiOperation({ summary: "Get node recommendations" })
  getRecommendations(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getNodeRecommendations(req.user.tenantId, id);
  }
}
