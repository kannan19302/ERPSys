import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmPipelineStagesService,
  createPipelineStageSchema,
  updatePipelineStageSchema,
  reorderStagesSchema,
  CreatePipelineStageInput,
  UpdatePipelineStageInput,
  ReorderStagesInput,
} from './crm-pipeline-stages.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-pipeline-stages')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineStagesController {
  constructor(private readonly svc: CrmPipelineStagesService) {}

  @ApiOperation({ summary: 'List' })
  @Get('pipelines/:pipelineId/stages')
  @Permissions('crm.pipelines.read')
  async list(@Req() req: AuthenticatedRequest, @Param('pipelineId') pipelineId: string) {
    return this.svc.listStages(req.user.tenantId, pipelineId);
  }

  @ApiOperation({ summary: 'Get One' })
  @Get('pipelines/:pipelineId/stages/:id')
  @Permissions('crm.pipelines.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('pipelineId') pipelineId: string, @Param('id') id: string) {
    return this.svc.getStage(req.user.tenantId, pipelineId, id);
  }

  @ApiOperation({ summary: 'Create' })
  @Post('pipelines/:pipelineId/stages')
  @Permissions('crm.pipelines.create')
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('pipelineId') pipelineId: string,
    @ZodBody(createPipelineStageSchema) dto: CreatePipelineStageInput,
  ) {
    return this.svc.createStage(req.user.tenantId, pipelineId, dto);
  }

  @ApiOperation({ summary: 'Update' })
  @Put('pipelines/:pipelineId/stages/:id')
  @Permissions('crm.pipelines.update')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('pipelineId') pipelineId: string,
    @Param('id') id: string,
    @ZodBody(updatePipelineStageSchema) dto: UpdatePipelineStageInput,
  ) {
    return this.svc.updateStage(req.user.tenantId, pipelineId, id, dto);
  }

  @ApiOperation({ summary: 'Remove' })
  @Delete('pipelines/:pipelineId/stages/:id')
  @Permissions('crm.pipelines.delete')
  async remove(@Req() req: AuthenticatedRequest, @Param('pipelineId') pipelineId: string, @Param('id') id: string) {
    return this.svc.deleteStage(req.user.tenantId, pipelineId, id);
  }

  @ApiOperation({ summary: 'Reorder' })
  @Post('pipelines/:pipelineId/stages/reorder')
  @Permissions('crm.pipelines.update')
  async reorder(
    @Req() req: AuthenticatedRequest,
    @Param('pipelineId') pipelineId: string,
    @ZodBody(reorderStagesSchema) dto: ReorderStagesInput,
  ) {
    return this.svc.reorder(req.user.tenantId, pipelineId, dto.stages);
  }
}
