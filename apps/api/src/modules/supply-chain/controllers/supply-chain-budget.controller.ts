import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { SupplyChainBudgetService } from "../services/supply-chain-budget.service";

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
  fiscalYear: z.string().min(1),
  budgetName: z.string().min(1),
  category: z.string().optional(),
  totalAmount: z.number(),
  currency: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        category: z.string(),
        description: z.string().optional(),
        budgetedAmount: z.number(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

const updateSchema = createSchema.partial();

const lineItemSchema = z.object({
  category: z.string(),
  description: z.string().optional(),
  budgetedAmount: z.number(),
  notes: z.string().optional(),
});

const updateLineItemSchema = lineItemSchema.partial();

@ApiTags("supply-chain / budgets")
@ApiBearerAuth()
@Controller("supply-chain/budgets")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainBudgetController {
  constructor(private readonly svc: SupplyChainBudgetService) {}

  @Get()
  @Permissions("supply-chain.budget.read")
  @ApiOperation({ summary: "List supply chain budgets" })
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("fiscalYear") fiscalYear?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.list(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      status: status as string | undefined,
    });
  }

  @Get("vs-actual")
  @Permissions("supply-chain.budget.read")
  @ApiOperation({ summary: "Get budget vs actual comparison" })
  getBudgetVsActual(
    @Req() req: AuthRequest,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.svc.getBudgetVsActual(req.user.tenantId, Number(fiscalYear));
  }

  @Get(":id")
  @Permissions("supply-chain.budget.read")
  @ApiOperation({ summary: "Get budget by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.budget.create")
  @ApiOperation({ summary: "Create supply chain budget" })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @ZodBody(createSchema) body: z.infer<typeof createSchema>,
  ) {
    return this.svc.create(req.user.tenantId, body as any);
  }

  @Patch(":id")
  @Permissions("supply-chain.budget.update")
  @ApiOperation({ summary: "Update supply chain budget" })
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateSchema) body: z.infer<typeof updateSchema>,
  ) {
    return this.svc.update(req.user.tenantId, id, body as any);
  }

  @Delete(":id")
  @Permissions("supply-chain.budget.delete")
  @ApiOperation({ summary: "Delete supply chain budget" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/approve")
  @Permissions("supply-chain.budget.approve")
  @ApiOperation({ summary: "Approve supply chain budget" })
  approve(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.approve(req.user.tenantId, id, req.user.userId);
  }

  @Post(":id/line-items")
  @Permissions("supply-chain.budget.update")
  @ApiOperation({ summary: "Add line item to budget" })
  @HttpCode(HttpStatus.CREATED)
  addLineItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(lineItemSchema) body: z.infer<typeof lineItemSchema>,
  ) {
    return this.svc.addLineItem(req.user.tenantId, id, body as any);
  }

  @Patch("line-items/:lineItemId")
  @Permissions("supply-chain.budget.update")
  @ApiOperation({ summary: "Update budget line item" })
  updateLineItem(
    @Req() req: AuthRequest,
    @Param("lineItemId") lineItemId: string,
    @ZodBody(updateLineItemSchema) body: z.infer<typeof updateLineItemSchema>,
  ) {
    return this.svc.updateLineItem(req.user.tenantId, lineItemId, body as any);
  }
}
