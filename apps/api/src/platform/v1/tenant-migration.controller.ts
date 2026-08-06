import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasTenantMigrationDeepService } from "./tenant-migration.service";

@ApiTags("SaasTenantMigrationDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("platform/v1/tenant-migration-deep")
export class SaasTenantMigrationDeepController {
  constructor(
    private readonly migrationService: SaasTenantMigrationDeepService,
  ) {}

  @ApiOperation({ summary: "Get tenant migration jobs" })
  @Permissions("saas.migration.read")
  @Get("jobs")
  async getMigrationJobs(@Req() req: any) {
    return this.migrationService.getMigrationJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Start tenant cluster migration" })
  @Permissions("saas.migration.create")
  @Post("start")
  async startMigration(
    @Req() req: any,
    @Body() dto: { sourceCluster: string; targetCluster: string },
  ) {
    return this.migrationService.startMigration(req.user.tenantId, dto);
  }
}
