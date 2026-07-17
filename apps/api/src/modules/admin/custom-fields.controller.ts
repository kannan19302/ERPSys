import { Controller, Get, Post, Patch, Delete, Put, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/custom-fields')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @ApiOperation({ summary: 'Get definitions' })
  @Get()
  @Permissions('admin.custom-fields.read')
  async getDefinitions(
    @Req() req: AuthenticatedRequest,
    @Query('entityType') entityType?: string,
  ) {
    return this.customFieldsService.getDefinitions(req.user.tenantId, entityType);
  }

  @ApiOperation({ summary: 'Get entity types' })
  @Get('entity-types')
  @Permissions('admin.custom-fields.read')
  async getEntityTypes() {
    return this.customFieldsService.getEntityTypes();
  }

  @ApiOperation({ summary: 'Create definition' })
  @Post()
  @Permissions('admin.custom-fields.create')
  async createDefinition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
      entityType: string;
      fieldName: string;
      label: string;
      fieldType: string;
      description?: string;
      isRequired?: boolean;
      defaultValue?: string;
      options?: any;
      validation?: any;
      sortOrder?: number;
      section?: string;
    },
  ) {
    return this.customFieldsService.createDefinition(req.user.tenantId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update definition' })
  @Patch(':id')
  @Permissions('admin.custom-fields.update')
  async updateDefinition(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: {
      label?: string;
      description?: string;
      isRequired?: boolean;
      defaultValue?: string;
      options?: any;
      validation?: any;
      sortOrder?: number;
      section?: string;
      isActive?: boolean;
    },
  ) {
    return this.customFieldsService.updateDefinition(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete definition' })
  @Delete(':id')
  @Permissions('admin.custom-fields.delete')
  async deleteDefinition(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.customFieldsService.deleteDefinition(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get values' })
  @Get('values/:entityType/:entityId')
  @Permissions('admin.custom-fields.read')
  async getValues(
    @Req() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldsService.getValues(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Save values' })
  @Put('values/:entityType/:entityId')
  @Permissions('admin.custom-fields.update')
  async saveValues(
    @Req() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @ZodBody(z.any()) dto: { values: { fieldId: string; value: string }[] },
  ) {
    return this.customFieldsService.saveValues(req.user.tenantId, entityType, entityId, dto.values);
  }
}
