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
import { OutboxGeneratedService } from "./outbox-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("outbox")
@ApiBearerAuth()
@Controller("outbox")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OutboxGeneratedController {
  constructor(private readonly svc: OutboxGeneratedService) {}

  @ApiOperation({ summary: "List outbox-entity-1" })
  @Get("outbox-entity-1")
  @Permissions("outbox.outboxEntity1.read")
  async listOutboxEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-1" })
  @Get("outbox-entity-1/:id")
  @Permissions("outbox.outboxEntity1.read")
  async getOutboxEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-1" })
  @Post("outbox-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity1.create")
  async createOutboxEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-1" })
  @Put("outbox-entity-1/:id")
  @Permissions("outbox.outboxEntity1.update")
  async updateOutboxEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-1" })
  @Delete("outbox-entity-1/:id")
  @Permissions("outbox.outboxEntity1.delete")
  async deleteOutboxEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-2" })
  @Get("outbox-entity-2")
  @Permissions("outbox.outboxEntity2.read")
  async listOutboxEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-2" })
  @Get("outbox-entity-2/:id")
  @Permissions("outbox.outboxEntity2.read")
  async getOutboxEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-2" })
  @Post("outbox-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity2.create")
  async createOutboxEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-2" })
  @Put("outbox-entity-2/:id")
  @Permissions("outbox.outboxEntity2.update")
  async updateOutboxEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-2" })
  @Delete("outbox-entity-2/:id")
  @Permissions("outbox.outboxEntity2.delete")
  async deleteOutboxEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-3" })
  @Get("outbox-entity-3")
  @Permissions("outbox.outboxEntity3.read")
  async listOutboxEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-3" })
  @Get("outbox-entity-3/:id")
  @Permissions("outbox.outboxEntity3.read")
  async getOutboxEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-3" })
  @Post("outbox-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity3.create")
  async createOutboxEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-3" })
  @Put("outbox-entity-3/:id")
  @Permissions("outbox.outboxEntity3.update")
  async updateOutboxEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-3" })
  @Delete("outbox-entity-3/:id")
  @Permissions("outbox.outboxEntity3.delete")
  async deleteOutboxEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-4" })
  @Get("outbox-entity-4")
  @Permissions("outbox.outboxEntity4.read")
  async listOutboxEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-4" })
  @Get("outbox-entity-4/:id")
  @Permissions("outbox.outboxEntity4.read")
  async getOutboxEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-4" })
  @Post("outbox-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity4.create")
  async createOutboxEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-4" })
  @Put("outbox-entity-4/:id")
  @Permissions("outbox.outboxEntity4.update")
  async updateOutboxEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-4" })
  @Delete("outbox-entity-4/:id")
  @Permissions("outbox.outboxEntity4.delete")
  async deleteOutboxEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-5" })
  @Get("outbox-entity-5")
  @Permissions("outbox.outboxEntity5.read")
  async listOutboxEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-5" })
  @Get("outbox-entity-5/:id")
  @Permissions("outbox.outboxEntity5.read")
  async getOutboxEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-5" })
  @Post("outbox-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity5.create")
  async createOutboxEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-5" })
  @Put("outbox-entity-5/:id")
  @Permissions("outbox.outboxEntity5.update")
  async updateOutboxEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-5" })
  @Delete("outbox-entity-5/:id")
  @Permissions("outbox.outboxEntity5.delete")
  async deleteOutboxEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-6" })
  @Get("outbox-entity-6")
  @Permissions("outbox.outboxEntity6.read")
  async listOutboxEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-6" })
  @Get("outbox-entity-6/:id")
  @Permissions("outbox.outboxEntity6.read")
  async getOutboxEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-6" })
  @Post("outbox-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity6.create")
  async createOutboxEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-6" })
  @Put("outbox-entity-6/:id")
  @Permissions("outbox.outboxEntity6.update")
  async updateOutboxEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-6" })
  @Delete("outbox-entity-6/:id")
  @Permissions("outbox.outboxEntity6.delete")
  async deleteOutboxEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-7" })
  @Get("outbox-entity-7")
  @Permissions("outbox.outboxEntity7.read")
  async listOutboxEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-7" })
  @Get("outbox-entity-7/:id")
  @Permissions("outbox.outboxEntity7.read")
  async getOutboxEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-7" })
  @Post("outbox-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity7.create")
  async createOutboxEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-7" })
  @Put("outbox-entity-7/:id")
  @Permissions("outbox.outboxEntity7.update")
  async updateOutboxEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-7" })
  @Delete("outbox-entity-7/:id")
  @Permissions("outbox.outboxEntity7.delete")
  async deleteOutboxEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-8" })
  @Get("outbox-entity-8")
  @Permissions("outbox.outboxEntity8.read")
  async listOutboxEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-8" })
  @Get("outbox-entity-8/:id")
  @Permissions("outbox.outboxEntity8.read")
  async getOutboxEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-8" })
  @Post("outbox-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity8.create")
  async createOutboxEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-8" })
  @Put("outbox-entity-8/:id")
  @Permissions("outbox.outboxEntity8.update")
  async updateOutboxEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-8" })
  @Delete("outbox-entity-8/:id")
  @Permissions("outbox.outboxEntity8.delete")
  async deleteOutboxEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-9" })
  @Get("outbox-entity-9")
  @Permissions("outbox.outboxEntity9.read")
  async listOutboxEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-9" })
  @Get("outbox-entity-9/:id")
  @Permissions("outbox.outboxEntity9.read")
  async getOutboxEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-9" })
  @Post("outbox-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity9.create")
  async createOutboxEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-9" })
  @Put("outbox-entity-9/:id")
  @Permissions("outbox.outboxEntity9.update")
  async updateOutboxEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-9" })
  @Delete("outbox-entity-9/:id")
  @Permissions("outbox.outboxEntity9.delete")
  async deleteOutboxEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-10" })
  @Get("outbox-entity-10")
  @Permissions("outbox.outboxEntity10.read")
  async listOutboxEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-10" })
  @Get("outbox-entity-10/:id")
  @Permissions("outbox.outboxEntity10.read")
  async getOutboxEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-10" })
  @Post("outbox-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity10.create")
  async createOutboxEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-10" })
  @Put("outbox-entity-10/:id")
  @Permissions("outbox.outboxEntity10.update")
  async updateOutboxEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-10" })
  @Delete("outbox-entity-10/:id")
  @Permissions("outbox.outboxEntity10.delete")
  async deleteOutboxEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-11" })
  @Get("outbox-entity-11")
  @Permissions("outbox.outboxEntity11.read")
  async listOutboxEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-11" })
  @Get("outbox-entity-11/:id")
  @Permissions("outbox.outboxEntity11.read")
  async getOutboxEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-11" })
  @Post("outbox-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity11.create")
  async createOutboxEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-11" })
  @Put("outbox-entity-11/:id")
  @Permissions("outbox.outboxEntity11.update")
  async updateOutboxEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-11" })
  @Delete("outbox-entity-11/:id")
  @Permissions("outbox.outboxEntity11.delete")
  async deleteOutboxEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-12" })
  @Get("outbox-entity-12")
  @Permissions("outbox.outboxEntity12.read")
  async listOutboxEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-12" })
  @Get("outbox-entity-12/:id")
  @Permissions("outbox.outboxEntity12.read")
  async getOutboxEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-12" })
  @Post("outbox-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity12.create")
  async createOutboxEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-12" })
  @Put("outbox-entity-12/:id")
  @Permissions("outbox.outboxEntity12.update")
  async updateOutboxEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-12" })
  @Delete("outbox-entity-12/:id")
  @Permissions("outbox.outboxEntity12.delete")
  async deleteOutboxEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-13" })
  @Get("outbox-entity-13")
  @Permissions("outbox.outboxEntity13.read")
  async listOutboxEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-13" })
  @Get("outbox-entity-13/:id")
  @Permissions("outbox.outboxEntity13.read")
  async getOutboxEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-13" })
  @Post("outbox-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity13.create")
  async createOutboxEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-13" })
  @Put("outbox-entity-13/:id")
  @Permissions("outbox.outboxEntity13.update")
  async updateOutboxEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-13" })
  @Delete("outbox-entity-13/:id")
  @Permissions("outbox.outboxEntity13.delete")
  async deleteOutboxEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-14" })
  @Get("outbox-entity-14")
  @Permissions("outbox.outboxEntity14.read")
  async listOutboxEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-14" })
  @Get("outbox-entity-14/:id")
  @Permissions("outbox.outboxEntity14.read")
  async getOutboxEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-14" })
  @Post("outbox-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity14.create")
  async createOutboxEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-14" })
  @Put("outbox-entity-14/:id")
  @Permissions("outbox.outboxEntity14.update")
  async updateOutboxEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-14" })
  @Delete("outbox-entity-14/:id")
  @Permissions("outbox.outboxEntity14.delete")
  async deleteOutboxEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-15" })
  @Get("outbox-entity-15")
  @Permissions("outbox.outboxEntity15.read")
  async listOutboxEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-15" })
  @Get("outbox-entity-15/:id")
  @Permissions("outbox.outboxEntity15.read")
  async getOutboxEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-15" })
  @Post("outbox-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity15.create")
  async createOutboxEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-15" })
  @Put("outbox-entity-15/:id")
  @Permissions("outbox.outboxEntity15.update")
  async updateOutboxEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-15" })
  @Delete("outbox-entity-15/:id")
  @Permissions("outbox.outboxEntity15.delete")
  async deleteOutboxEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-16" })
  @Get("outbox-entity-16")
  @Permissions("outbox.outboxEntity16.read")
  async listOutboxEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-16" })
  @Get("outbox-entity-16/:id")
  @Permissions("outbox.outboxEntity16.read")
  async getOutboxEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-16" })
  @Post("outbox-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity16.create")
  async createOutboxEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-16" })
  @Put("outbox-entity-16/:id")
  @Permissions("outbox.outboxEntity16.update")
  async updateOutboxEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-16" })
  @Delete("outbox-entity-16/:id")
  @Permissions("outbox.outboxEntity16.delete")
  async deleteOutboxEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-17" })
  @Get("outbox-entity-17")
  @Permissions("outbox.outboxEntity17.read")
  async listOutboxEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-17" })
  @Get("outbox-entity-17/:id")
  @Permissions("outbox.outboxEntity17.read")
  async getOutboxEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-17" })
  @Post("outbox-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity17.create")
  async createOutboxEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-17" })
  @Put("outbox-entity-17/:id")
  @Permissions("outbox.outboxEntity17.update")
  async updateOutboxEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-17" })
  @Delete("outbox-entity-17/:id")
  @Permissions("outbox.outboxEntity17.delete")
  async deleteOutboxEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-18" })
  @Get("outbox-entity-18")
  @Permissions("outbox.outboxEntity18.read")
  async listOutboxEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-18" })
  @Get("outbox-entity-18/:id")
  @Permissions("outbox.outboxEntity18.read")
  async getOutboxEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-18" })
  @Post("outbox-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity18.create")
  async createOutboxEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-18" })
  @Put("outbox-entity-18/:id")
  @Permissions("outbox.outboxEntity18.update")
  async updateOutboxEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-18" })
  @Delete("outbox-entity-18/:id")
  @Permissions("outbox.outboxEntity18.delete")
  async deleteOutboxEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-19" })
  @Get("outbox-entity-19")
  @Permissions("outbox.outboxEntity19.read")
  async listOutboxEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-19" })
  @Get("outbox-entity-19/:id")
  @Permissions("outbox.outboxEntity19.read")
  async getOutboxEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-19" })
  @Post("outbox-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity19.create")
  async createOutboxEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-19" })
  @Put("outbox-entity-19/:id")
  @Permissions("outbox.outboxEntity19.update")
  async updateOutboxEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-19" })
  @Delete("outbox-entity-19/:id")
  @Permissions("outbox.outboxEntity19.delete")
  async deleteOutboxEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-20" })
  @Get("outbox-entity-20")
  @Permissions("outbox.outboxEntity20.read")
  async listOutboxEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-20" })
  @Get("outbox-entity-20/:id")
  @Permissions("outbox.outboxEntity20.read")
  async getOutboxEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-20" })
  @Post("outbox-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity20.create")
  async createOutboxEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-20" })
  @Put("outbox-entity-20/:id")
  @Permissions("outbox.outboxEntity20.update")
  async updateOutboxEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-20" })
  @Delete("outbox-entity-20/:id")
  @Permissions("outbox.outboxEntity20.delete")
  async deleteOutboxEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List outbox-entity-21" })
  @Get("outbox-entity-21")
  @Permissions("outbox.outboxEntity21.read")
  async listOutboxEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listOutboxEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get outbox-entity-21" })
  @Get("outbox-entity-21/:id")
  @Permissions("outbox.outboxEntity21.read")
  async getOutboxEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getOutboxEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outbox-entity-21" })
  @Post("outbox-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("outbox.outboxEntity21.create")
  async createOutboxEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createOutboxEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update outbox-entity-21" })
  @Put("outbox-entity-21/:id")
  @Permissions("outbox.outboxEntity21.update")
  async updateOutboxEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateOutboxEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete outbox-entity-21" })
  @Delete("outbox-entity-21/:id")
  @Permissions("outbox.outboxEntity21.delete")
  async deleteOutboxEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteOutboxEntity21(req.user.tenantId, id);
  }
}
