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
import { SupplyChainFinanceService } from "../services/supply-chain-finance.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createProgramSchema = z.object({
  name: z.string().min(1),
  programType: z.string().min(1),
  fundingLimit: z.number().positive(),
  interestRate: z.number().min(0).max(100),
  feeStructure: z.any().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});
const updateProgramSchema = createProgramSchema.partial();
const factoringSchema = z.object({
  facilityId: z.string().min(1),
  invoiceId: z.string().min(1),
  invoiceAmount: z.number().positive(),
  currency: z.string().optional(),
});
const discountSchema = z.object({
  invoiceAmount: z.number().positive(),
  discountRate: z.number().min(0).max(100),
  daysPaidEarly: z.number().int().positive(),
  currency: z.string().optional(),
});
const reverseFactoringSchema = z.object({
  name: z.string().min(1),
  anchorBuyerId: z.string().min(1),
  fundingLimit: z.number().positive(),
  interestRate: z.number().min(0).max(100),
  paymentTerms: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
});

@ApiTags("supply-chain / finance")
@ApiBearerAuth()
@Controller("supply-chain/finance")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainFinanceController {
  constructor(private readonly svc: SupplyChainFinanceService) {}

  @Get("dashboard")
  @Permissions("supply-chain.finance.read")
  @ApiOperation({ summary: "SCF dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getSCFDashboard(req.user.tenantId);
  }

  @Get("programs")
  @Permissions("supply-chain.finance.read")
  @ApiOperation({ summary: "List SCF programs" })
  listPrograms(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("programType") programType?: string,
  ) {
    return this.svc.listSCFPrograms(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      programType,
    });
  }

  @Get("programs/:id")
  @Permissions("supply-chain.finance.read")
  @ApiOperation({ summary: "Get SCF program" })
  getProgram(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getSCFProgram(req.user.tenantId, id);
  }

  @Post("programs")
  @Permissions("supply-chain.finance.create")
  @ApiOperation({ summary: "Create SCF program" })
  @HttpCode(HttpStatus.CREATED)
  createProgram(
    @Req() req: AuthRequest,
    @ZodBody(createProgramSchema) body: z.infer<typeof createProgramSchema>,
  ) {
    return this.svc.createSCFProgram(
      req.user.tenantId,
      req.user.orgId ?? "",
      body,
    );
  }

  @Patch("programs/:id")
  @Permissions("supply-chain.finance.update")
  @ApiOperation({ summary: "Update SCF program" })
  updateProgram(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateProgramSchema) body: z.infer<typeof updateProgramSchema>,
  ) {
    return this.svc.updateSCFProgram(req.user.tenantId, id, body as any);
  }

  @Post("factoring")
  @Permissions("supply-chain.finance.create")
  @ApiOperation({ summary: "Submit invoice for factoring" })
  @HttpCode(HttpStatus.CREATED)
  submitForFactoring(
    @Req() req: AuthRequest,
    @ZodBody(factoringSchema) body: z.infer<typeof factoringSchema>,
  ) {
    return this.svc.submitInvoiceForFactoring(req.user.tenantId, body);
  }

  @Get("factoring")
  @Permissions("supply-chain.finance.read")
  @ApiOperation({ summary: "List factoring advances" })
  listAdvances(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("facilityId") facilityId?: string,
  ) {
    return this.svc.listFactoringAdvances(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      facilityId,
    });
  }

  @Post("factoring/:id/approve")
  @Permissions("supply-chain.finance.update")
  @ApiOperation({ summary: "Approve factoring advance" })
  approveAdvance(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.approveAdvance(req.user.tenantId, id, req.user.userId);
  }

  @Post("discount/calculate")
  @Permissions("supply-chain.finance.read")
  @ApiOperation({ summary: "Calculate dynamic discount" })
  calculateDiscount(
    @Req() req: AuthRequest,
    @ZodBody(discountSchema) body: z.infer<typeof discountSchema>,
  ) {
    return this.svc.calculateDiscount(body);
  }

  @Post("reverse-factoring")
  @Permissions("supply-chain.finance.create")
  @ApiOperation({ summary: "Create reverse factoring program" })
  @HttpCode(HttpStatus.CREATED)
  createReverseFactoring(
    @Req() req: AuthRequest,
    @ZodBody(reverseFactoringSchema)
    body: z.infer<typeof reverseFactoringSchema>,
  ) {
    return this.svc.createReverseFactoringProgram(req.user.tenantId, body);
  }
}
