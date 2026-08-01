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
import { AdvancedHrLearningPathsDeepService } from "./advanced-hr-learning-paths-deep.service";

@ApiTags("AdvancedHrLearningPathsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/learning-paths-deep")
export class AdvancedHrLearningPathsDeepController {
  constructor(
    private readonly learningService: AdvancedHrLearningPathsDeepService,
  ) {}

  @ApiOperation({ summary: "Get corporate learning paths" })
  @Permissions("advanced-hr.learning.read")
  @Get("paths")
  async getPaths(@Req() req: any) {
    return this.learningService.getPaths(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create corporate learning path" })
  @Permissions("advanced-hr.learning.create")
  @Post("paths")
  async createPath(
    @Req() req: any,
    @Body() dto: { pathName: string; category: string; estimatedHours: number },
  ) {
    return this.learningService.createPath(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Enroll employee in learning path" })
  @Permissions("advanced-hr.learning.update")
  @Post("paths/:id/enroll")
  async enrollEmployee(
    @Req() req: any,
    @Param("id") pathId: string,
    @Body() dto: { employeeId: string },
  ) {
    return this.learningService.enrollEmployee(
      pathId,
      req.user.tenantId,
      dto.employeeId,
    );
  }
}
