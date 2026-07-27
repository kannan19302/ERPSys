import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AdvancedHrCompensationBandsDeepService } from "./advanced-hr-compensation-bands-deep.service";

@ApiTags("AdvancedHrCompensationBandsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/compensation-bands-deep")
export class AdvancedHrCompensationBandsDeepController {
  constructor(
    private readonly compService: AdvancedHrCompensationBandsDeepService,
  ) {}

  @ApiOperation({ summary: "Get compensation salary bands" })
  @Permissions("advanced-hr.compensation.read")
  @Get("bands")
  async getBands(@Req() req: any) {
    return this.compService.getBands(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create compensation salary band" })
  @Permissions("advanced-hr.compensation.create")
  @Post("bands")
  async createBand(
    @Req() req: any,
    @Body()
    dto: {
      bandName: string;
      jobLevel: string;
      minSalary: number;
      midSalary: number;
      maxSalary: number;
      currency?: string;
      effectiveDate: string;
    },
  ) {
    return this.compService.createBand(req.user.tenantId, dto);
  }
}
