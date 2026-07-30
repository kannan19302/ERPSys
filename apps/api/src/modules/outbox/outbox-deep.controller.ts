// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { OutboxDeepService } from "./outbox-deep.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  RequeueDlqSchema,
  DlqActionSchema,
  DlqBatchActionSchema,
  UpdateDispatcherSchema,
  DeadLetterActionSchema,
  OutboxAnalyticsQuerySchema,
} from "@unerp/shared";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("outbox")
@ApiBearerAuth()
@Controller("outbox")
@UseGuards(JwtAuthGuard, RbacGuard)
export class OutboxDeepController {
  constructor(private readonly outboxDeepService: OutboxDeepService) {}

  // DLQ
  @Get("dlq")
  @Permissions("outbox.dlq.read")
  @ApiOperation({ summary: "List DLQ entries" })
  async getDlqEntries(
    @Req() req: AuthReq,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.outboxDeepService.getDlqEntries(
      req.user.tenantId,
      status,
      +page,
      +limit,
    );
  }

  @Get("dlq/stats")
  @Permissions("outbox.dlq.read")
  @ApiOperation({ summary: "Get DLQ stats" })
  async getDlqStats(@Req() req: AuthReq) {
    return this.outboxDeepService.getDlqStats(req.user.tenantId);
  }

  @Get("dlq/:id")
  @Permissions("outbox.dlq.read")
  @ApiOperation({ summary: "Get DLQ entry" })
  async getDlqEntry(@Req() req: AuthReq, @Param("id") id: string) {
    return this.outboxDeepService.getDlqEntry(req.user.tenantId, id);
  }

  @Post("dlq/requeue")
  @Permissions("outbox.dlq.requeue")
  @ApiOperation({ summary: "Requeue DLQ entries" })
  async requeueDlq(@Req() req: AuthReq, @ZodBody(RequeueDlqSchema) dto: any) {
    return this.outboxDeepService.batchRequeue(req.user.tenantId, dto);
  }

  @Post("dlq/:id/archive")
  @Permissions("outbox.dlq.archive")
  @ApiOperation({ summary: "Archive DLQ entry" })
  async archiveDlq(@Req() req: AuthReq, @Param("id") id: string) {
    return this.outboxDeepService.archiveDlqEntry(req.user.tenantId, id);
  }

  @Post("dlq/:id/discard")
  @Permissions("outbox.dlq.discard")
  @ApiOperation({ summary: "Discard DLQ entry" })
  async discardDlq(@Req() req: AuthReq, @Param("id") id: string) {
    return this.outboxDeepService.discardDlqEntry(req.user.tenantId, id);
  }

  @Post("dlq/batch")
  @Permissions("outbox.dlq.requeue")
  @ApiOperation({ summary: "Batch DLQ actions" })
  async batchDlqAction(
    @Req() req: AuthReq,
    @ZodBody(DlqBatchActionSchema) dto: any,
  ) {
    return this.outboxDeepService.batchAction(req.user.tenantId, dto);
  }

  // Dead Letters
  @Get("dead-letters")
  @Permissions("outbox.dead-letter.read")
  @ApiOperation({ summary: "List dead letter messages" })
  async getDeadLetters(
    @Req() req: AuthReq,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.outboxDeepService.getDeadLetters(
      req.user.tenantId,
      +page,
      +limit,
    );
  }

  @Get("dead-letters/:id")
  @Permissions("outbox.dead-letter.read")
  @ApiOperation({ summary: "Get dead letter message" })
  async getDeadLetter(@Req() req: AuthReq, @Param("id") id: string) {
    return this.outboxDeepService.getDeadLetter(req.user.tenantId, id);
  }

  @Post("dead-letters/:id/retry")
  @Permissions("outbox.dead-letter.retry")
  @ApiOperation({ summary: "Retry dead letter message" })
  async retryDeadLetter(@Req() req: AuthReq, @Param("id") id: string) {
    return this.outboxDeepService.retryDeadLetter(req.user.tenantId, id);
  }

  @Post("dead-letters/:id/action")
  @Permissions("outbox.dead-letter.read")
  @ApiOperation({ summary: "Action dead letter message" })
  async actionDeadLetter(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(DeadLetterActionSchema) dto: any,
  ) {
    return this.outboxDeepService.actionDeadLetter(
      req.user.tenantId,
      id,
      dto.action,
      req.user.email,
      dto.notes,
    );
  }

  // Retry Logs
  @Get("retry-logs")
  @Permissions("outbox.retry-log.read")
  @ApiOperation({ summary: "List retry logs" })
  async getRetryLogs(
    @Req() req: AuthReq,
    @Query("deliveryId") deliveryId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.outboxDeepService.getRetryLogs(
      req.user.tenantId,
      deliveryId,
      +page,
      +limit,
    );
  }

  // Dispatcher
  @Get("dispatcher")
  @Permissions("outbox.dispatcher.read")
  @ApiOperation({ summary: "List dispatcher states" })
  async getDispatchers(@Req() req: AuthReq) {
    return this.outboxDeepService.getDispatcherStates(req.user.tenantId);
  }

  @Get("dispatcher/:name")
  @Permissions("outbox.dispatcher.read")
  @ApiOperation({ summary: "Get dispatcher state" })
  async getDispatcher(@Req() req: AuthReq, @Param("name") name: string) {
    return this.outboxDeepService.getDispatcherState(req.user.tenantId, name);
  }

  @Put("dispatcher/:name")
  @Permissions("outbox.dispatcher.update")
  @ApiOperation({ summary: "Update dispatcher state" })
  async updateDispatcher(
    @Req() req: AuthReq,
    @Param("name") name: string,
    @ZodBody(UpdateDispatcherSchema) dto: any,
  ) {
    return this.outboxDeepService.updateDispatcherState(
      req.user.tenantId,
      name,
      dto,
    );
  }

  @Get("dispatcher/health")
  @Permissions("outbox.dispatcher.read")
  @ApiOperation({ summary: "Get dispatcher health" })
  async getDispatcherHealth(@Req() req: AuthReq) {
    return this.outboxDeepService.getDispatcherHealth(req.user.tenantId);
  }

  // Analytics
  @Get("analytics")
  @Permissions("outbox.analytics.read")
  @ApiOperation({ summary: "Get outbox analytics" })
  async getAnalytics(@Req() req: AuthReq, @Query("period") period?: string) {
    return this.outboxDeepService.getAnalytics(
      req.user.tenantId,
      period || "7d",
    );
  }

  @Get("analytics/poison-messages")
  @Permissions("outbox.analytics.read")
  @ApiOperation({ summary: "Detect poison messages" })
  async detectPoison(@Req() req: AuthReq) {
    return this.outboxDeepService.detectPoisonMessages(req.user.tenantId);
  }
}
