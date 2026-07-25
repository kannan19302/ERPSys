import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmContentManagementService } from "./crm-content-management.service";
@ApiTags("crm-content-management")
@ApiBearerAuth()
@Controller("crm/content-management")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContentManagementController {
  constructor(private readonly svc: CrmContentManagementService) {}
  @Get("cm_0") async g0() {
    return this.svc.getContentItems();
  }
  @Get("cm_1") async g1() {
    return this.svc.createContentItem();
  }
  @Get("cm_2") async g2() {
    return this.svc.updateContentItem();
  }
  @Get("cm_3") async g3() {
    return this.svc.deleteContentItem();
  }
  @Get("cm_4") async g4() {
    return this.svc.getContentAnalytics();
  }
}
