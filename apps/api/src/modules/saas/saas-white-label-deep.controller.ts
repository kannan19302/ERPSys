import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasWhiteLabelDeepService } from "./saas-white-label-deep.service";

@ApiTags("SaasWhiteLabelDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/white-label-deep")
export class SaasWhiteLabelDeepController {
  constructor(private readonly whiteLabelService: SaasWhiteLabelDeepService) {}

  @ApiOperation({ summary: "Get custom domains" })
  @Permissions("saas.whitelabel.read")
  @Get("domains")
  async getDomains(@Req() req: any) {
    return this.whiteLabelService.getDomains(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add custom domain" })
  @Permissions("saas.whitelabel.create")
  @Post("domains")
  async addCustomDomain(
    @Req() req: any,
    @Body() dto: { customDomain: string; brandingConfig?: any },
  ) {
    return this.whiteLabelService.addCustomDomain(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Verify custom domain DNS" })
  @Permissions("saas.whitelabel.update")
  @Put("domains/:id/verify")
  async verifyDomain(@Req() req: any, @Param("id") id: string) {
    return this.whiteLabelService.verifyDomain(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Issue SSL certificate" })
  @Permissions("saas.whitelabel.update")
  @Post("domains/:id/ssl")
  async issueSslCert(@Req() req: any, @Param("id") domainId: string) {
    return this.whiteLabelService.issueSslCert(req.user.tenantId, domainId);
  }
}
