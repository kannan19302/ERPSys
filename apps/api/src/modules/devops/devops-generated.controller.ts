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
import { DevopsGeneratedService } from "./devops-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("devops")
@ApiBearerAuth()
@Controller("devops")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DevopsGeneratedController {
  constructor(private readonly svc: DevopsGeneratedService) {}

  @ApiOperation({ summary: "List devops-entity-1" })
  @Get("devops-entity-1")
  @Permissions("devops.devopsEntity1.read")
  async listDevopsEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-1" })
  @Get("devops-entity-1/:id")
  @Permissions("devops.devopsEntity1.read")
  async getDevopsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-1" })
  @Post("devops-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity1.create")
  async createDevopsEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-1" })
  @Put("devops-entity-1/:id")
  @Permissions("devops.devopsEntity1.update")
  async updateDevopsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-1" })
  @Delete("devops-entity-1/:id")
  @Permissions("devops.devopsEntity1.delete")
  async deleteDevopsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-2" })
  @Get("devops-entity-2")
  @Permissions("devops.devopsEntity2.read")
  async listDevopsEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-2" })
  @Get("devops-entity-2/:id")
  @Permissions("devops.devopsEntity2.read")
  async getDevopsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-2" })
  @Post("devops-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity2.create")
  async createDevopsEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-2" })
  @Put("devops-entity-2/:id")
  @Permissions("devops.devopsEntity2.update")
  async updateDevopsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-2" })
  @Delete("devops-entity-2/:id")
  @Permissions("devops.devopsEntity2.delete")
  async deleteDevopsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-3" })
  @Get("devops-entity-3")
  @Permissions("devops.devopsEntity3.read")
  async listDevopsEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-3" })
  @Get("devops-entity-3/:id")
  @Permissions("devops.devopsEntity3.read")
  async getDevopsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-3" })
  @Post("devops-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity3.create")
  async createDevopsEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-3" })
  @Put("devops-entity-3/:id")
  @Permissions("devops.devopsEntity3.update")
  async updateDevopsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-3" })
  @Delete("devops-entity-3/:id")
  @Permissions("devops.devopsEntity3.delete")
  async deleteDevopsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-4" })
  @Get("devops-entity-4")
  @Permissions("devops.devopsEntity4.read")
  async listDevopsEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-4" })
  @Get("devops-entity-4/:id")
  @Permissions("devops.devopsEntity4.read")
  async getDevopsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-4" })
  @Post("devops-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity4.create")
  async createDevopsEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-4" })
  @Put("devops-entity-4/:id")
  @Permissions("devops.devopsEntity4.update")
  async updateDevopsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-4" })
  @Delete("devops-entity-4/:id")
  @Permissions("devops.devopsEntity4.delete")
  async deleteDevopsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-5" })
  @Get("devops-entity-5")
  @Permissions("devops.devopsEntity5.read")
  async listDevopsEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-5" })
  @Get("devops-entity-5/:id")
  @Permissions("devops.devopsEntity5.read")
  async getDevopsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-5" })
  @Post("devops-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity5.create")
  async createDevopsEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-5" })
  @Put("devops-entity-5/:id")
  @Permissions("devops.devopsEntity5.update")
  async updateDevopsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-5" })
  @Delete("devops-entity-5/:id")
  @Permissions("devops.devopsEntity5.delete")
  async deleteDevopsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-6" })
  @Get("devops-entity-6")
  @Permissions("devops.devopsEntity6.read")
  async listDevopsEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-6" })
  @Get("devops-entity-6/:id")
  @Permissions("devops.devopsEntity6.read")
  async getDevopsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-6" })
  @Post("devops-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity6.create")
  async createDevopsEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-6" })
  @Put("devops-entity-6/:id")
  @Permissions("devops.devopsEntity6.update")
  async updateDevopsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-6" })
  @Delete("devops-entity-6/:id")
  @Permissions("devops.devopsEntity6.delete")
  async deleteDevopsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-7" })
  @Get("devops-entity-7")
  @Permissions("devops.devopsEntity7.read")
  async listDevopsEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-7" })
  @Get("devops-entity-7/:id")
  @Permissions("devops.devopsEntity7.read")
  async getDevopsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-7" })
  @Post("devops-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity7.create")
  async createDevopsEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-7" })
  @Put("devops-entity-7/:id")
  @Permissions("devops.devopsEntity7.update")
  async updateDevopsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-7" })
  @Delete("devops-entity-7/:id")
  @Permissions("devops.devopsEntity7.delete")
  async deleteDevopsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-8" })
  @Get("devops-entity-8")
  @Permissions("devops.devopsEntity8.read")
  async listDevopsEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-8" })
  @Get("devops-entity-8/:id")
  @Permissions("devops.devopsEntity8.read")
  async getDevopsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-8" })
  @Post("devops-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity8.create")
  async createDevopsEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-8" })
  @Put("devops-entity-8/:id")
  @Permissions("devops.devopsEntity8.update")
  async updateDevopsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-8" })
  @Delete("devops-entity-8/:id")
  @Permissions("devops.devopsEntity8.delete")
  async deleteDevopsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-9" })
  @Get("devops-entity-9")
  @Permissions("devops.devopsEntity9.read")
  async listDevopsEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-9" })
  @Get("devops-entity-9/:id")
  @Permissions("devops.devopsEntity9.read")
  async getDevopsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-9" })
  @Post("devops-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity9.create")
  async createDevopsEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-9" })
  @Put("devops-entity-9/:id")
  @Permissions("devops.devopsEntity9.update")
  async updateDevopsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-9" })
  @Delete("devops-entity-9/:id")
  @Permissions("devops.devopsEntity9.delete")
  async deleteDevopsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-10" })
  @Get("devops-entity-10")
  @Permissions("devops.devopsEntity10.read")
  async listDevopsEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-10" })
  @Get("devops-entity-10/:id")
  @Permissions("devops.devopsEntity10.read")
  async getDevopsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-10" })
  @Post("devops-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity10.create")
  async createDevopsEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-10" })
  @Put("devops-entity-10/:id")
  @Permissions("devops.devopsEntity10.update")
  async updateDevopsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-10" })
  @Delete("devops-entity-10/:id")
  @Permissions("devops.devopsEntity10.delete")
  async deleteDevopsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-11" })
  @Get("devops-entity-11")
  @Permissions("devops.devopsEntity11.read")
  async listDevopsEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-11" })
  @Get("devops-entity-11/:id")
  @Permissions("devops.devopsEntity11.read")
  async getDevopsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-11" })
  @Post("devops-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity11.create")
  async createDevopsEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-11" })
  @Put("devops-entity-11/:id")
  @Permissions("devops.devopsEntity11.update")
  async updateDevopsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-11" })
  @Delete("devops-entity-11/:id")
  @Permissions("devops.devopsEntity11.delete")
  async deleteDevopsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List devops-entity-12" })
  @Get("devops-entity-12")
  @Permissions("devops.devopsEntity12.read")
  async listDevopsEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listDevopsEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops-entity-12" })
  @Get("devops-entity-12/:id")
  @Permissions("devops.devopsEntity12.read")
  async getDevopsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDevopsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create devops-entity-12" })
  @Post("devops-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.devopsEntity12.create")
  async createDevopsEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createDevopsEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update devops-entity-12" })
  @Put("devops-entity-12/:id")
  @Permissions("devops.devopsEntity12.update")
  async updateDevopsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateDevopsEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete devops-entity-12" })
  @Delete("devops-entity-12/:id")
  @Permissions("devops.devopsEntity12.delete")
  async deleteDevopsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDevopsEntity12(req.user.tenantId, id);
  }
}
