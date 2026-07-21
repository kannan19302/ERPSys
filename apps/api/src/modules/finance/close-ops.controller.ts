import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { z } from "zod";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CloseOpsService } from "./close-ops.service";

const taskSchema = z.object({
  financialPeriodId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
  createdBy: z.string().min(1),
});
const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  createdBy: z.string().min(1),
});
const periodSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

interface AuthReq extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("finance/close")
@ApiBearerAuth()
@Controller("finance/close")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CloseOpsController {
  constructor(private readonly closeOpsService: CloseOpsService) {}

  @Get("tasks/:financialPeriodId")
  @Permissions("finance.read")
  async getCloseTasks(
    @Req() req: AuthReq,
    @Param("financialPeriodId") fpId: string,
    @Query() query: any,
  ) {
    return this.closeOpsService.getCloseTasks(req.user.tenantId, fpId, query);
  }

  @Post("tasks")
  @Permissions("finance.read")
  async createCloseTask(@Req() req: AuthReq, @Body() body: any) {
    const parsed = taskSchema.parse(body);
    return this.closeOpsService.createCloseTask(req.user.tenantId, parsed);
  }

  @Patch("tasks/:id/status")
  @Permissions("finance.read")
  async updateTaskStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.closeOpsService.updateCloseTaskStatus(
      req.user.tenantId,
      id,
      body.status,
      body?.completedBy,
      body?.notes,
    );
  }

  @Get("templates")
  @Permissions("finance.read")
  async getTemplates(@Req() req: AuthReq) {
    return this.closeOpsService.getCloseTaskTemplates(req.user.tenantId);
  }

  @Post("templates")
  @Permissions("finance.read")
  async createTemplate(@Req() req: AuthReq, @Body() body: any) {
    const parsed = templateSchema.parse(body);
    return this.closeOpsService.createCloseTaskTemplate(
      req.user.tenantId,
      parsed,
    );
  }

  @Post("templates/apply")
  @Permissions("finance.read")
  async applyTemplates(@Req() req: AuthReq, @Body() body: any) {
    return this.closeOpsService.applyTaskTemplates(
      req.user.tenantId,
      body.financialPeriodId,
      body.templateIds,
      body.createdBy,
    );
  }

  @Get("status/:financialPeriodId")
  @Permissions("finance.read")
  async getCloseStatus(
    @Req() req: AuthReq,
    @Param("financialPeriodId") fpId: string,
  ) {
    return this.closeOpsService.getCloseStatus(req.user.tenantId, fpId);
  }

  @Get("financial-periods")
  @Permissions("finance.read")
  async getFinancialPeriods(@Req() req: AuthReq, @Query() query: any) {
    return this.closeOpsService.getFinancialPeriods(req.user.tenantId, query);
  }

  @Post("financial-periods")
  @Permissions("finance.read")
  async createFinancialPeriod(@Req() req: AuthReq, @Body() body: any) {
    const parsed = periodSchema.parse(body);
    return this.closeOpsService.createFinancialPeriod(
      req.user.tenantId,
      parsed,
    );
  }

  @Post("financial-periods/:id/close")
  @Permissions("finance.read")
  async closePeriod(@Req() req: AuthReq, @Param("id") id: string) {
    return this.closeOpsService.closeFinancialPeriod(req.user.tenantId, id);
  }

  @Post("financial-periods/:id/reopen")
  @Permissions("finance.read")
  async reopenPeriod(@Req() req: AuthReq, @Param("id") id: string) {
    return this.closeOpsService.reopenFinancialPeriod(req.user.tenantId, id);
  }
}
