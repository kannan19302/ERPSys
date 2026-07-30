// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasResellerChannelDeepService } from "./saas-reseller-channel-deep.service";

@ApiTags("SaasResellerChannelDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/reseller-channel-deep")
export class SaasResellerChannelDeepController {
  constructor(
    private readonly resellerService: SaasResellerChannelDeepService,
  ) {}

  @ApiOperation({ summary: "Get partner reseller channels" })
  @Permissions("saas.resellers.read")
  @Get("resellers")
  async getResellers() {
    return this.resellerService.getResellers();
  }

  @ApiOperation({ summary: "Create reseller channel" })
  @Permissions("saas.resellers.create")
  @Post("resellers")
  async createReseller(@Body() dto: any) {
    return this.resellerService.createReseller(dto);
  }

  @ApiOperation({ summary: "Get reseller commissions" })
  @Permissions("saas.resellers.read")
  @Get("commissions")
  async getCommissions(
    @Query("resellerId") resellerId?: string,
    @Query("period") period?: string,
  ) {
    return this.resellerService.getCommissions(resellerId, period);
  }

  @ApiOperation({ summary: "Record reseller commission" })
  @Permissions("saas.resellers.update")
  @Post("commissions")
  async recordCommission(@Body() dto: any) {
    return this.resellerService.recordCommission(dto);
  }
}
