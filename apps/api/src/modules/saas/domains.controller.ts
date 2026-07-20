import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { DomainService } from "./domain-service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const addDomainSchema = z.object({
  domain: z.string().min(1).max(255),
  isPrimary: z.boolean().default(false),
});

@ApiTags("saas-domains")
@ApiBearerAuth()
@Controller("saas/domains")
@UseGuards(JwtAuthGuard, RbacGuard)
export class DomainsController {
  constructor(private readonly domainService: DomainService) {}

  @ApiOperation({ summary: "List domains" })
  @Permissions("saas.domain.read")
  @Get()
  async listDomains(@Req() req: AuthReq) {
    return this.domainService.listDomains(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add domain" })
  @Permissions("saas.domain.create")
  @Post()
  async addDomain(@Req() req: AuthReq, @ZodBody(addDomainSchema) body: z.infer<typeof addDomainSchema>) {
    return this.domainService.addDomain(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Verify domain" })
  @Permissions("saas.domain.create")
  @Post(":id/verify")
  async verifyDomain(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.verifyDomain(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Remove domain" })
  @Permissions("saas.domain.delete")
  @Delete(":id")
  async removeDomain(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.removeDomain(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Set primary domain" })
  @Permissions("saas.domain.create")
  @Patch(":id/primary")
  async setPrimaryDomain(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.setPrimaryDomain(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get domain" })
  @Permissions("saas.domain.read")
  @Get(":id")
  async getDomain(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.getDomain(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Request SSL certificate" })
  @Permissions("saas.domain.create")
  @Post(":id/ssl")
  async requestSslCertificate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.requestSslCertificate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Check SSL status" })
  @Permissions("saas.domain.read")
  @Get(":id/ssl")
  async checkSslStatus(@Req() req: AuthReq, @Param("id") id: string) {
    return this.domainService.checkSslStatus(req.user.tenantId, id);
  }
}
