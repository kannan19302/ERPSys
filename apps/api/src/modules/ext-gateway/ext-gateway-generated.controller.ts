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
import { ExtGatewayGeneratedService } from "./ext-gateway-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("ext-gateway")
@ApiBearerAuth()
@Controller("ext-gateway")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ExtGatewayGeneratedController {
  constructor(private readonly svc: ExtGatewayGeneratedService) {}

  @ApiOperation({ summary: "List ext-gateway-entity-1" })
  @Get("ext-gateway-entity-1")
  @Permissions("ext-gateway.extGatewayEntity1.read")
  async listExtGatewayEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-1" })
  @Get("ext-gateway-entity-1/:id")
  @Permissions("ext-gateway.extGatewayEntity1.read")
  async getExtGatewayEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-1" })
  @Post("ext-gateway-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity1.create")
  async createExtGatewayEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-1" })
  @Put("ext-gateway-entity-1/:id")
  @Permissions("ext-gateway.extGatewayEntity1.update")
  async updateExtGatewayEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-1" })
  @Delete("ext-gateway-entity-1/:id")
  @Permissions("ext-gateway.extGatewayEntity1.delete")
  async deleteExtGatewayEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-2" })
  @Get("ext-gateway-entity-2")
  @Permissions("ext-gateway.extGatewayEntity2.read")
  async listExtGatewayEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-2" })
  @Get("ext-gateway-entity-2/:id")
  @Permissions("ext-gateway.extGatewayEntity2.read")
  async getExtGatewayEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-2" })
  @Post("ext-gateway-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity2.create")
  async createExtGatewayEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-2" })
  @Put("ext-gateway-entity-2/:id")
  @Permissions("ext-gateway.extGatewayEntity2.update")
  async updateExtGatewayEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-2" })
  @Delete("ext-gateway-entity-2/:id")
  @Permissions("ext-gateway.extGatewayEntity2.delete")
  async deleteExtGatewayEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-3" })
  @Get("ext-gateway-entity-3")
  @Permissions("ext-gateway.extGatewayEntity3.read")
  async listExtGatewayEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-3" })
  @Get("ext-gateway-entity-3/:id")
  @Permissions("ext-gateway.extGatewayEntity3.read")
  async getExtGatewayEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-3" })
  @Post("ext-gateway-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity3.create")
  async createExtGatewayEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-3" })
  @Put("ext-gateway-entity-3/:id")
  @Permissions("ext-gateway.extGatewayEntity3.update")
  async updateExtGatewayEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-3" })
  @Delete("ext-gateway-entity-3/:id")
  @Permissions("ext-gateway.extGatewayEntity3.delete")
  async deleteExtGatewayEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-4" })
  @Get("ext-gateway-entity-4")
  @Permissions("ext-gateway.extGatewayEntity4.read")
  async listExtGatewayEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-4" })
  @Get("ext-gateway-entity-4/:id")
  @Permissions("ext-gateway.extGatewayEntity4.read")
  async getExtGatewayEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-4" })
  @Post("ext-gateway-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity4.create")
  async createExtGatewayEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-4" })
  @Put("ext-gateway-entity-4/:id")
  @Permissions("ext-gateway.extGatewayEntity4.update")
  async updateExtGatewayEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-4" })
  @Delete("ext-gateway-entity-4/:id")
  @Permissions("ext-gateway.extGatewayEntity4.delete")
  async deleteExtGatewayEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-5" })
  @Get("ext-gateway-entity-5")
  @Permissions("ext-gateway.extGatewayEntity5.read")
  async listExtGatewayEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-5" })
  @Get("ext-gateway-entity-5/:id")
  @Permissions("ext-gateway.extGatewayEntity5.read")
  async getExtGatewayEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-5" })
  @Post("ext-gateway-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity5.create")
  async createExtGatewayEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-5" })
  @Put("ext-gateway-entity-5/:id")
  @Permissions("ext-gateway.extGatewayEntity5.update")
  async updateExtGatewayEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-5" })
  @Delete("ext-gateway-entity-5/:id")
  @Permissions("ext-gateway.extGatewayEntity5.delete")
  async deleteExtGatewayEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-6" })
  @Get("ext-gateway-entity-6")
  @Permissions("ext-gateway.extGatewayEntity6.read")
  async listExtGatewayEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-6" })
  @Get("ext-gateway-entity-6/:id")
  @Permissions("ext-gateway.extGatewayEntity6.read")
  async getExtGatewayEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-6" })
  @Post("ext-gateway-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity6.create")
  async createExtGatewayEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-6" })
  @Put("ext-gateway-entity-6/:id")
  @Permissions("ext-gateway.extGatewayEntity6.update")
  async updateExtGatewayEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-6" })
  @Delete("ext-gateway-entity-6/:id")
  @Permissions("ext-gateway.extGatewayEntity6.delete")
  async deleteExtGatewayEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-7" })
  @Get("ext-gateway-entity-7")
  @Permissions("ext-gateway.extGatewayEntity7.read")
  async listExtGatewayEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-7" })
  @Get("ext-gateway-entity-7/:id")
  @Permissions("ext-gateway.extGatewayEntity7.read")
  async getExtGatewayEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-7" })
  @Post("ext-gateway-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity7.create")
  async createExtGatewayEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-7" })
  @Put("ext-gateway-entity-7/:id")
  @Permissions("ext-gateway.extGatewayEntity7.update")
  async updateExtGatewayEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-7" })
  @Delete("ext-gateway-entity-7/:id")
  @Permissions("ext-gateway.extGatewayEntity7.delete")
  async deleteExtGatewayEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-8" })
  @Get("ext-gateway-entity-8")
  @Permissions("ext-gateway.extGatewayEntity8.read")
  async listExtGatewayEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-8" })
  @Get("ext-gateway-entity-8/:id")
  @Permissions("ext-gateway.extGatewayEntity8.read")
  async getExtGatewayEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-8" })
  @Post("ext-gateway-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity8.create")
  async createExtGatewayEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-8" })
  @Put("ext-gateway-entity-8/:id")
  @Permissions("ext-gateway.extGatewayEntity8.update")
  async updateExtGatewayEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-8" })
  @Delete("ext-gateway-entity-8/:id")
  @Permissions("ext-gateway.extGatewayEntity8.delete")
  async deleteExtGatewayEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-9" })
  @Get("ext-gateway-entity-9")
  @Permissions("ext-gateway.extGatewayEntity9.read")
  async listExtGatewayEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-9" })
  @Get("ext-gateway-entity-9/:id")
  @Permissions("ext-gateway.extGatewayEntity9.read")
  async getExtGatewayEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-9" })
  @Post("ext-gateway-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity9.create")
  async createExtGatewayEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-9" })
  @Put("ext-gateway-entity-9/:id")
  @Permissions("ext-gateway.extGatewayEntity9.update")
  async updateExtGatewayEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-9" })
  @Delete("ext-gateway-entity-9/:id")
  @Permissions("ext-gateway.extGatewayEntity9.delete")
  async deleteExtGatewayEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-10" })
  @Get("ext-gateway-entity-10")
  @Permissions("ext-gateway.extGatewayEntity10.read")
  async listExtGatewayEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-10" })
  @Get("ext-gateway-entity-10/:id")
  @Permissions("ext-gateway.extGatewayEntity10.read")
  async getExtGatewayEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-10" })
  @Post("ext-gateway-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity10.create")
  async createExtGatewayEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-10" })
  @Put("ext-gateway-entity-10/:id")
  @Permissions("ext-gateway.extGatewayEntity10.update")
  async updateExtGatewayEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-10" })
  @Delete("ext-gateway-entity-10/:id")
  @Permissions("ext-gateway.extGatewayEntity10.delete")
  async deleteExtGatewayEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-11" })
  @Get("ext-gateway-entity-11")
  @Permissions("ext-gateway.extGatewayEntity11.read")
  async listExtGatewayEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-11" })
  @Get("ext-gateway-entity-11/:id")
  @Permissions("ext-gateway.extGatewayEntity11.read")
  async getExtGatewayEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-11" })
  @Post("ext-gateway-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity11.create")
  async createExtGatewayEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-11" })
  @Put("ext-gateway-entity-11/:id")
  @Permissions("ext-gateway.extGatewayEntity11.update")
  async updateExtGatewayEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-11" })
  @Delete("ext-gateway-entity-11/:id")
  @Permissions("ext-gateway.extGatewayEntity11.delete")
  async deleteExtGatewayEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-12" })
  @Get("ext-gateway-entity-12")
  @Permissions("ext-gateway.extGatewayEntity12.read")
  async listExtGatewayEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-12" })
  @Get("ext-gateway-entity-12/:id")
  @Permissions("ext-gateway.extGatewayEntity12.read")
  async getExtGatewayEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-12" })
  @Post("ext-gateway-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity12.create")
  async createExtGatewayEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-12" })
  @Put("ext-gateway-entity-12/:id")
  @Permissions("ext-gateway.extGatewayEntity12.update")
  async updateExtGatewayEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-12" })
  @Delete("ext-gateway-entity-12/:id")
  @Permissions("ext-gateway.extGatewayEntity12.delete")
  async deleteExtGatewayEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-13" })
  @Get("ext-gateway-entity-13")
  @Permissions("ext-gateway.extGatewayEntity13.read")
  async listExtGatewayEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-13" })
  @Get("ext-gateway-entity-13/:id")
  @Permissions("ext-gateway.extGatewayEntity13.read")
  async getExtGatewayEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-13" })
  @Post("ext-gateway-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity13.create")
  async createExtGatewayEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-13" })
  @Put("ext-gateway-entity-13/:id")
  @Permissions("ext-gateway.extGatewayEntity13.update")
  async updateExtGatewayEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-13" })
  @Delete("ext-gateway-entity-13/:id")
  @Permissions("ext-gateway.extGatewayEntity13.delete")
  async deleteExtGatewayEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-14" })
  @Get("ext-gateway-entity-14")
  @Permissions("ext-gateway.extGatewayEntity14.read")
  async listExtGatewayEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-14" })
  @Get("ext-gateway-entity-14/:id")
  @Permissions("ext-gateway.extGatewayEntity14.read")
  async getExtGatewayEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-14" })
  @Post("ext-gateway-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity14.create")
  async createExtGatewayEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-14" })
  @Put("ext-gateway-entity-14/:id")
  @Permissions("ext-gateway.extGatewayEntity14.update")
  async updateExtGatewayEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-14" })
  @Delete("ext-gateway-entity-14/:id")
  @Permissions("ext-gateway.extGatewayEntity14.delete")
  async deleteExtGatewayEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-15" })
  @Get("ext-gateway-entity-15")
  @Permissions("ext-gateway.extGatewayEntity15.read")
  async listExtGatewayEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-15" })
  @Get("ext-gateway-entity-15/:id")
  @Permissions("ext-gateway.extGatewayEntity15.read")
  async getExtGatewayEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-15" })
  @Post("ext-gateway-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity15.create")
  async createExtGatewayEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-15" })
  @Put("ext-gateway-entity-15/:id")
  @Permissions("ext-gateway.extGatewayEntity15.update")
  async updateExtGatewayEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-15" })
  @Delete("ext-gateway-entity-15/:id")
  @Permissions("ext-gateway.extGatewayEntity15.delete")
  async deleteExtGatewayEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-16" })
  @Get("ext-gateway-entity-16")
  @Permissions("ext-gateway.extGatewayEntity16.read")
  async listExtGatewayEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-16" })
  @Get("ext-gateway-entity-16/:id")
  @Permissions("ext-gateway.extGatewayEntity16.read")
  async getExtGatewayEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-16" })
  @Post("ext-gateway-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity16.create")
  async createExtGatewayEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-16" })
  @Put("ext-gateway-entity-16/:id")
  @Permissions("ext-gateway.extGatewayEntity16.update")
  async updateExtGatewayEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-16" })
  @Delete("ext-gateway-entity-16/:id")
  @Permissions("ext-gateway.extGatewayEntity16.delete")
  async deleteExtGatewayEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-17" })
  @Get("ext-gateway-entity-17")
  @Permissions("ext-gateway.extGatewayEntity17.read")
  async listExtGatewayEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-17" })
  @Get("ext-gateway-entity-17/:id")
  @Permissions("ext-gateway.extGatewayEntity17.read")
  async getExtGatewayEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-17" })
  @Post("ext-gateway-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity17.create")
  async createExtGatewayEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-17" })
  @Put("ext-gateway-entity-17/:id")
  @Permissions("ext-gateway.extGatewayEntity17.update")
  async updateExtGatewayEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-17" })
  @Delete("ext-gateway-entity-17/:id")
  @Permissions("ext-gateway.extGatewayEntity17.delete")
  async deleteExtGatewayEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-18" })
  @Get("ext-gateway-entity-18")
  @Permissions("ext-gateway.extGatewayEntity18.read")
  async listExtGatewayEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-18" })
  @Get("ext-gateway-entity-18/:id")
  @Permissions("ext-gateway.extGatewayEntity18.read")
  async getExtGatewayEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-18" })
  @Post("ext-gateway-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity18.create")
  async createExtGatewayEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-18" })
  @Put("ext-gateway-entity-18/:id")
  @Permissions("ext-gateway.extGatewayEntity18.update")
  async updateExtGatewayEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-18" })
  @Delete("ext-gateway-entity-18/:id")
  @Permissions("ext-gateway.extGatewayEntity18.delete")
  async deleteExtGatewayEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-19" })
  @Get("ext-gateway-entity-19")
  @Permissions("ext-gateway.extGatewayEntity19.read")
  async listExtGatewayEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-19" })
  @Get("ext-gateway-entity-19/:id")
  @Permissions("ext-gateway.extGatewayEntity19.read")
  async getExtGatewayEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-19" })
  @Post("ext-gateway-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity19.create")
  async createExtGatewayEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-19" })
  @Put("ext-gateway-entity-19/:id")
  @Permissions("ext-gateway.extGatewayEntity19.update")
  async updateExtGatewayEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-19" })
  @Delete("ext-gateway-entity-19/:id")
  @Permissions("ext-gateway.extGatewayEntity19.delete")
  async deleteExtGatewayEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-20" })
  @Get("ext-gateway-entity-20")
  @Permissions("ext-gateway.extGatewayEntity20.read")
  async listExtGatewayEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-20" })
  @Get("ext-gateway-entity-20/:id")
  @Permissions("ext-gateway.extGatewayEntity20.read")
  async getExtGatewayEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-20" })
  @Post("ext-gateway-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity20.create")
  async createExtGatewayEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-20" })
  @Put("ext-gateway-entity-20/:id")
  @Permissions("ext-gateway.extGatewayEntity20.update")
  async updateExtGatewayEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-20" })
  @Delete("ext-gateway-entity-20/:id")
  @Permissions("ext-gateway.extGatewayEntity20.delete")
  async deleteExtGatewayEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-21" })
  @Get("ext-gateway-entity-21")
  @Permissions("ext-gateway.extGatewayEntity21.read")
  async listExtGatewayEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-21" })
  @Get("ext-gateway-entity-21/:id")
  @Permissions("ext-gateway.extGatewayEntity21.read")
  async getExtGatewayEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-21" })
  @Post("ext-gateway-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity21.create")
  async createExtGatewayEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-21" })
  @Put("ext-gateway-entity-21/:id")
  @Permissions("ext-gateway.extGatewayEntity21.update")
  async updateExtGatewayEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-21" })
  @Delete("ext-gateway-entity-21/:id")
  @Permissions("ext-gateway.extGatewayEntity21.delete")
  async deleteExtGatewayEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-22" })
  @Get("ext-gateway-entity-22")
  @Permissions("ext-gateway.extGatewayEntity22.read")
  async listExtGatewayEntity22(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity22(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-22" })
  @Get("ext-gateway-entity-22/:id")
  @Permissions("ext-gateway.extGatewayEntity22.read")
  async getExtGatewayEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-22" })
  @Post("ext-gateway-entity-22")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity22.create")
  async createExtGatewayEntity22(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity22(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-22" })
  @Put("ext-gateway-entity-22/:id")
  @Permissions("ext-gateway.extGatewayEntity22.update")
  async updateExtGatewayEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity22(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-22" })
  @Delete("ext-gateway-entity-22/:id")
  @Permissions("ext-gateway.extGatewayEntity22.delete")
  async deleteExtGatewayEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-23" })
  @Get("ext-gateway-entity-23")
  @Permissions("ext-gateway.extGatewayEntity23.read")
  async listExtGatewayEntity23(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity23(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-23" })
  @Get("ext-gateway-entity-23/:id")
  @Permissions("ext-gateway.extGatewayEntity23.read")
  async getExtGatewayEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-23" })
  @Post("ext-gateway-entity-23")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity23.create")
  async createExtGatewayEntity23(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity23(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-23" })
  @Put("ext-gateway-entity-23/:id")
  @Permissions("ext-gateway.extGatewayEntity23.update")
  async updateExtGatewayEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity23(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-23" })
  @Delete("ext-gateway-entity-23/:id")
  @Permissions("ext-gateway.extGatewayEntity23.delete")
  async deleteExtGatewayEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-24" })
  @Get("ext-gateway-entity-24")
  @Permissions("ext-gateway.extGatewayEntity24.read")
  async listExtGatewayEntity24(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity24(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-24" })
  @Get("ext-gateway-entity-24/:id")
  @Permissions("ext-gateway.extGatewayEntity24.read")
  async getExtGatewayEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-24" })
  @Post("ext-gateway-entity-24")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity24.create")
  async createExtGatewayEntity24(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity24(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-24" })
  @Put("ext-gateway-entity-24/:id")
  @Permissions("ext-gateway.extGatewayEntity24.update")
  async updateExtGatewayEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity24(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-24" })
  @Delete("ext-gateway-entity-24/:id")
  @Permissions("ext-gateway.extGatewayEntity24.delete")
  async deleteExtGatewayEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-25" })
  @Get("ext-gateway-entity-25")
  @Permissions("ext-gateway.extGatewayEntity25.read")
  async listExtGatewayEntity25(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity25(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-25" })
  @Get("ext-gateway-entity-25/:id")
  @Permissions("ext-gateway.extGatewayEntity25.read")
  async getExtGatewayEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-25" })
  @Post("ext-gateway-entity-25")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity25.create")
  async createExtGatewayEntity25(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity25(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-25" })
  @Put("ext-gateway-entity-25/:id")
  @Permissions("ext-gateway.extGatewayEntity25.update")
  async updateExtGatewayEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity25(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-25" })
  @Delete("ext-gateway-entity-25/:id")
  @Permissions("ext-gateway.extGatewayEntity25.delete")
  async deleteExtGatewayEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-26" })
  @Get("ext-gateway-entity-26")
  @Permissions("ext-gateway.extGatewayEntity26.read")
  async listExtGatewayEntity26(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity26(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-26" })
  @Get("ext-gateway-entity-26/:id")
  @Permissions("ext-gateway.extGatewayEntity26.read")
  async getExtGatewayEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-26" })
  @Post("ext-gateway-entity-26")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity26.create")
  async createExtGatewayEntity26(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity26(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-26" })
  @Put("ext-gateway-entity-26/:id")
  @Permissions("ext-gateway.extGatewayEntity26.update")
  async updateExtGatewayEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity26(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-26" })
  @Delete("ext-gateway-entity-26/:id")
  @Permissions("ext-gateway.extGatewayEntity26.delete")
  async deleteExtGatewayEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-27" })
  @Get("ext-gateway-entity-27")
  @Permissions("ext-gateway.extGatewayEntity27.read")
  async listExtGatewayEntity27(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity27(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-27" })
  @Get("ext-gateway-entity-27/:id")
  @Permissions("ext-gateway.extGatewayEntity27.read")
  async getExtGatewayEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-27" })
  @Post("ext-gateway-entity-27")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity27.create")
  async createExtGatewayEntity27(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity27(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-27" })
  @Put("ext-gateway-entity-27/:id")
  @Permissions("ext-gateway.extGatewayEntity27.update")
  async updateExtGatewayEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity27(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-27" })
  @Delete("ext-gateway-entity-27/:id")
  @Permissions("ext-gateway.extGatewayEntity27.delete")
  async deleteExtGatewayEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-28" })
  @Get("ext-gateway-entity-28")
  @Permissions("ext-gateway.extGatewayEntity28.read")
  async listExtGatewayEntity28(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity28(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-28" })
  @Get("ext-gateway-entity-28/:id")
  @Permissions("ext-gateway.extGatewayEntity28.read")
  async getExtGatewayEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-28" })
  @Post("ext-gateway-entity-28")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity28.create")
  async createExtGatewayEntity28(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity28(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-28" })
  @Put("ext-gateway-entity-28/:id")
  @Permissions("ext-gateway.extGatewayEntity28.update")
  async updateExtGatewayEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity28(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-28" })
  @Delete("ext-gateway-entity-28/:id")
  @Permissions("ext-gateway.extGatewayEntity28.delete")
  async deleteExtGatewayEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-29" })
  @Get("ext-gateway-entity-29")
  @Permissions("ext-gateway.extGatewayEntity29.read")
  async listExtGatewayEntity29(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity29(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-29" })
  @Get("ext-gateway-entity-29/:id")
  @Permissions("ext-gateway.extGatewayEntity29.read")
  async getExtGatewayEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-29" })
  @Post("ext-gateway-entity-29")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity29.create")
  async createExtGatewayEntity29(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity29(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-29" })
  @Put("ext-gateway-entity-29/:id")
  @Permissions("ext-gateway.extGatewayEntity29.update")
  async updateExtGatewayEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity29(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-29" })
  @Delete("ext-gateway-entity-29/:id")
  @Permissions("ext-gateway.extGatewayEntity29.delete")
  async deleteExtGatewayEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-30" })
  @Get("ext-gateway-entity-30")
  @Permissions("ext-gateway.extGatewayEntity30.read")
  async listExtGatewayEntity30(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity30(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-30" })
  @Get("ext-gateway-entity-30/:id")
  @Permissions("ext-gateway.extGatewayEntity30.read")
  async getExtGatewayEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-30" })
  @Post("ext-gateway-entity-30")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity30.create")
  async createExtGatewayEntity30(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity30(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-30" })
  @Put("ext-gateway-entity-30/:id")
  @Permissions("ext-gateway.extGatewayEntity30.update")
  async updateExtGatewayEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity30(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-30" })
  @Delete("ext-gateway-entity-30/:id")
  @Permissions("ext-gateway.extGatewayEntity30.delete")
  async deleteExtGatewayEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-31" })
  @Get("ext-gateway-entity-31")
  @Permissions("ext-gateway.extGatewayEntity31.read")
  async listExtGatewayEntity31(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity31(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-31" })
  @Get("ext-gateway-entity-31/:id")
  @Permissions("ext-gateway.extGatewayEntity31.read")
  async getExtGatewayEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-31" })
  @Post("ext-gateway-entity-31")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity31.create")
  async createExtGatewayEntity31(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity31(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-31" })
  @Put("ext-gateway-entity-31/:id")
  @Permissions("ext-gateway.extGatewayEntity31.update")
  async updateExtGatewayEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity31(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-31" })
  @Delete("ext-gateway-entity-31/:id")
  @Permissions("ext-gateway.extGatewayEntity31.delete")
  async deleteExtGatewayEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-32" })
  @Get("ext-gateway-entity-32")
  @Permissions("ext-gateway.extGatewayEntity32.read")
  async listExtGatewayEntity32(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity32(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-32" })
  @Get("ext-gateway-entity-32/:id")
  @Permissions("ext-gateway.extGatewayEntity32.read")
  async getExtGatewayEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-32" })
  @Post("ext-gateway-entity-32")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity32.create")
  async createExtGatewayEntity32(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity32(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-32" })
  @Put("ext-gateway-entity-32/:id")
  @Permissions("ext-gateway.extGatewayEntity32.update")
  async updateExtGatewayEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity32(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-32" })
  @Delete("ext-gateway-entity-32/:id")
  @Permissions("ext-gateway.extGatewayEntity32.delete")
  async deleteExtGatewayEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-33" })
  @Get("ext-gateway-entity-33")
  @Permissions("ext-gateway.extGatewayEntity33.read")
  async listExtGatewayEntity33(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity33(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-33" })
  @Get("ext-gateway-entity-33/:id")
  @Permissions("ext-gateway.extGatewayEntity33.read")
  async getExtGatewayEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-33" })
  @Post("ext-gateway-entity-33")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity33.create")
  async createExtGatewayEntity33(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity33(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-33" })
  @Put("ext-gateway-entity-33/:id")
  @Permissions("ext-gateway.extGatewayEntity33.update")
  async updateExtGatewayEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity33(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-33" })
  @Delete("ext-gateway-entity-33/:id")
  @Permissions("ext-gateway.extGatewayEntity33.delete")
  async deleteExtGatewayEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-34" })
  @Get("ext-gateway-entity-34")
  @Permissions("ext-gateway.extGatewayEntity34.read")
  async listExtGatewayEntity34(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity34(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-34" })
  @Get("ext-gateway-entity-34/:id")
  @Permissions("ext-gateway.extGatewayEntity34.read")
  async getExtGatewayEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-34" })
  @Post("ext-gateway-entity-34")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity34.create")
  async createExtGatewayEntity34(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity34(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-34" })
  @Put("ext-gateway-entity-34/:id")
  @Permissions("ext-gateway.extGatewayEntity34.update")
  async updateExtGatewayEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity34(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-34" })
  @Delete("ext-gateway-entity-34/:id")
  @Permissions("ext-gateway.extGatewayEntity34.delete")
  async deleteExtGatewayEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List ext-gateway-entity-35" })
  @Get("ext-gateway-entity-35")
  @Permissions("ext-gateway.extGatewayEntity35.read")
  async listExtGatewayEntity35(@Req() req: AuthenticatedRequest) {
    return this.svc.listExtGatewayEntity35(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get ext-gateway-entity-35" })
  @Get("ext-gateway-entity-35/:id")
  @Permissions("ext-gateway.extGatewayEntity35.read")
  async getExtGatewayEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExtGatewayEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create ext-gateway-entity-35" })
  @Post("ext-gateway-entity-35")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("ext-gateway.extGatewayEntity35.create")
  async createExtGatewayEntity35(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createExtGatewayEntity35(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update ext-gateway-entity-35" })
  @Put("ext-gateway-entity-35/:id")
  @Permissions("ext-gateway.extGatewayEntity35.update")
  async updateExtGatewayEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateExtGatewayEntity35(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete ext-gateway-entity-35" })
  @Delete("ext-gateway-entity-35/:id")
  @Permissions("ext-gateway.extGatewayEntity35.delete")
  async deleteExtGatewayEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExtGatewayEntity35(req.user.tenantId, id);
  }
}
