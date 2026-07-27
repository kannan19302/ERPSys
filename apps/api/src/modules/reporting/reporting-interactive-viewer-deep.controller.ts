import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingInteractiveViewerDeepService } from "./reporting-interactive-viewer-deep.service";

@ApiTags("ReportingInteractiveViewerDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/interactive-viewer-deep")
export class ReportingInteractiveViewerDeepController {
  constructor(
    private readonly viewerService: ReportingInteractiveViewerDeepService,
  ) {}

  @ApiOperation({ summary: "Get interactive report viewer sessions" })
  @Permissions("reporting.viewer.read")
  @Get("sessions")
  async getViewerSessions(@Req() req: any) {
    return this.viewerService.getViewerSessions(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create shareable interactive viewer session" })
  @Permissions("reporting.viewer.create")
  @Post("sessions")
  async createViewerSession(
    @Req() req: any,
    @Body()
    dto: { reportTitle: string; filters?: any; interactiveMode?: string },
  ) {
    return this.viewerService.createViewerSession(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }
}
