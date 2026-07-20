import {
  Controller,
  Get,
  Post,
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
import { DataExportService } from "./data-export.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const requestExportSchema = z.object({
  module: z.string().min(1),
  format: z.enum(["csv", "json", "xlsx", "pdf"]).default("csv"),
  filters: z.record(z.unknown()).optional(),
  fields: z.array(z.string()).optional(),
  includeRelations: z.boolean().default(false),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

@ApiTags("saas-exports")
@ApiBearerAuth()
@Controller("saas/exports")
@UseGuards(JwtAuthGuard, RbacGuard)
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  @ApiOperation({ summary: "Request a data export" })
  @Permissions("saas.export.create")
  @Post()
  async requestExport(@Req() req: AuthReq, @ZodBody(requestExportSchema) body: z.infer<typeof requestExportSchema>) {
    return this.dataExportService.requestExport(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: "List export jobs" })
  @Permissions("saas.export.read")
  @Get()
  async listExportJobs(@Req() req: AuthReq) {
    return this.dataExportService.listExportJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get export job" })
  @Permissions("saas.export.read")
  @Get(":id")
  async getExportJob(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataExportService.getExportJob(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Download export" })
  @Permissions("saas.export.create")
  @Get(":id/download")
  async downloadExport(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataExportService.downloadExport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Cancel export" })
  @Permissions("saas.export.create")
  @Post(":id/cancel")
  async cancelExport(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataExportService.cancelExport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get available export formats" })
  @Permissions("saas.export.read")
  @Get("formats")
  async getExportFormats() {
    return this.dataExportService.getExportFormats();
  }
}
