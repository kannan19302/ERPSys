// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesPlaybooksDeepService } from "./sales-playbooks-deep.service";

@ApiTags("SalesPlaybooksDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/playbooks-deep")
export class SalesPlaybooksDeepController {
  constructor(private readonly playbooksService: SalesPlaybooksDeepService) {}

  @ApiOperation({ summary: "Get playbooks" })
  @Permissions("sales.playbooks.read")
  @Get()
  async getPlaybooks(@Req() req: any, @Query("stage") stage?: string) {
    return this.playbooksService.getPlaybooks(req.user.tenantId, stage);
  }

  @ApiOperation({ summary: "Get playbook by ID" })
  @Permissions("sales.playbooks.read")
  @Get(":id")
  async getPlaybookById(@Req() req: any, @Param("id") id: string) {
    return this.playbooksService.getPlaybookById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create playbook" })
  @Permissions("sales.playbooks.create")
  @Post()
  async createPlaybook(@Req() req: any, @Body() dto: any) {
    return this.playbooksService.createPlaybook(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update playbook" })
  @Permissions("sales.playbooks.update")
  @Put(":id")
  async updatePlaybook(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.playbooksService.updatePlaybook(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Add step to playbook" })
  @Permissions("sales.playbooks.update")
  @Post(":id/steps")
  async addStep(
    @Req() req: any,
    @Param("id") playbookId: string,
    @Body() dto: any,
  ) {
    return this.playbooksService.addStep(req.user.tenantId, playbookId, dto);
  }

  @ApiOperation({ summary: "Delete playbook" })
  @Permissions("sales.playbooks.delete")
  @Delete(":id")
  async deletePlaybook(@Req() req: any, @Param("id") id: string) {
    return this.playbooksService.deletePlaybook(req.user.tenantId, id);
  }
}
