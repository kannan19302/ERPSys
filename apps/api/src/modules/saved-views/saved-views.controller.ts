import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('saved-views')
@ApiBearerAuth()
@Controller('saved-views')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @ApiOperation({ summary: 'Get saved views for a resource' })
  @Get()
  @Permissions('reporting.saved-views.read')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('resourceName') resourceName: string,
  ) {
    return this.savedViewsService.findAll(req.user.tenantId, req.user.userId, resourceName);
  }

  @ApiOperation({ summary: 'Create or update a saved view' })
  @Post()
  @Permissions('reporting.saved-views.create')
  async createOrUpdate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.createOrUpdate(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete a saved view' })
  @Delete(':id')
  @Permissions('reporting.saved-views.delete')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.savedViewsService.delete(req.user.tenantId, req.user.userId, id);
  }
}
