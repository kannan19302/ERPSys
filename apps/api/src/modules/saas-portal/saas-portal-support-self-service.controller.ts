import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalSupportSelfServiceService } from "./saas-portal-support-self-service.service";

@ApiTags("SaasPortalSupportSelfService")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/support-self-service")
export class SaasPortalSupportSelfServiceController {
  constructor(
    private readonly supportService: SaasPortalSupportSelfServiceService,
  ) {}

  @ApiOperation({ summary: "Get customer support tickets" })
  @Permissions("saas_portal.support.read")
  @Get("tickets")
  async getTickets(@Req() req: any) {
    return this.supportService.getTickets(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create support ticket" })
  @Permissions("saas_portal.support.create")
  @Post("tickets")
  async createTicket(@Req() req: any, @Body() dto: any) {
    return this.supportService.createTicket(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({ summary: "Add message to ticket thread" })
  @Permissions("saas_portal.support.update")
  @Post("tickets/:id/messages")
  async addMessage(
    @Req() req: any,
    @Param("id") ticketId: string,
    @Body() dto: { message: string; attachments?: any },
  ) {
    return this.supportService.addMessage(
      req.user.tenantId,
      req.user.userId,
      ticketId,
      dto,
    );
  }
}
