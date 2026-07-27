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
import { ReportingDistributionListsDeepService } from "./reporting-distribution-lists-deep.service";

@ApiTags("ReportingDistributionListsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/distribution-lists-deep")
export class ReportingDistributionListsDeepController {
  constructor(
    private readonly listService: ReportingDistributionListsDeepService,
  ) {}

  @ApiOperation({ summary: "Get report distribution lists" })
  @Permissions("reporting.distribution.read")
  @Get("lists")
  async getLists(@Req() req: any) {
    return this.listService.getLists(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create report distribution list" })
  @Permissions("reporting.distribution.create")
  @Post("lists")
  async createList(
    @Req() req: any,
    @Body() dto: { listName: string; description?: string },
  ) {
    return this.listService.createList(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Add recipient to distribution list" })
  @Permissions("reporting.distribution.update")
  @Post("lists/:id/recipients")
  async addRecipient(
    @Param("id") listId: string,
    @Body() dto: { recipientEmail: string; recipientName: string },
  ) {
    return this.listService.addRecipient(listId, dto);
  }
}
