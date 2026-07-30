// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesReturnsDeepService } from "./sales-returns-deep.service";

@ApiTags("SalesReturnsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/returns-deep")
export class SalesReturnsDeepController {
  constructor(private readonly returnsService: SalesReturnsDeepService) {}

  @ApiOperation({ summary: "Get return orders" })
  @Permissions("sales.returns.read")
  @Get()
  async getReturns(@Req() req: any, @Query("status") status?: string) {
    return this.returnsService.getReturns(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Get return analytics" })
  @Permissions("sales.returns.read")
  @Get("analytics")
  async getReturnAnalytics(@Req() req: any) {
    return this.returnsService.getReturnAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get return order by ID" })
  @Permissions("sales.returns.read")
  @Get(":id")
  async getReturnById(@Req() req: any, @Param("id") id: string) {
    return this.returnsService.getReturnById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create return order" })
  @Permissions("sales.returns.create")
  @Post()
  async createReturn(@Req() req: any, @Body() dto: any) {
    return this.returnsService.createReturn(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update return order status" })
  @Permissions("sales.returns.update")
  @Put(":id/status")
  async updateReturnStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.returnsService.updateReturnStatus(
      req.user.tenantId,
      id,
      status,
      req.user.userId,
    );
  }
}
