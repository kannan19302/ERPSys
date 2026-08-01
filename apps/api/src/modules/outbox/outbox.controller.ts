import {
  Controller,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import {
  ReplayDeadLetterDto,
  ReplayDeadLetterResponseDto,
} from "./dto/replay-dead-letter.dto";
import { OutboxMetricsService } from "./outbox-metrics.service";

@ApiTags("outbox")
@ApiBearerAuth()
@Controller("outbox")
@UseGuards(JwtAuthGuard, RbacGuard)
export class OutboxController {
  constructor(private readonly metrics: OutboxMetricsService) {}

  @ApiOperation({ summary: "Re-drive a DEAD outbox delivery" })
  @Permissions("admin.outbox.replay")
  @Post("replay-dead-letter")
  async replayDeadLetter(
    @Body() dto: ReplayDeadLetterDto,
  ): Promise<ReplayDeadLetterResponseDto> {
    const res = await this.metrics.replayDeadLetter(dto.outboxDeliveryId);
    if (!res.found) {
      throw new NotFoundException(`Delivery ${dto.outboxDeliveryId} not found`);
    }
    if (!res.dead) {
      throw new ConflictException(
        `Delivery ${dto.outboxDeliveryId} is not in DEAD status (current: ${res.currentStatus})`,
      );
    }

    return {
      success: true,
      deliveryId: dto.outboxDeliveryId,
    };
  }

  @ApiOperation({ summary: "Get outbox metrics" })
  @Permissions("admin.outbox.read")
  @Post("metrics")
  async getMetrics() {
    await this.metrics.refresh();
    return this.metrics.getSnapshot();
  }
}
