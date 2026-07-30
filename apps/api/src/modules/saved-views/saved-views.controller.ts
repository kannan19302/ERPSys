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
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SavedViewsService } from "./saved-views.service";
import { SavedViewsDeepService } from "./saved-views-deep.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createViewSchema = z.object({
  resourceName: z.string().min(1),
  name: z.string().min(1).max(100),
  state: z.record(z.any()),
});
const layoutSchema = z.object({
  viewId: z.string().min(1),
  layoutType: z.string().optional(),
  columns: z.array(z.any()).optional(),
  groupBy: z.string().optional(),
  sortBy: z.array(z.any()).optional(),
  pageSize: z.number().int().optional(),
  isDefault: z.boolean().optional(),
});
const filterSchema = z.object({
  viewId: z.string().min(1),
  field: z.string().min(1),
  operator: z.string().optional(),
  value: z.any(),
  logic: z.string().optional(),
});
const columnSchema = z.object({
  viewId: z.string().min(1),
  field: z.string().min(1),
  label: z.string().optional(),
  width: z.number().int().optional(),
  sortable: z.boolean().optional(),
  visible: z.boolean().optional(),
  position: z.number().int().optional(),
  format: z.string().optional(),
  alignment: z.string().optional(),
});
const shareSchema = z.object({
  viewId: z.string().min(1),
  sharedWithUserId: z.string().min(1),
  permission: z.string().optional(),
});

@ApiTags("saved-views")
@ApiBearerAuth()
@Controller("saved-views")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SavedViewsController {
  constructor(
    private readonly service: SavedViewsService,
    private readonly deepService: SavedViewsDeepService,
  ) {}

  @Get()
  @Permissions("saved-views.read")
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("resourceName") resourceName: string,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      req.user.userId,
      resourceName,
    );
  }

  @Post()
  @Permissions("saved-views.create")
  async createOrUpdate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createViewSchema) body: z.infer<typeof createViewSchema>,
  ) {
    return this.service.createOrUpdate(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Delete(":id")
  @Permissions("saved-views.delete")
  async delete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.delete(req.user.tenantId, req.user.userId, id);
  }

  @Get(":viewId/layouts")
  @Permissions("saved-views.read")
  async getLayouts(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
  ) {
    return this.deepService.getLayouts(
      req.user.tenantId,
      req.user.userId,
      viewId,
    );
  }

  @Post("layouts")
  @Permissions("saved-views.create")
  async upsertLayout(
    @Req() req: AuthenticatedRequest,
    @ZodBody(layoutSchema) body: z.infer<typeof layoutSchema>,
  ) {
    return this.deepService.upsertLayout(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Delete("layouts/:id")
  @Permissions("saved-views.delete")
  async deleteLayout(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.deepService.deleteLayout(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  @Get(":viewId/filters")
  @Permissions("saved-views.read")
  async getFilters(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
  ) {
    return this.deepService.getFilters(req.user.tenantId, viewId);
  }

  @Post("filters")
  @Permissions("saved-views.create")
  async addFilter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(filterSchema) body: z.infer<typeof filterSchema>,
  ) {
    return this.deepService.addFilter(req.user.tenantId, req.user.userId, {
      viewId: body.viewId,
      field: body.field,
      value: body.value,
      logic: body.logic,
      operator: body.operator ?? "=",
    });
  }

  @Put("filters/:id")
  @Permissions("saved-views.update")
  async updateFilter(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(filterSchema.partial()) body: any,
  ) {
    return this.deepService.updateFilter(
      req.user.tenantId,
      req.user.userId,
      id,
      body,
    );
  }

  @Delete("filters/:id")
  @Permissions("saved-views.delete")
  async deleteFilter(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.deepService.deleteFilter(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  @Get(":viewId/columns")
  @Permissions("saved-views.read")
  async getColumnConfigs(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
  ) {
    return this.deepService.getColumnConfigs(
      req.user.tenantId,
      viewId,
      req.user.userId,
    );
  }

  @Post("columns")
  @Permissions("saved-views.create")
  async upsertColumnConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(columnSchema) body: z.infer<typeof columnSchema>,
  ) {
    return this.deepService.upsertColumnConfig(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Post("columns/reorder")
  @Permissions("saved-views.update")
  async reorderColumns(
    @Req() req: AuthenticatedRequest,
    @Body() body: { viewId: string; fieldOrder: string[] },
  ) {
    return this.deepService.reorderColumns(
      req.user.tenantId,
      req.user.userId,
      body.viewId,
      body.fieldOrder,
    );
  }

  @Post("share")
  @Permissions("saved-views.share")
  async shareView(
    @Req() req: AuthenticatedRequest,
    @ZodBody(shareSchema) body: z.infer<typeof shareSchema>,
  ) {
    return this.deepService.shareView(req.user.tenantId, req.user.userId, body);
  }

  @Delete("share/:id")
  @Permissions("saved-views.share")
  async removeShare(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.deepService.removeShare(req.user.tenantId, req.user.userId, id);
  }

  @Get("shared-with-me")
  @Permissions("saved-views.read")
  async getSharedWithMe(@Req() req: AuthenticatedRequest) {
    return this.deepService.getSharedWithMe(req.user.tenantId, req.user.userId);
  }

  @Post(":viewId/default")
  @Permissions("saved-views.update")
  async setDefaultView(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
  ) {
    return this.deepService.setDefaultView(
      req.user.tenantId,
      req.user.userId,
      viewId,
    );
  }

  @Get(":viewId/apply")
  @Permissions("saved-views.read")
  async applyViewConfig(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
    @Query("resourceName") resourceName: string,
  ) {
    return this.deepService.applyViewConfig(
      req.user.tenantId,
      req.user.userId,
      viewId,
      resourceName,
    );
  }

  @Post(":viewId/clone")
  @Permissions("saved-views.create")
  async cloneView(
    @Req() req: AuthenticatedRequest,
    @Param("viewId") viewId: string,
    @Body() body: { name: string },
  ) {
    return this.deepService.cloneView(
      req.user.tenantId,
      req.user.userId,
      viewId,
      body.name,
    );
  }
}
