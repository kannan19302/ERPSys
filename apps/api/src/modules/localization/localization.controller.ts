import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { LocalizationService } from './localization.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('localization')
@ApiBearerAuth()
@Controller('admin/localization')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @ApiOperation({ summary: 'Get languages' })
  @Permissions('localization.read')
  @Get('languages')
  async getLanguages() {
    return this.localizationService.getLanguages();
  }

  @ApiOperation({ summary: 'Get overrides' })
  @Get('overrides')
  @Permissions('admin.localization.read')
  async getOverrides(@Req() req: AuthenticatedRequest) {
    return this.localizationService.getOverrides(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create or update override' })
  @Post('overrides')
  @Permissions('admin.localization.create')
  async createOrUpdateOverride(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { locale: string; key: string; translation: string }
  ) {
    return this.localizationService.createOrUpdateOverride(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Delete override' })
  @Delete('overrides/:id')
  @Permissions('admin.localization.delete')
  async deleteOverride(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.localizationService.deleteOverride(req.user.tenantId, id);
  }
}
