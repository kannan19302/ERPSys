import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierContractService } from "../services/supplier-contract.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSchema = z.object({
  contractNumber: z.string().min(1),
  vendorId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  contractType: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  totalValue: z.number().optional(),
  currency: z.string().optional(),
  autoRenew: z.boolean().optional(),
  renewalTerms: z.string().optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    productId: z.string().optional(),
    itemCode: z.string().optional(),
    description: z.string().optional(),
    unitPrice: z.number().optional(),
    quantity: z.number().optional(),
    uom: z.string().optional(),
    discountPct: z.number().optional(),
    totalPrice: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
});

const updateSchema = createSchema.partial();

const renewSchema = z.object({ newEndDate: z.string() });

@ApiTags("supply-chain / contracts")
@ApiBearerAuth()
@Controller("supply-chain/contracts")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierContractController {
  constructor(private readonly svc: SupplierContractService) {}

  @Get()
  @Permissions("supply-chain.contract.read")
  @ApiOperation({ summary: "List supplier contracts" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("sortBy") sortBy?: string, @Query("sortOrder") sortOrder?: string) {
    return this.svc.list(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, sortBy, sortOrder });
  }

  @Get("expiring")
  @Permissions("supply-chain.contract.read")
  @ApiOperation({ summary: "Get contracts expiring within N days" })
  getExpiring(@Req() req: AuthRequest, @Query("days") days?: string) {
    return this.svc.getExpiring(req.user.tenantId, days ? Number(days) : 30);
  }

  @Get(":id")
  @Permissions("supply-chain.contract.read")
  @ApiOperation({ summary: "Get contract by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.contract.create")
  @ApiOperation({ summary: "Create supplier contract" })
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @ZodBody(createSchema) body: z.infer<typeof createSchema>) {
    return this.svc.create(req.user.tenantId, body, req.user.userId);
  }

  @Patch(":id")
  @Permissions("supply-chain.contract.update")
  @ApiOperation({ summary: "Update supplier contract" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateSchema) body: z.infer<typeof updateSchema>) {
    return this.svc.update(req.user.tenantId, id, body, req.user.userId);
  }

  @Delete(":id")
  @Permissions("supply-chain.contract.delete")
  @ApiOperation({ summary: "Delete supplier contract" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/approve")
  @Permissions("supply-chain.contract.approve")
  @ApiOperation({ summary: "Approve supplier contract" })
  approve(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.approve(req.user.tenantId, id, req.user.userId);
  }

  @Post(":id/renew")
  @Permissions("supply-chain.contract.update")
  @ApiOperation({ summary: "Renew supplier contract" })
  renew(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(renewSchema) body: z.infer<typeof renewSchema>) {
    return this.svc.renew(req.user.tenantId, id, body.newEndDate, req.user.userId);
  }

  @Post(":id/line-items")
  @Permissions("supply-chain.contract.update")
  @ApiOperation({ summary: "Add line item to contract" })
  addLineItem(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(createSchema.shape.lineItems.unwrap().element) body: z.infer<typeof createSchema.shape.lineItems.unwrap().element>) {
    return this.svc.addLineItem(req.user.tenantId, id, body);
  }

  @Delete("line-items/:lineItemId")
  @Permissions("supply-chain.contract.update")
  @ApiOperation({ summary: "Remove line item from contract" })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLineItem(@Req() req: AuthRequest, @Param("lineItemId") lineItemId: string) {
    return this.svc.removeLineItem(req.user.tenantId, lineItemId);
  }
}
