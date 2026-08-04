import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { MarketplaceService } from "./marketplace.service";
import { ControlPlaneGuard } from "../../../common/guards/control-plane.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";

@Controller("marketplace")
@UseGuards(ControlPlaneGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get("submissions")
  @Permissions("system.marketplace.read")
  async listSubmissions() {
    return this.marketplaceService.listSubmissions();
  }

  @Post(":id/approve")
  @Permissions("system.marketplace.manage")
  async approveExtension(@Param("id") id: string) {
    return this.marketplaceService.approveExtension(id);
  }

  @Post(":id/reject")
  @Permissions("system.marketplace.manage")
  async rejectExtension(
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.marketplaceService.rejectExtension(id, reason);
  }
}
