import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmGamificationDeepService } from "./crm-gamification-deep.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-gamification-deep")
@ApiBearerAuth()
@Controller("crm/gamification-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGamificationDeepController {
  constructor(private readonly svc: CrmGamificationDeepService) {}
  @Permissions("crm.gamification-dashboard.read")
  @Get("gd_0")
  async g0() {
    return this.svc.getGamificationDashboard();
  }
  @Permissions("crm.sale-contest.read")
  @Get("gd_1")
  async g1() {
    return this.svc.getSalesContests();
  }
  @Permissions("crm.sale-contest.create")
  @Get("gd_2")
  async g2() {
    return this.svc.createSalesContest();
  }
  @Permissions("crm.leaderboard.read")
  @Get("gd_3")
  async g3() {
    return this.svc.getLeaderboard();
  }
  @Permissions("crm.badge.read")
  @Get("gd_4")
  async g4() {
    return this.svc.getBadges();
  }
  @Permissions("crm.badge.award")
  @Get("gd_5")
  async g5() {
    return this.svc.awardBadge();
  }
  @Permissions("crm.point-history.read")
  @Get("gd_6")
  async g6() {
    return this.svc.getPointsHistory();
  }
}
