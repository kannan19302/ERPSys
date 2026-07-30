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
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyChainCarrierContractsService } from "../services/supply-chain-carrier-contracts.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createSchema = z.object({
  carrierId: z.string().min(1),
  contractNumber: z.string().min(1),
  contractType: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  totalValue: z.number().optional(),
  currency: z.string().optional(),
  termsConditions: z.string().optional(),
  serviceLevelCommitments: z.string().optional(),
  autoRenew: z.boolean().optional(),
  renewalTerms: z.string().optional(),
  status: z.string().optional(),
});
const updateSchema = createSchema.partial();
const rateCardSchema = z.object({
  laneOrigin: z.string().min(1),
  laneDestination: z.string().min(1),
  equipmentType: z.string().optional(),
  rateType: z.string().min(1),
  baseRate: z.number().positive(),
  ratePerKm: z.number().optional(),
  ratePerKg: z.number().optional(),
  minCharge: z.number().optional(),
  fuelSurchargePct: z.number().optional(),
  transitDays: z.number().optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  currency: z.string().optional(),
});
const spotQuoteSchema = z.object({
  carrierId: z.string().min(1),
  laneOrigin: z.string().min(1),
  laneDestination: z.string().min(1),
  equipmentType: z.string().optional(),
  weightKg: z.number().optional(),
  requestedRate: z.number().positive(),
  currency: z.string().optional(),
  requestedTransitDays: z.number().optional(),
  pickupDate: z.string().min(1),
  notes: z.string().optional(),
});
const spotQuoteResponseSchema = z.object({
  offeredRate: z.number().positive(),
  counterNotes: z.string().optional(),
  status: z.string().min(1),
});

@ApiTags("supply-chain / carrier-contracts")
@ApiBearerAuth()
@Controller("supply-chain/carrier-contracts")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CarrierContractController {
  constructor(private readonly svc: SupplyChainCarrierContractsService) {}

  @Get("dashboard")
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "Carrier contract dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getContractDashboard(req.user.tenantId);
  }

  @Get()
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "List contracts" })
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("carrierId") carrierId?: string,
    @Query("contractType") contractType?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.svc.listContracts(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      carrierId,
      contractType,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });
  }

  @Get(":id")
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "Get contract detail" })
  get(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getContract(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.carrier-contracts.create")
  @ApiOperation({ summary: "Create carrier contract" })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @ZodBody(createSchema) body: z.infer<typeof createSchema>,
  ) {
    return this.svc.createContract(
      req.user.tenantId,
      req.user.orgId ?? "",
      body,
    );
  }

  @Patch(":id")
  @Permissions("supply-chain.carrier-contracts.update")
  @ApiOperation({ summary: "Update contract" })
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateSchema) body: z.infer<typeof updateSchema>,
  ) {
    return this.svc.updateContract(req.user.tenantId, id, body as any);
  }

  @Post(":id/approve")
  @Permissions("supply-chain.carrier-contracts.update")
  @ApiOperation({ summary: "Approve contract" })
  approve(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.approveContract(req.user.tenantId, id, req.user.userId);
  }

  @Post(":id/rate-cards")
  @Permissions("supply-chain.carrier-contracts.update")
  @ApiOperation({ summary: "Add rate card" })
  @HttpCode(HttpStatus.CREATED)
  addRateCard(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(rateCardSchema) body: z.infer<typeof rateCardSchema>,
  ) {
    return this.svc.addRateCard(req.user.tenantId, id, body);
  }

  @Get(":id/rate-cards")
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "List rate cards for contract" })
  listRateCards(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listRateCards(req.user.tenantId, {
      contractId: id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("spot-quotes")
  @Permissions("supply-chain.carrier-contracts.create")
  @ApiOperation({ summary: "Negotiate spot quote" })
  @HttpCode(HttpStatus.CREATED)
  negotiateSpotQuote(
    @Req() req: AuthRequest,
    @ZodBody(spotQuoteSchema) body: z.infer<typeof spotQuoteSchema>,
  ) {
    return this.svc.negotiateSpotQuote(req.user.tenantId, body);
  }

  @Patch("spot-quotes/:id/respond")
  @Permissions("supply-chain.carrier-contracts.update")
  @ApiOperation({ summary: "Respond to spot quote" })
  respondToSpotQuote(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(spotQuoteResponseSchema)
    body: z.infer<typeof spotQuoteResponseSchema>,
  ) {
    return this.svc.respondToSpotQuote(req.user.tenantId, id, body);
  }

  @Get(":id/service-level")
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "Evaluate service level for contract" })
  evaluateServiceLevel(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.evaluateServiceLevel(req.user.tenantId, id);
  }

  @Get("rate-cards/all")
  @Permissions("supply-chain.carrier-contracts.read")
  @ApiOperation({ summary: "List all active rate cards" })
  listAllRateCards(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listRateCards(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
