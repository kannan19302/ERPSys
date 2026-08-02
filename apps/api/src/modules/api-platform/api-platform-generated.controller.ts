import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiPlatformGeneratedService } from "./api-platform-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("api-platform")
@ApiBearerAuth()
@Controller("api-platform")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ApiPlatformGeneratedController {
  constructor(private readonly svc: ApiPlatformGeneratedService) {}

  @ApiOperation({ summary: "List api-platform-entity-1" })
  @Get("api-platform-entity-1")
  @Permissions("api-platform.apiPlatformEntity1.read")
  async listApiPlatformEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-1" })
  @Get("api-platform-entity-1/:id")
  @Permissions("api-platform.apiPlatformEntity1.read")
  async getApiPlatformEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-1" })
  @Post("api-platform-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity1.create")
  async createApiPlatformEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-1" })
  @Put("api-platform-entity-1/:id")
  @Permissions("api-platform.apiPlatformEntity1.update")
  async updateApiPlatformEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-1" })
  @Delete("api-platform-entity-1/:id")
  @Permissions("api-platform.apiPlatformEntity1.delete")
  async deleteApiPlatformEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-2" })
  @Get("api-platform-entity-2")
  @Permissions("api-platform.apiPlatformEntity2.read")
  async listApiPlatformEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-2" })
  @Get("api-platform-entity-2/:id")
  @Permissions("api-platform.apiPlatformEntity2.read")
  async getApiPlatformEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-2" })
  @Post("api-platform-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity2.create")
  async createApiPlatformEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-2" })
  @Put("api-platform-entity-2/:id")
  @Permissions("api-platform.apiPlatformEntity2.update")
  async updateApiPlatformEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-2" })
  @Delete("api-platform-entity-2/:id")
  @Permissions("api-platform.apiPlatformEntity2.delete")
  async deleteApiPlatformEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-3" })
  @Get("api-platform-entity-3")
  @Permissions("api-platform.apiPlatformEntity3.read")
  async listApiPlatformEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-3" })
  @Get("api-platform-entity-3/:id")
  @Permissions("api-platform.apiPlatformEntity3.read")
  async getApiPlatformEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-3" })
  @Post("api-platform-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity3.create")
  async createApiPlatformEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-3" })
  @Put("api-platform-entity-3/:id")
  @Permissions("api-platform.apiPlatformEntity3.update")
  async updateApiPlatformEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-3" })
  @Delete("api-platform-entity-3/:id")
  @Permissions("api-platform.apiPlatformEntity3.delete")
  async deleteApiPlatformEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-4" })
  @Get("api-platform-entity-4")
  @Permissions("api-platform.apiPlatformEntity4.read")
  async listApiPlatformEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-4" })
  @Get("api-platform-entity-4/:id")
  @Permissions("api-platform.apiPlatformEntity4.read")
  async getApiPlatformEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-4" })
  @Post("api-platform-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity4.create")
  async createApiPlatformEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-4" })
  @Put("api-platform-entity-4/:id")
  @Permissions("api-platform.apiPlatformEntity4.update")
  async updateApiPlatformEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-4" })
  @Delete("api-platform-entity-4/:id")
  @Permissions("api-platform.apiPlatformEntity4.delete")
  async deleteApiPlatformEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-5" })
  @Get("api-platform-entity-5")
  @Permissions("api-platform.apiPlatformEntity5.read")
  async listApiPlatformEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-5" })
  @Get("api-platform-entity-5/:id")
  @Permissions("api-platform.apiPlatformEntity5.read")
  async getApiPlatformEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-5" })
  @Post("api-platform-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity5.create")
  async createApiPlatformEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-5" })
  @Put("api-platform-entity-5/:id")
  @Permissions("api-platform.apiPlatformEntity5.update")
  async updateApiPlatformEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-5" })
  @Delete("api-platform-entity-5/:id")
  @Permissions("api-platform.apiPlatformEntity5.delete")
  async deleteApiPlatformEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-6" })
  @Get("api-platform-entity-6")
  @Permissions("api-platform.apiPlatformEntity6.read")
  async listApiPlatformEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-6" })
  @Get("api-platform-entity-6/:id")
  @Permissions("api-platform.apiPlatformEntity6.read")
  async getApiPlatformEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-6" })
  @Post("api-platform-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity6.create")
  async createApiPlatformEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-6" })
  @Put("api-platform-entity-6/:id")
  @Permissions("api-platform.apiPlatformEntity6.update")
  async updateApiPlatformEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-6" })
  @Delete("api-platform-entity-6/:id")
  @Permissions("api-platform.apiPlatformEntity6.delete")
  async deleteApiPlatformEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-7" })
  @Get("api-platform-entity-7")
  @Permissions("api-platform.apiPlatformEntity7.read")
  async listApiPlatformEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-7" })
  @Get("api-platform-entity-7/:id")
  @Permissions("api-platform.apiPlatformEntity7.read")
  async getApiPlatformEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-7" })
  @Post("api-platform-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity7.create")
  async createApiPlatformEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-7" })
  @Put("api-platform-entity-7/:id")
  @Permissions("api-platform.apiPlatformEntity7.update")
  async updateApiPlatformEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-7" })
  @Delete("api-platform-entity-7/:id")
  @Permissions("api-platform.apiPlatformEntity7.delete")
  async deleteApiPlatformEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-8" })
  @Get("api-platform-entity-8")
  @Permissions("api-platform.apiPlatformEntity8.read")
  async listApiPlatformEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-8" })
  @Get("api-platform-entity-8/:id")
  @Permissions("api-platform.apiPlatformEntity8.read")
  async getApiPlatformEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-8" })
  @Post("api-platform-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity8.create")
  async createApiPlatformEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-8" })
  @Put("api-platform-entity-8/:id")
  @Permissions("api-platform.apiPlatformEntity8.update")
  async updateApiPlatformEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-8" })
  @Delete("api-platform-entity-8/:id")
  @Permissions("api-platform.apiPlatformEntity8.delete")
  async deleteApiPlatformEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-9" })
  @Get("api-platform-entity-9")
  @Permissions("api-platform.apiPlatformEntity9.read")
  async listApiPlatformEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-9" })
  @Get("api-platform-entity-9/:id")
  @Permissions("api-platform.apiPlatformEntity9.read")
  async getApiPlatformEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-9" })
  @Post("api-platform-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity9.create")
  async createApiPlatformEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-9" })
  @Put("api-platform-entity-9/:id")
  @Permissions("api-platform.apiPlatformEntity9.update")
  async updateApiPlatformEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-9" })
  @Delete("api-platform-entity-9/:id")
  @Permissions("api-platform.apiPlatformEntity9.delete")
  async deleteApiPlatformEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-10" })
  @Get("api-platform-entity-10")
  @Permissions("api-platform.apiPlatformEntity10.read")
  async listApiPlatformEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-10" })
  @Get("api-platform-entity-10/:id")
  @Permissions("api-platform.apiPlatformEntity10.read")
  async getApiPlatformEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-10" })
  @Post("api-platform-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity10.create")
  async createApiPlatformEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-10" })
  @Put("api-platform-entity-10/:id")
  @Permissions("api-platform.apiPlatformEntity10.update")
  async updateApiPlatformEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-10" })
  @Delete("api-platform-entity-10/:id")
  @Permissions("api-platform.apiPlatformEntity10.delete")
  async deleteApiPlatformEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-11" })
  @Get("api-platform-entity-11")
  @Permissions("api-platform.apiPlatformEntity11.read")
  async listApiPlatformEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-11" })
  @Get("api-platform-entity-11/:id")
  @Permissions("api-platform.apiPlatformEntity11.read")
  async getApiPlatformEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-11" })
  @Post("api-platform-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity11.create")
  async createApiPlatformEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-11" })
  @Put("api-platform-entity-11/:id")
  @Permissions("api-platform.apiPlatformEntity11.update")
  async updateApiPlatformEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-11" })
  @Delete("api-platform-entity-11/:id")
  @Permissions("api-platform.apiPlatformEntity11.delete")
  async deleteApiPlatformEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-12" })
  @Get("api-platform-entity-12")
  @Permissions("api-platform.apiPlatformEntity12.read")
  async listApiPlatformEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-12" })
  @Get("api-platform-entity-12/:id")
  @Permissions("api-platform.apiPlatformEntity12.read")
  async getApiPlatformEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-12" })
  @Post("api-platform-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity12.create")
  async createApiPlatformEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-12" })
  @Put("api-platform-entity-12/:id")
  @Permissions("api-platform.apiPlatformEntity12.update")
  async updateApiPlatformEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-12" })
  @Delete("api-platform-entity-12/:id")
  @Permissions("api-platform.apiPlatformEntity12.delete")
  async deleteApiPlatformEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-13" })
  @Get("api-platform-entity-13")
  @Permissions("api-platform.apiPlatformEntity13.read")
  async listApiPlatformEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-13" })
  @Get("api-platform-entity-13/:id")
  @Permissions("api-platform.apiPlatformEntity13.read")
  async getApiPlatformEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-13" })
  @Post("api-platform-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity13.create")
  async createApiPlatformEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-13" })
  @Put("api-platform-entity-13/:id")
  @Permissions("api-platform.apiPlatformEntity13.update")
  async updateApiPlatformEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-13" })
  @Delete("api-platform-entity-13/:id")
  @Permissions("api-platform.apiPlatformEntity13.delete")
  async deleteApiPlatformEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List api-platform-entity-14" })
  @Get("api-platform-entity-14")
  @Permissions("api-platform.apiPlatformEntity14.read")
  async listApiPlatformEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiPlatformEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get api-platform-entity-14" })
  @Get("api-platform-entity-14/:id")
  @Permissions("api-platform.apiPlatformEntity14.read")
  async getApiPlatformEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getApiPlatformEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create api-platform-entity-14" })
  @Post("api-platform-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.apiPlatformEntity14.create")
  async createApiPlatformEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createApiPlatformEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update api-platform-entity-14" })
  @Put("api-platform-entity-14/:id")
  @Permissions("api-platform.apiPlatformEntity14.update")
  async updateApiPlatformEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateApiPlatformEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete api-platform-entity-14" })
  @Delete("api-platform-entity-14/:id")
  @Permissions("api-platform.apiPlatformEntity14.delete")
  async deleteApiPlatformEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiPlatformEntity14(req.user.tenantId, id);
  }
}
