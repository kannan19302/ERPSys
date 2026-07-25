import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WorkingCapitalService } from "./services/working-capital.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createDiscountOfferSchema = z.object({
  supplierId: z.string().min(1),
  invoiceId: z.string().min(1),
  originalAmount: z.number().positive(),
  discountedAmount: z.number().positive(),
  discountRate: z.number().min(0),
  offerDate: z.string().min(1),
  discountDeadline: z.string().min(1),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const respondToOfferSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
  notes: z.string().optional(),
});

@ApiTags("advanced-finance-working-capital")
@ApiBearerAuth()
@Controller("advanced-finance/working-capital")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkingCapitalController {
  constructor(private readonly wcService: WorkingCapitalService) {}

  @Post("discount-offers")
  @Permissions("finance.working-capital.create")
  @ApiOperation({ summary: "Create dynamic discount offer" })
  async createDiscountOffer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDiscountOfferSchema) dto: any,
  ) {
    return this.wcService.createDiscountOffer(
      req.user.tenantId,
      await resolveOrgId(req.user.tenantId, req.user.orgId),
      dto,
    );
  }

  @Get("discount-offers")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "List discount offers" })
  async getDiscountOffers(
    @Req() req: AuthenticatedRequest,
    @Query("supplierId") supplierId?: string,
    @Query("status") status?: string,
  ) {
    return this.wcService.getDiscountOffers(
      req.user.tenantId,
      supplierId,
      status,
    );
  }

  @Get("discount-offers/:id")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get discount offer" })
  async getDiscountOffer(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.wcService.getDiscountOffer(req.user.tenantId, id);
  }

  @Post("discount-offers/:id/respond")
  @Permissions("finance.working-capital.update")
  @ApiOperation({ summary: "Respond to discount offer" })
  async respondToOffer(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(respondToOfferSchema) dto: any,
  ) {
    return this.wcService.respondToOffer(req.user.tenantId, id, dto);
  }

  @Post("discount-offers/:id/settle")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Settle discount" })
  async settleDiscount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.wcService.settleDiscount(req.user.tenantId, id);
  }

  @Get("discount-offers/stats")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get discount statistics" })
  async getDiscountStats(@Req() req: AuthenticatedRequest) {
    return this.wcService.getDiscountStats(req.user.tenantId);
  }

  @Post("programs")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Create working capital program" })
  async createProgram(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        programType: z.string().min(1),
        status: z.string().optional(),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
        fundingLimit: z.number().positive().optional(),
        interestRate: z.number().min(0).optional(),
        feeStructure: z.any().optional(),
        eligibilityCriteria: z.any().optional(),
      }),
    )
    dto: any,
  ) {
    return this.wcService.createProgram(
      req.user.tenantId,
      await resolveOrgId(req.user.tenantId, req.user.orgId),
      dto,
    );
  }

  @Get("programs")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "List programs" })
  async getPrograms(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.wcService.getPrograms(req.user.tenantId, status);
  }

  @Get("programs/:id")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get program" })
  async getProgram(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.wcService.getProgram(req.user.tenantId, id);
  }

  @Patch("programs/:id")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Update program" })
  async updateProgram(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        programType: z.string().optional(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        fundingLimit: z.number().positive().optional(),
        interestRate: z.number().min(0).optional(),
      }),
    )
    dto: any,
  ) {
    return this.wcService.updateProgram(req.user.tenantId, id, dto);
  }

  @Get("programs/:id/utilization")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get program utilization" })
  async getProgramUtilization(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.wcService.getProgramUtilization(req.user.tenantId, id);
  }

  @Post("facilities")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Create supply chain finance facility" })
  async createFacility(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        supplierId: z.string().min(1),
        facilityType: z.string().min(1),
        approvedLimit: z.number().positive(),
        currency: z.string().optional(),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
        interestRate: z.number().min(0),
        feeRate: z.number().min(0).optional(),
        terms: z.any().optional(),
      }),
    )
    dto: any,
  ) {
    return this.wcService.createFacility(req.user.tenantId, dto);
  }

  @Get("facilities")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "List facilities" })
  async getFacilities(
    @Req() req: AuthenticatedRequest,
    @Query("supplierId") supplierId?: string,
    @Query("facilityType") facilityType?: string,
  ) {
    return this.wcService.getFacilities(req.user.tenantId, {
      recourseType: supplierId,
      status: facilityType,
    });
  }

  @Get("facilities/:id")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get facility" })
  async getFacility(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.wcService.getFacility(req.user.tenantId, id);
  }

  @Post("facilities/:id/advance")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Advance invoice" })
  async advanceInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        invoiceId: z.string().min(1),
        invoiceAmount: z.number().positive(),
      }),
    )
    dto: any,
  ) {
    return this.wcService.advanceInvoice(req.user.tenantId, id, dto);
  }

  @Get("advances")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "List advances" })
  async getAdvances(
    @Req() req: AuthenticatedRequest,
    @Query("facilityId") facilityId?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.wcService.getAdvances(req.user.tenantId, {
      facilityId,
      status,
      page,
      limit,
    });
  }

  @Get("advances/:id")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get advance" })
  async getAdvance(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.wcService.getAdvance(req.user.tenantId, id);
  }

  @Post("advances/:id/settle")
  @Permissions("finance.working-capital.manage")
  @ApiOperation({ summary: "Settle advance" })
  async settleAdvance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.wcService.settleAdvance(req.user.tenantId, id);
  }

  @Get("factoring/stats")
  @Permissions("finance.working-capital.read")
  @ApiOperation({ summary: "Get factoring statistics" })
  async getFactoringStats(@Req() req: AuthenticatedRequest) {
    return this.wcService.getFactoringStats(req.user.tenantId);
  }
}
