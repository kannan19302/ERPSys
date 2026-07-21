import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { z } from "zod";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ArDeepService } from "./ar-deep.service";

const promiseToPaySchema = z.object({
  customerId: z.string().min(1),
  invoiceId: z.string().min(1),
  promisedDate: z.string().min(1),
  promisedAmount: z.number().positive(),
  notes: z.string().optional(),
  collectorId: z.string().optional(),
});
const disputeSchema = z.object({
  invoiceId: z.string().min(1),
  customerId: z.string().min(1),
  reason: z.string().min(1),
  disputedAmount: z.number().positive(),
  notes: z.string().optional(),
  openedBy: z.string().min(1),
  assignedTo: z.string().optional(),
});
const creditLimitSchema = z.object({ creditLimit: z.number().min(0) });
const creditHoldSchema = z.object({ reason: z.string().min(1) });

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("finance/ar-deep")
@ApiBearerAuth()
@Controller("finance/ar-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ArDeepController {
  constructor(private readonly arDeepService: ArDeepService) {}

  @Get("collections")
  @Permissions("finance.receivables.read")
  async getCollections(@Req() req: AuthReq, @Query() query: any) {
    return this.arDeepService.getCollectionsQueue(req.user.tenantId, query);
  }

  @Get("collections/stats")
  @Permissions("finance.receivables.read")
  async getCollectionsStats(@Req() req: AuthReq) {
    return this.arDeepService.getCollectionsStats(req.user.tenantId);
  }

  @Get("credit-management")
  @Permissions("finance.receivables.read")
  async getCreditManagement(@Req() req: AuthReq, @Query() query: any) {
    return this.arDeepService.getCreditManagement(req.user.tenantId, query);
  }

  @Patch("credit-management/:customerId/credit-limit")
  @Permissions("finance.receivables.update")
  async setCreditLimit(
    @Req() req: AuthReq,
    @Param("customerId") customerId: string,
    @Body() body: any,
  ) {
    const parsed = creditLimitSchema.parse(body);
    return this.arDeepService.setCreditLimit(
      req.user.tenantId,
      customerId,
      parsed.creditLimit,
    );
  }

  @Post("credit-management/:customerId/credit-hold")
  @Permissions("finance.receivables.update")
  async placeCreditHold(
    @Req() req: AuthReq,
    @Param("customerId") customerId: string,
    @Body() body: any,
  ) {
    const parsed = creditHoldSchema.parse(body);
    return this.arDeepService.placeCreditHold(
      req.user.tenantId,
      customerId,
      parsed.reason,
    );
  }

  @Post("credit-management/:customerId/release-hold")
  @Permissions("finance.receivables.update")
  async releaseCreditHold(
    @Req() req: AuthReq,
    @Param("customerId") customerId: string,
  ) {
    return this.arDeepService.releaseCreditHold(req.user.tenantId, customerId);
  }

  @Get("promises")
  @Permissions("finance.receivables.read")
  async getPromises(@Req() req: AuthReq, @Query() query: any) {
    return this.arDeepService.getPromiseToPay(req.user.tenantId, query);
  }

  @Post("promises")
  @Permissions("finance.receivables.create")
  async createPromise(@Req() req: AuthReq, @Body() body: any) {
    const parsed = promiseToPaySchema.parse(body);
    return this.arDeepService.createPromiseToPay(req.user.tenantId, parsed);
  }

  @Post("promises/:id/fulfill")
  @Permissions("finance.receivables.update")
  async fulfillPromise(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.arDeepService.fulfillPromiseToPay(
      req.user.tenantId,
      id,
      body?.receivedAmount,
    );
  }

  @Get("disputes")
  @Permissions("finance.receivables.read")
  async getDisputes(@Req() req: AuthReq, @Query() query: any) {
    return this.arDeepService.getArDisputes(req.user.tenantId, query);
  }

  @Post("disputes")
  @Permissions("finance.receivables.create")
  async createDispute(@Req() req: AuthReq, @Body() body: any) {
    const parsed = disputeSchema.parse(body);
    return this.arDeepService.createArDispute(req.user.tenantId, parsed);
  }

  @Patch("disputes/:id/status")
  @Permissions("finance.receivables.update")
  async updateDisputeStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.arDeepService.updateArDisputeStatus(
      req.user.tenantId,
      id,
      body.status,
      body?.resolvedAmount,
    );
  }

  @Get("analytics")
  @Permissions("finance.receivables.read")
  async getAnalytics(@Req() req: AuthReq) {
    return this.arDeepService.getArAnalytics(req.user.tenantId);
  }
}
