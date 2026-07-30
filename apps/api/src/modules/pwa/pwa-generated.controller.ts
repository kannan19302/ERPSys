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
import { PwaGeneratedService } from "./pwa-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("pwa")
@ApiBearerAuth()
@Controller("pwa")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PwaGeneratedController {
  constructor(private readonly svc: PwaGeneratedService) {}

  @ApiOperation({ summary: "List pwa-entity-1" })
  @Get("pwa-entity-1")
  @Permissions("pwa.pwaEntity1.read")
  async listPwaEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-1" })
  @Get("pwa-entity-1/:id")
  @Permissions("pwa.pwaEntity1.read")
  async getPwaEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-1" })
  @Post("pwa-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity1.create")
  async createPwaEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-1" })
  @Put("pwa-entity-1/:id")
  @Permissions("pwa.pwaEntity1.update")
  async updatePwaEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-1" })
  @Delete("pwa-entity-1/:id")
  @Permissions("pwa.pwaEntity1.delete")
  async deletePwaEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-2" })
  @Get("pwa-entity-2")
  @Permissions("pwa.pwaEntity2.read")
  async listPwaEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-2" })
  @Get("pwa-entity-2/:id")
  @Permissions("pwa.pwaEntity2.read")
  async getPwaEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-2" })
  @Post("pwa-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity2.create")
  async createPwaEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-2" })
  @Put("pwa-entity-2/:id")
  @Permissions("pwa.pwaEntity2.update")
  async updatePwaEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-2" })
  @Delete("pwa-entity-2/:id")
  @Permissions("pwa.pwaEntity2.delete")
  async deletePwaEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-3" })
  @Get("pwa-entity-3")
  @Permissions("pwa.pwaEntity3.read")
  async listPwaEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-3" })
  @Get("pwa-entity-3/:id")
  @Permissions("pwa.pwaEntity3.read")
  async getPwaEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-3" })
  @Post("pwa-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity3.create")
  async createPwaEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-3" })
  @Put("pwa-entity-3/:id")
  @Permissions("pwa.pwaEntity3.update")
  async updatePwaEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-3" })
  @Delete("pwa-entity-3/:id")
  @Permissions("pwa.pwaEntity3.delete")
  async deletePwaEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-4" })
  @Get("pwa-entity-4")
  @Permissions("pwa.pwaEntity4.read")
  async listPwaEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-4" })
  @Get("pwa-entity-4/:id")
  @Permissions("pwa.pwaEntity4.read")
  async getPwaEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-4" })
  @Post("pwa-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity4.create")
  async createPwaEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-4" })
  @Put("pwa-entity-4/:id")
  @Permissions("pwa.pwaEntity4.update")
  async updatePwaEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-4" })
  @Delete("pwa-entity-4/:id")
  @Permissions("pwa.pwaEntity4.delete")
  async deletePwaEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-5" })
  @Get("pwa-entity-5")
  @Permissions("pwa.pwaEntity5.read")
  async listPwaEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-5" })
  @Get("pwa-entity-5/:id")
  @Permissions("pwa.pwaEntity5.read")
  async getPwaEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-5" })
  @Post("pwa-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity5.create")
  async createPwaEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-5" })
  @Put("pwa-entity-5/:id")
  @Permissions("pwa.pwaEntity5.update")
  async updatePwaEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-5" })
  @Delete("pwa-entity-5/:id")
  @Permissions("pwa.pwaEntity5.delete")
  async deletePwaEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-6" })
  @Get("pwa-entity-6")
  @Permissions("pwa.pwaEntity6.read")
  async listPwaEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-6" })
  @Get("pwa-entity-6/:id")
  @Permissions("pwa.pwaEntity6.read")
  async getPwaEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-6" })
  @Post("pwa-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity6.create")
  async createPwaEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-6" })
  @Put("pwa-entity-6/:id")
  @Permissions("pwa.pwaEntity6.update")
  async updatePwaEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-6" })
  @Delete("pwa-entity-6/:id")
  @Permissions("pwa.pwaEntity6.delete")
  async deletePwaEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-7" })
  @Get("pwa-entity-7")
  @Permissions("pwa.pwaEntity7.read")
  async listPwaEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-7" })
  @Get("pwa-entity-7/:id")
  @Permissions("pwa.pwaEntity7.read")
  async getPwaEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-7" })
  @Post("pwa-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity7.create")
  async createPwaEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-7" })
  @Put("pwa-entity-7/:id")
  @Permissions("pwa.pwaEntity7.update")
  async updatePwaEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-7" })
  @Delete("pwa-entity-7/:id")
  @Permissions("pwa.pwaEntity7.delete")
  async deletePwaEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-8" })
  @Get("pwa-entity-8")
  @Permissions("pwa.pwaEntity8.read")
  async listPwaEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-8" })
  @Get("pwa-entity-8/:id")
  @Permissions("pwa.pwaEntity8.read")
  async getPwaEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-8" })
  @Post("pwa-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity8.create")
  async createPwaEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-8" })
  @Put("pwa-entity-8/:id")
  @Permissions("pwa.pwaEntity8.update")
  async updatePwaEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-8" })
  @Delete("pwa-entity-8/:id")
  @Permissions("pwa.pwaEntity8.delete")
  async deletePwaEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-9" })
  @Get("pwa-entity-9")
  @Permissions("pwa.pwaEntity9.read")
  async listPwaEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-9" })
  @Get("pwa-entity-9/:id")
  @Permissions("pwa.pwaEntity9.read")
  async getPwaEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-9" })
  @Post("pwa-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity9.create")
  async createPwaEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-9" })
  @Put("pwa-entity-9/:id")
  @Permissions("pwa.pwaEntity9.update")
  async updatePwaEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-9" })
  @Delete("pwa-entity-9/:id")
  @Permissions("pwa.pwaEntity9.delete")
  async deletePwaEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-10" })
  @Get("pwa-entity-10")
  @Permissions("pwa.pwaEntity10.read")
  async listPwaEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-10" })
  @Get("pwa-entity-10/:id")
  @Permissions("pwa.pwaEntity10.read")
  async getPwaEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-10" })
  @Post("pwa-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity10.create")
  async createPwaEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-10" })
  @Put("pwa-entity-10/:id")
  @Permissions("pwa.pwaEntity10.update")
  async updatePwaEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-10" })
  @Delete("pwa-entity-10/:id")
  @Permissions("pwa.pwaEntity10.delete")
  async deletePwaEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-11" })
  @Get("pwa-entity-11")
  @Permissions("pwa.pwaEntity11.read")
  async listPwaEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-11" })
  @Get("pwa-entity-11/:id")
  @Permissions("pwa.pwaEntity11.read")
  async getPwaEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-11" })
  @Post("pwa-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity11.create")
  async createPwaEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-11" })
  @Put("pwa-entity-11/:id")
  @Permissions("pwa.pwaEntity11.update")
  async updatePwaEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-11" })
  @Delete("pwa-entity-11/:id")
  @Permissions("pwa.pwaEntity11.delete")
  async deletePwaEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-12" })
  @Get("pwa-entity-12")
  @Permissions("pwa.pwaEntity12.read")
  async listPwaEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-12" })
  @Get("pwa-entity-12/:id")
  @Permissions("pwa.pwaEntity12.read")
  async getPwaEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-12" })
  @Post("pwa-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity12.create")
  async createPwaEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-12" })
  @Put("pwa-entity-12/:id")
  @Permissions("pwa.pwaEntity12.update")
  async updatePwaEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-12" })
  @Delete("pwa-entity-12/:id")
  @Permissions("pwa.pwaEntity12.delete")
  async deletePwaEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-13" })
  @Get("pwa-entity-13")
  @Permissions("pwa.pwaEntity13.read")
  async listPwaEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-13" })
  @Get("pwa-entity-13/:id")
  @Permissions("pwa.pwaEntity13.read")
  async getPwaEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-13" })
  @Post("pwa-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity13.create")
  async createPwaEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-13" })
  @Put("pwa-entity-13/:id")
  @Permissions("pwa.pwaEntity13.update")
  async updatePwaEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-13" })
  @Delete("pwa-entity-13/:id")
  @Permissions("pwa.pwaEntity13.delete")
  async deletePwaEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-14" })
  @Get("pwa-entity-14")
  @Permissions("pwa.pwaEntity14.read")
  async listPwaEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-14" })
  @Get("pwa-entity-14/:id")
  @Permissions("pwa.pwaEntity14.read")
  async getPwaEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-14" })
  @Post("pwa-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity14.create")
  async createPwaEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-14" })
  @Put("pwa-entity-14/:id")
  @Permissions("pwa.pwaEntity14.update")
  async updatePwaEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-14" })
  @Delete("pwa-entity-14/:id")
  @Permissions("pwa.pwaEntity14.delete")
  async deletePwaEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-15" })
  @Get("pwa-entity-15")
  @Permissions("pwa.pwaEntity15.read")
  async listPwaEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-15" })
  @Get("pwa-entity-15/:id")
  @Permissions("pwa.pwaEntity15.read")
  async getPwaEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-15" })
  @Post("pwa-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity15.create")
  async createPwaEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-15" })
  @Put("pwa-entity-15/:id")
  @Permissions("pwa.pwaEntity15.update")
  async updatePwaEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-15" })
  @Delete("pwa-entity-15/:id")
  @Permissions("pwa.pwaEntity15.delete")
  async deletePwaEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-16" })
  @Get("pwa-entity-16")
  @Permissions("pwa.pwaEntity16.read")
  async listPwaEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-16" })
  @Get("pwa-entity-16/:id")
  @Permissions("pwa.pwaEntity16.read")
  async getPwaEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-16" })
  @Post("pwa-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity16.create")
  async createPwaEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-16" })
  @Put("pwa-entity-16/:id")
  @Permissions("pwa.pwaEntity16.update")
  async updatePwaEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-16" })
  @Delete("pwa-entity-16/:id")
  @Permissions("pwa.pwaEntity16.delete")
  async deletePwaEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-17" })
  @Get("pwa-entity-17")
  @Permissions("pwa.pwaEntity17.read")
  async listPwaEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-17" })
  @Get("pwa-entity-17/:id")
  @Permissions("pwa.pwaEntity17.read")
  async getPwaEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-17" })
  @Post("pwa-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity17.create")
  async createPwaEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-17" })
  @Put("pwa-entity-17/:id")
  @Permissions("pwa.pwaEntity17.update")
  async updatePwaEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-17" })
  @Delete("pwa-entity-17/:id")
  @Permissions("pwa.pwaEntity17.delete")
  async deletePwaEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-18" })
  @Get("pwa-entity-18")
  @Permissions("pwa.pwaEntity18.read")
  async listPwaEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-18" })
  @Get("pwa-entity-18/:id")
  @Permissions("pwa.pwaEntity18.read")
  async getPwaEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-18" })
  @Post("pwa-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity18.create")
  async createPwaEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-18" })
  @Put("pwa-entity-18/:id")
  @Permissions("pwa.pwaEntity18.update")
  async updatePwaEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-18" })
  @Delete("pwa-entity-18/:id")
  @Permissions("pwa.pwaEntity18.delete")
  async deletePwaEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-19" })
  @Get("pwa-entity-19")
  @Permissions("pwa.pwaEntity19.read")
  async listPwaEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-19" })
  @Get("pwa-entity-19/:id")
  @Permissions("pwa.pwaEntity19.read")
  async getPwaEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-19" })
  @Post("pwa-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity19.create")
  async createPwaEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-19" })
  @Put("pwa-entity-19/:id")
  @Permissions("pwa.pwaEntity19.update")
  async updatePwaEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-19" })
  @Delete("pwa-entity-19/:id")
  @Permissions("pwa.pwaEntity19.delete")
  async deletePwaEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-20" })
  @Get("pwa-entity-20")
  @Permissions("pwa.pwaEntity20.read")
  async listPwaEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-20" })
  @Get("pwa-entity-20/:id")
  @Permissions("pwa.pwaEntity20.read")
  async getPwaEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-20" })
  @Post("pwa-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity20.create")
  async createPwaEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-20" })
  @Put("pwa-entity-20/:id")
  @Permissions("pwa.pwaEntity20.update")
  async updatePwaEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-20" })
  @Delete("pwa-entity-20/:id")
  @Permissions("pwa.pwaEntity20.delete")
  async deletePwaEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List pwa-entity-21" })
  @Get("pwa-entity-21")
  @Permissions("pwa.pwaEntity21.read")
  async listPwaEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listPwaEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pwa-entity-21" })
  @Get("pwa-entity-21/:id")
  @Permissions("pwa.pwaEntity21.read")
  async getPwaEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPwaEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create pwa-entity-21" })
  @Post("pwa-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("pwa.pwaEntity21.create")
  async createPwaEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createPwaEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update pwa-entity-21" })
  @Put("pwa-entity-21/:id")
  @Permissions("pwa.pwaEntity21.update")
  async updatePwaEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updatePwaEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete pwa-entity-21" })
  @Delete("pwa-entity-21/:id")
  @Permissions("pwa.pwaEntity21.delete")
  async deletePwaEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePwaEntity21(req.user.tenantId, id);
  }
}
