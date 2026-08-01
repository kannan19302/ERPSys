import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SalesReturnsService } from "./sales-returns.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-returns")
@ApiBearerAuth()
@Controller("sales/returns")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesReturnsController {
  constructor(private readonly returnsService: SalesReturnsService) {}

  @Get()
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "List sales returns" })
  async listReturns(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.returnsService.listReturns(
      req.user.tenantId,
      status,
      customerId,
    );
  }

  @Get(":id")
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "Get sales return by id" })
  async getReturn(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.returnsService.getReturn(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Create a sales return" })
  async createReturn(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.returnsService.createReturn(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Post(":id/process")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Process return (transition status)" })
  async processReturn(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body("action") action: string,
  ) {
    return this.returnsService.processReturn(
      req.user.tenantId,
      id,
      action,
      req.user.userId,
    );
  }

  @Post(":id/approve")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Approve a sales return" })
  async approveReturn(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.returnsService.approveReturn(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post(":id/reject")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Reject a sales return" })
  async rejectReturn(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.returnsService.rejectReturn(
      req.user.tenantId,
      id,
      reason,
      req.user.userId,
    );
  }

  @Get("reasons/list")
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "List return reason codes" })
  async listReturnReasons(@Req() req: AuthenticatedRequest) {
    return this.returnsService.listReturnReasons(req.user.tenantId);
  }

  @Post("reasons")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Create a return reason code" })
  async createReturnReason(
    @Req() req: AuthenticatedRequest,
    @Body() body: { code: string; label: string; type: string },
  ) {
    return this.returnsService.createReturnReason(req.user.tenantId, body);
  }

  @Get("rmas")
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "List RMAs" })
  async listRMAs(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.returnsService.listRMAs(req.user.tenantId, status);
  }

  @Post("rmas")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Create an RMA" })
  async createRMA(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.returnsService.createRMA(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Post("rmas/:rmaId/receive/:lineId")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Receive an RMA line item" })
  async rmaReceiveItem(
    @Req() req: AuthenticatedRequest,
    @Param("rmaId") rmaId: string,
    @Param("lineId") lineId: string,
    @Body("condition") condition: string,
  ) {
    return this.returnsService.rmaReceiveItem(
      req.user.tenantId,
      rmaId,
      lineId,
      condition,
      req.user.userId,
    );
  }

  @Post(":id/credit-note")
  @Permissions("sales.returns.manage")
  @ApiOperation({ summary: "Create a credit note for a return" })
  async createCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.returnsService.createCreditNote(
      req.user.tenantId,
      id,
      body,
      req.user.userId,
    );
  }

  @Get("credit-notes")
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "List credit notes" })
  async listCreditNotes(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
  ) {
    return this.returnsService.listCreditNotes(req.user.tenantId, customerId);
  }

  @Get("analytics")
  @Permissions("sales.returns.view")
  @ApiOperation({ summary: "Get return analytics" })
  async getReturnAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.returnsService.getReturnAnalytics(req.user.tenantId, period);
  }
}
