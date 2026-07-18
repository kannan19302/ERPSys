import { Controller, Post, Body, UseGuards, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { prisma } from '@unerp/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReplayDeadLetterDto, ReplayDeadLetterResponseDto } from './dto/replay-dead-letter.dto';
import { OutboxMetricsService } from './outbox-metrics.service';

@ApiTags('outbox')
@ApiBearerAuth()
@Controller('outbox')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OutboxController {
  constructor(private readonly metrics: OutboxMetricsService) {}

  @ApiOperation({ summary: 'Re-drive a DEAD outbox delivery' })
  @Permissions('admin.outbox.replay')
  @Post('replay-dead-letter')
  async replayDeadLetter(
    @Body() dto: ReplayDeadLetterDto,
  ): Promise<ReplayDeadLetterResponseDto> {
    const delivery = await prisma.outboxDelivery.findUnique({
      where: { id: dto.outboxDeliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${dto.outboxDeliveryId} not found`);
    }

    if (delivery.status !== 'DEAD') {
      throw new ConflictException(`Delivery ${dto.outboxDeliveryId} is not in DEAD status (current: ${delivery.status})`);
    }

    try {
      await prisma.outboxDelivery.update({
        where: { id: dto.outboxDeliveryId },
        data: {
          status: 'PENDING',
          attempts: 0,
          lastError: null,
          availableAt: new Date(),
          failedAt: null,
        },
      });

      return {
        success: true,
        deliveryId: dto.outboxDeliveryId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Failed to replay delivery: ${message}`);
    }
  }

  @ApiOperation({ summary: 'Get outbox metrics' })
  @Permissions('admin.outbox.read')
  @Post('metrics')
  async getMetrics() {
    await this.metrics.refresh();
    return this.metrics.getSnapshot();
  }
}
