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
import { FixedAssetsGeneratedService } from "./fixed-assets-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("fixed-assets")
@ApiBearerAuth()
@Controller("fixed-assets")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class FixedAssetsGeneratedController {
  constructor(private readonly svc: FixedAssetsGeneratedService) {}

  @ApiOperation({ summary: "List fixed-assets-entity-1" })
  @Get("fixed-assets-entity-1")
  @Permissions("fixed-assets.fixedAssetsEntity1.read")
  async listFixedAssetsEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-1" })
  @Get("fixed-assets-entity-1/:id")
  @Permissions("fixed-assets.fixedAssetsEntity1.read")
  async getFixedAssetsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-1" })
  @Post("fixed-assets-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity1.create")
  async createFixedAssetsEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-1" })
  @Put("fixed-assets-entity-1/:id")
  @Permissions("fixed-assets.fixedAssetsEntity1.update")
  async updateFixedAssetsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-1" })
  @Delete("fixed-assets-entity-1/:id")
  @Permissions("fixed-assets.fixedAssetsEntity1.delete")
  async deleteFixedAssetsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-2" })
  @Get("fixed-assets-entity-2")
  @Permissions("fixed-assets.fixedAssetsEntity2.read")
  async listFixedAssetsEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-2" })
  @Get("fixed-assets-entity-2/:id")
  @Permissions("fixed-assets.fixedAssetsEntity2.read")
  async getFixedAssetsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-2" })
  @Post("fixed-assets-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity2.create")
  async createFixedAssetsEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-2" })
  @Put("fixed-assets-entity-2/:id")
  @Permissions("fixed-assets.fixedAssetsEntity2.update")
  async updateFixedAssetsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-2" })
  @Delete("fixed-assets-entity-2/:id")
  @Permissions("fixed-assets.fixedAssetsEntity2.delete")
  async deleteFixedAssetsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-3" })
  @Get("fixed-assets-entity-3")
  @Permissions("fixed-assets.fixedAssetsEntity3.read")
  async listFixedAssetsEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-3" })
  @Get("fixed-assets-entity-3/:id")
  @Permissions("fixed-assets.fixedAssetsEntity3.read")
  async getFixedAssetsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-3" })
  @Post("fixed-assets-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity3.create")
  async createFixedAssetsEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-3" })
  @Put("fixed-assets-entity-3/:id")
  @Permissions("fixed-assets.fixedAssetsEntity3.update")
  async updateFixedAssetsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-3" })
  @Delete("fixed-assets-entity-3/:id")
  @Permissions("fixed-assets.fixedAssetsEntity3.delete")
  async deleteFixedAssetsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-4" })
  @Get("fixed-assets-entity-4")
  @Permissions("fixed-assets.fixedAssetsEntity4.read")
  async listFixedAssetsEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-4" })
  @Get("fixed-assets-entity-4/:id")
  @Permissions("fixed-assets.fixedAssetsEntity4.read")
  async getFixedAssetsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-4" })
  @Post("fixed-assets-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity4.create")
  async createFixedAssetsEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-4" })
  @Put("fixed-assets-entity-4/:id")
  @Permissions("fixed-assets.fixedAssetsEntity4.update")
  async updateFixedAssetsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-4" })
  @Delete("fixed-assets-entity-4/:id")
  @Permissions("fixed-assets.fixedAssetsEntity4.delete")
  async deleteFixedAssetsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-5" })
  @Get("fixed-assets-entity-5")
  @Permissions("fixed-assets.fixedAssetsEntity5.read")
  async listFixedAssetsEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-5" })
  @Get("fixed-assets-entity-5/:id")
  @Permissions("fixed-assets.fixedAssetsEntity5.read")
  async getFixedAssetsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-5" })
  @Post("fixed-assets-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity5.create")
  async createFixedAssetsEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-5" })
  @Put("fixed-assets-entity-5/:id")
  @Permissions("fixed-assets.fixedAssetsEntity5.update")
  async updateFixedAssetsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-5" })
  @Delete("fixed-assets-entity-5/:id")
  @Permissions("fixed-assets.fixedAssetsEntity5.delete")
  async deleteFixedAssetsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-6" })
  @Get("fixed-assets-entity-6")
  @Permissions("fixed-assets.fixedAssetsEntity6.read")
  async listFixedAssetsEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-6" })
  @Get("fixed-assets-entity-6/:id")
  @Permissions("fixed-assets.fixedAssetsEntity6.read")
  async getFixedAssetsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-6" })
  @Post("fixed-assets-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity6.create")
  async createFixedAssetsEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-6" })
  @Put("fixed-assets-entity-6/:id")
  @Permissions("fixed-assets.fixedAssetsEntity6.update")
  async updateFixedAssetsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-6" })
  @Delete("fixed-assets-entity-6/:id")
  @Permissions("fixed-assets.fixedAssetsEntity6.delete")
  async deleteFixedAssetsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-7" })
  @Get("fixed-assets-entity-7")
  @Permissions("fixed-assets.fixedAssetsEntity7.read")
  async listFixedAssetsEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-7" })
  @Get("fixed-assets-entity-7/:id")
  @Permissions("fixed-assets.fixedAssetsEntity7.read")
  async getFixedAssetsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-7" })
  @Post("fixed-assets-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity7.create")
  async createFixedAssetsEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-7" })
  @Put("fixed-assets-entity-7/:id")
  @Permissions("fixed-assets.fixedAssetsEntity7.update")
  async updateFixedAssetsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-7" })
  @Delete("fixed-assets-entity-7/:id")
  @Permissions("fixed-assets.fixedAssetsEntity7.delete")
  async deleteFixedAssetsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-8" })
  @Get("fixed-assets-entity-8")
  @Permissions("fixed-assets.fixedAssetsEntity8.read")
  async listFixedAssetsEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-8" })
  @Get("fixed-assets-entity-8/:id")
  @Permissions("fixed-assets.fixedAssetsEntity8.read")
  async getFixedAssetsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-8" })
  @Post("fixed-assets-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity8.create")
  async createFixedAssetsEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-8" })
  @Put("fixed-assets-entity-8/:id")
  @Permissions("fixed-assets.fixedAssetsEntity8.update")
  async updateFixedAssetsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-8" })
  @Delete("fixed-assets-entity-8/:id")
  @Permissions("fixed-assets.fixedAssetsEntity8.delete")
  async deleteFixedAssetsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-9" })
  @Get("fixed-assets-entity-9")
  @Permissions("fixed-assets.fixedAssetsEntity9.read")
  async listFixedAssetsEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-9" })
  @Get("fixed-assets-entity-9/:id")
  @Permissions("fixed-assets.fixedAssetsEntity9.read")
  async getFixedAssetsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-9" })
  @Post("fixed-assets-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity9.create")
  async createFixedAssetsEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-9" })
  @Put("fixed-assets-entity-9/:id")
  @Permissions("fixed-assets.fixedAssetsEntity9.update")
  async updateFixedAssetsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-9" })
  @Delete("fixed-assets-entity-9/:id")
  @Permissions("fixed-assets.fixedAssetsEntity9.delete")
  async deleteFixedAssetsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-10" })
  @Get("fixed-assets-entity-10")
  @Permissions("fixed-assets.fixedAssetsEntity10.read")
  async listFixedAssetsEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-10" })
  @Get("fixed-assets-entity-10/:id")
  @Permissions("fixed-assets.fixedAssetsEntity10.read")
  async getFixedAssetsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-10" })
  @Post("fixed-assets-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity10.create")
  async createFixedAssetsEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-10" })
  @Put("fixed-assets-entity-10/:id")
  @Permissions("fixed-assets.fixedAssetsEntity10.update")
  async updateFixedAssetsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-10" })
  @Delete("fixed-assets-entity-10/:id")
  @Permissions("fixed-assets.fixedAssetsEntity10.delete")
  async deleteFixedAssetsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-11" })
  @Get("fixed-assets-entity-11")
  @Permissions("fixed-assets.fixedAssetsEntity11.read")
  async listFixedAssetsEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-11" })
  @Get("fixed-assets-entity-11/:id")
  @Permissions("fixed-assets.fixedAssetsEntity11.read")
  async getFixedAssetsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-11" })
  @Post("fixed-assets-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity11.create")
  async createFixedAssetsEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-11" })
  @Put("fixed-assets-entity-11/:id")
  @Permissions("fixed-assets.fixedAssetsEntity11.update")
  async updateFixedAssetsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-11" })
  @Delete("fixed-assets-entity-11/:id")
  @Permissions("fixed-assets.fixedAssetsEntity11.delete")
  async deleteFixedAssetsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-12" })
  @Get("fixed-assets-entity-12")
  @Permissions("fixed-assets.fixedAssetsEntity12.read")
  async listFixedAssetsEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-12" })
  @Get("fixed-assets-entity-12/:id")
  @Permissions("fixed-assets.fixedAssetsEntity12.read")
  async getFixedAssetsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-12" })
  @Post("fixed-assets-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity12.create")
  async createFixedAssetsEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-12" })
  @Put("fixed-assets-entity-12/:id")
  @Permissions("fixed-assets.fixedAssetsEntity12.update")
  async updateFixedAssetsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-12" })
  @Delete("fixed-assets-entity-12/:id")
  @Permissions("fixed-assets.fixedAssetsEntity12.delete")
  async deleteFixedAssetsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-13" })
  @Get("fixed-assets-entity-13")
  @Permissions("fixed-assets.fixedAssetsEntity13.read")
  async listFixedAssetsEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-13" })
  @Get("fixed-assets-entity-13/:id")
  @Permissions("fixed-assets.fixedAssetsEntity13.read")
  async getFixedAssetsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-13" })
  @Post("fixed-assets-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity13.create")
  async createFixedAssetsEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-13" })
  @Put("fixed-assets-entity-13/:id")
  @Permissions("fixed-assets.fixedAssetsEntity13.update")
  async updateFixedAssetsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-13" })
  @Delete("fixed-assets-entity-13/:id")
  @Permissions("fixed-assets.fixedAssetsEntity13.delete")
  async deleteFixedAssetsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-14" })
  @Get("fixed-assets-entity-14")
  @Permissions("fixed-assets.fixedAssetsEntity14.read")
  async listFixedAssetsEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-14" })
  @Get("fixed-assets-entity-14/:id")
  @Permissions("fixed-assets.fixedAssetsEntity14.read")
  async getFixedAssetsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-14" })
  @Post("fixed-assets-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity14.create")
  async createFixedAssetsEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-14" })
  @Put("fixed-assets-entity-14/:id")
  @Permissions("fixed-assets.fixedAssetsEntity14.update")
  async updateFixedAssetsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-14" })
  @Delete("fixed-assets-entity-14/:id")
  @Permissions("fixed-assets.fixedAssetsEntity14.delete")
  async deleteFixedAssetsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-15" })
  @Get("fixed-assets-entity-15")
  @Permissions("fixed-assets.fixedAssetsEntity15.read")
  async listFixedAssetsEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-15" })
  @Get("fixed-assets-entity-15/:id")
  @Permissions("fixed-assets.fixedAssetsEntity15.read")
  async getFixedAssetsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-15" })
  @Post("fixed-assets-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity15.create")
  async createFixedAssetsEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-15" })
  @Put("fixed-assets-entity-15/:id")
  @Permissions("fixed-assets.fixedAssetsEntity15.update")
  async updateFixedAssetsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-15" })
  @Delete("fixed-assets-entity-15/:id")
  @Permissions("fixed-assets.fixedAssetsEntity15.delete")
  async deleteFixedAssetsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-16" })
  @Get("fixed-assets-entity-16")
  @Permissions("fixed-assets.fixedAssetsEntity16.read")
  async listFixedAssetsEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-16" })
  @Get("fixed-assets-entity-16/:id")
  @Permissions("fixed-assets.fixedAssetsEntity16.read")
  async getFixedAssetsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-16" })
  @Post("fixed-assets-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity16.create")
  async createFixedAssetsEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-16" })
  @Put("fixed-assets-entity-16/:id")
  @Permissions("fixed-assets.fixedAssetsEntity16.update")
  async updateFixedAssetsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-16" })
  @Delete("fixed-assets-entity-16/:id")
  @Permissions("fixed-assets.fixedAssetsEntity16.delete")
  async deleteFixedAssetsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List fixed-assets-entity-17" })
  @Get("fixed-assets-entity-17")
  @Permissions("fixed-assets.fixedAssetsEntity17.read")
  async listFixedAssetsEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listFixedAssetsEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get fixed-assets-entity-17" })
  @Get("fixed-assets-entity-17/:id")
  @Permissions("fixed-assets.fixedAssetsEntity17.read")
  async getFixedAssetsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getFixedAssetsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create fixed-assets-entity-17" })
  @Post("fixed-assets-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("fixed-assets.fixedAssetsEntity17.create")
  async createFixedAssetsEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createFixedAssetsEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update fixed-assets-entity-17" })
  @Put("fixed-assets-entity-17/:id")
  @Permissions("fixed-assets.fixedAssetsEntity17.update")
  async updateFixedAssetsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateFixedAssetsEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete fixed-assets-entity-17" })
  @Delete("fixed-assets-entity-17/:id")
  @Permissions("fixed-assets.fixedAssetsEntity17.delete")
  async deleteFixedAssetsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteFixedAssetsEntity17(req.user.tenantId, id);
  }
}
