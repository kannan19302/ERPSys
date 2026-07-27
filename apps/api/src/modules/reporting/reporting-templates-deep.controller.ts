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
import { ReportingTemplatesDeepService } from "./reporting-templates-deep.service";

@ApiTags("ReportingTemplatesDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/templates-deep")
export class ReportingTemplatesDeepController {
  constructor(
    private readonly templateService: ReportingTemplatesDeepService,
  ) {}

  @ApiOperation({ summary: "Get report templates" })
  @Permissions("reporting.templates.read")
  @Get("templates")
  async getTemplates(@Req() req: any) {
    return this.templateService.getTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create report template" })
  @Permissions("reporting.templates.create")
  @Post("templates")
  async createTemplate(
    @Req() req: any,
    @Body()
    dto: {
      title: string;
      category: string;
      layoutHtml: string;
      headerFooter?: any;
    },
  ) {
    return this.templateService.createTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Add section to report template" })
  @Permissions("reporting.templates.update")
  @Post("templates/:id/sections")
  async addSection(
    @Param("id") templateId: string,
    @Body()
    dto: {
      sectionName: string;
      sectionOrder: number;
      dataSourceSql?: string;
      chartConfig?: any;
    },
  ) {
    return this.templateService.addSection(templateId, dto);
  }
}
