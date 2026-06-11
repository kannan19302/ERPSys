import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { LocalizationService } from './localization.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/localization')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('languages')
  async getLanguages() {
    return this.localizationService.getLanguages();
  }

  @Get('overrides')
  @Permissions('admin.localization.read')
  async getOverrides(@Req() req: AuthenticatedRequest) {
    return this.localizationService.getOverrides(req.user.tenantId);
  }

  @Post('overrides')
  @Permissions('admin.localization.create')
  async createOrUpdateOverride(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { locale: string; key: string; translation: string }
  ) {
    return this.localizationService.createOrUpdateOverride(req.user.tenantId, dto);
  }

  @Delete('overrides/:id')
  @Permissions('admin.localization.delete')
  async deleteOverride(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.localizationService.deleteOverride(req.user.tenantId, id);
  }
}
