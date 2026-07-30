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
import { BlockchainGeneratedService } from "./blockchain-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("blockchain")
@ApiBearerAuth()
@Controller("blockchain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class BlockchainGeneratedController {
  constructor(private readonly svc: BlockchainGeneratedService) {}

  @ApiOperation({ summary: "List blockchain-entity-1" })
  @Get("blockchain-entity-1")
  @Permissions("blockchain.blockchainEntity1.read")
  async listBlockchainEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-1" })
  @Get("blockchain-entity-1/:id")
  @Permissions("blockchain.blockchainEntity1.read")
  async getBlockchainEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-1" })
  @Post("blockchain-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity1.create")
  async createBlockchainEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-1" })
  @Put("blockchain-entity-1/:id")
  @Permissions("blockchain.blockchainEntity1.update")
  async updateBlockchainEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-1" })
  @Delete("blockchain-entity-1/:id")
  @Permissions("blockchain.blockchainEntity1.delete")
  async deleteBlockchainEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-2" })
  @Get("blockchain-entity-2")
  @Permissions("blockchain.blockchainEntity2.read")
  async listBlockchainEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-2" })
  @Get("blockchain-entity-2/:id")
  @Permissions("blockchain.blockchainEntity2.read")
  async getBlockchainEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-2" })
  @Post("blockchain-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity2.create")
  async createBlockchainEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-2" })
  @Put("blockchain-entity-2/:id")
  @Permissions("blockchain.blockchainEntity2.update")
  async updateBlockchainEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-2" })
  @Delete("blockchain-entity-2/:id")
  @Permissions("blockchain.blockchainEntity2.delete")
  async deleteBlockchainEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-3" })
  @Get("blockchain-entity-3")
  @Permissions("blockchain.blockchainEntity3.read")
  async listBlockchainEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-3" })
  @Get("blockchain-entity-3/:id")
  @Permissions("blockchain.blockchainEntity3.read")
  async getBlockchainEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-3" })
  @Post("blockchain-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity3.create")
  async createBlockchainEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-3" })
  @Put("blockchain-entity-3/:id")
  @Permissions("blockchain.blockchainEntity3.update")
  async updateBlockchainEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-3" })
  @Delete("blockchain-entity-3/:id")
  @Permissions("blockchain.blockchainEntity3.delete")
  async deleteBlockchainEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-4" })
  @Get("blockchain-entity-4")
  @Permissions("blockchain.blockchainEntity4.read")
  async listBlockchainEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-4" })
  @Get("blockchain-entity-4/:id")
  @Permissions("blockchain.blockchainEntity4.read")
  async getBlockchainEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-4" })
  @Post("blockchain-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity4.create")
  async createBlockchainEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-4" })
  @Put("blockchain-entity-4/:id")
  @Permissions("blockchain.blockchainEntity4.update")
  async updateBlockchainEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-4" })
  @Delete("blockchain-entity-4/:id")
  @Permissions("blockchain.blockchainEntity4.delete")
  async deleteBlockchainEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-5" })
  @Get("blockchain-entity-5")
  @Permissions("blockchain.blockchainEntity5.read")
  async listBlockchainEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-5" })
  @Get("blockchain-entity-5/:id")
  @Permissions("blockchain.blockchainEntity5.read")
  async getBlockchainEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-5" })
  @Post("blockchain-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity5.create")
  async createBlockchainEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-5" })
  @Put("blockchain-entity-5/:id")
  @Permissions("blockchain.blockchainEntity5.update")
  async updateBlockchainEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-5" })
  @Delete("blockchain-entity-5/:id")
  @Permissions("blockchain.blockchainEntity5.delete")
  async deleteBlockchainEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-6" })
  @Get("blockchain-entity-6")
  @Permissions("blockchain.blockchainEntity6.read")
  async listBlockchainEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-6" })
  @Get("blockchain-entity-6/:id")
  @Permissions("blockchain.blockchainEntity6.read")
  async getBlockchainEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-6" })
  @Post("blockchain-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity6.create")
  async createBlockchainEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-6" })
  @Put("blockchain-entity-6/:id")
  @Permissions("blockchain.blockchainEntity6.update")
  async updateBlockchainEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-6" })
  @Delete("blockchain-entity-6/:id")
  @Permissions("blockchain.blockchainEntity6.delete")
  async deleteBlockchainEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-7" })
  @Get("blockchain-entity-7")
  @Permissions("blockchain.blockchainEntity7.read")
  async listBlockchainEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-7" })
  @Get("blockchain-entity-7/:id")
  @Permissions("blockchain.blockchainEntity7.read")
  async getBlockchainEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-7" })
  @Post("blockchain-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity7.create")
  async createBlockchainEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-7" })
  @Put("blockchain-entity-7/:id")
  @Permissions("blockchain.blockchainEntity7.update")
  async updateBlockchainEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-7" })
  @Delete("blockchain-entity-7/:id")
  @Permissions("blockchain.blockchainEntity7.delete")
  async deleteBlockchainEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-8" })
  @Get("blockchain-entity-8")
  @Permissions("blockchain.blockchainEntity8.read")
  async listBlockchainEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-8" })
  @Get("blockchain-entity-8/:id")
  @Permissions("blockchain.blockchainEntity8.read")
  async getBlockchainEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-8" })
  @Post("blockchain-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity8.create")
  async createBlockchainEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-8" })
  @Put("blockchain-entity-8/:id")
  @Permissions("blockchain.blockchainEntity8.update")
  async updateBlockchainEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-8" })
  @Delete("blockchain-entity-8/:id")
  @Permissions("blockchain.blockchainEntity8.delete")
  async deleteBlockchainEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-9" })
  @Get("blockchain-entity-9")
  @Permissions("blockchain.blockchainEntity9.read")
  async listBlockchainEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-9" })
  @Get("blockchain-entity-9/:id")
  @Permissions("blockchain.blockchainEntity9.read")
  async getBlockchainEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-9" })
  @Post("blockchain-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity9.create")
  async createBlockchainEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-9" })
  @Put("blockchain-entity-9/:id")
  @Permissions("blockchain.blockchainEntity9.update")
  async updateBlockchainEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-9" })
  @Delete("blockchain-entity-9/:id")
  @Permissions("blockchain.blockchainEntity9.delete")
  async deleteBlockchainEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-10" })
  @Get("blockchain-entity-10")
  @Permissions("blockchain.blockchainEntity10.read")
  async listBlockchainEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-10" })
  @Get("blockchain-entity-10/:id")
  @Permissions("blockchain.blockchainEntity10.read")
  async getBlockchainEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-10" })
  @Post("blockchain-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity10.create")
  async createBlockchainEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-10" })
  @Put("blockchain-entity-10/:id")
  @Permissions("blockchain.blockchainEntity10.update")
  async updateBlockchainEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-10" })
  @Delete("blockchain-entity-10/:id")
  @Permissions("blockchain.blockchainEntity10.delete")
  async deleteBlockchainEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-11" })
  @Get("blockchain-entity-11")
  @Permissions("blockchain.blockchainEntity11.read")
  async listBlockchainEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-11" })
  @Get("blockchain-entity-11/:id")
  @Permissions("blockchain.blockchainEntity11.read")
  async getBlockchainEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-11" })
  @Post("blockchain-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity11.create")
  async createBlockchainEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-11" })
  @Put("blockchain-entity-11/:id")
  @Permissions("blockchain.blockchainEntity11.update")
  async updateBlockchainEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-11" })
  @Delete("blockchain-entity-11/:id")
  @Permissions("blockchain.blockchainEntity11.delete")
  async deleteBlockchainEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-12" })
  @Get("blockchain-entity-12")
  @Permissions("blockchain.blockchainEntity12.read")
  async listBlockchainEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-12" })
  @Get("blockchain-entity-12/:id")
  @Permissions("blockchain.blockchainEntity12.read")
  async getBlockchainEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-12" })
  @Post("blockchain-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity12.create")
  async createBlockchainEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-12" })
  @Put("blockchain-entity-12/:id")
  @Permissions("blockchain.blockchainEntity12.update")
  async updateBlockchainEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-12" })
  @Delete("blockchain-entity-12/:id")
  @Permissions("blockchain.blockchainEntity12.delete")
  async deleteBlockchainEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-13" })
  @Get("blockchain-entity-13")
  @Permissions("blockchain.blockchainEntity13.read")
  async listBlockchainEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-13" })
  @Get("blockchain-entity-13/:id")
  @Permissions("blockchain.blockchainEntity13.read")
  async getBlockchainEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-13" })
  @Post("blockchain-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity13.create")
  async createBlockchainEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-13" })
  @Put("blockchain-entity-13/:id")
  @Permissions("blockchain.blockchainEntity13.update")
  async updateBlockchainEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-13" })
  @Delete("blockchain-entity-13/:id")
  @Permissions("blockchain.blockchainEntity13.delete")
  async deleteBlockchainEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-14" })
  @Get("blockchain-entity-14")
  @Permissions("blockchain.blockchainEntity14.read")
  async listBlockchainEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-14" })
  @Get("blockchain-entity-14/:id")
  @Permissions("blockchain.blockchainEntity14.read")
  async getBlockchainEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-14" })
  @Post("blockchain-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity14.create")
  async createBlockchainEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-14" })
  @Put("blockchain-entity-14/:id")
  @Permissions("blockchain.blockchainEntity14.update")
  async updateBlockchainEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-14" })
  @Delete("blockchain-entity-14/:id")
  @Permissions("blockchain.blockchainEntity14.delete")
  async deleteBlockchainEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-15" })
  @Get("blockchain-entity-15")
  @Permissions("blockchain.blockchainEntity15.read")
  async listBlockchainEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-15" })
  @Get("blockchain-entity-15/:id")
  @Permissions("blockchain.blockchainEntity15.read")
  async getBlockchainEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-15" })
  @Post("blockchain-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity15.create")
  async createBlockchainEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-15" })
  @Put("blockchain-entity-15/:id")
  @Permissions("blockchain.blockchainEntity15.update")
  async updateBlockchainEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-15" })
  @Delete("blockchain-entity-15/:id")
  @Permissions("blockchain.blockchainEntity15.delete")
  async deleteBlockchainEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-16" })
  @Get("blockchain-entity-16")
  @Permissions("blockchain.blockchainEntity16.read")
  async listBlockchainEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-16" })
  @Get("blockchain-entity-16/:id")
  @Permissions("blockchain.blockchainEntity16.read")
  async getBlockchainEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-16" })
  @Post("blockchain-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity16.create")
  async createBlockchainEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-16" })
  @Put("blockchain-entity-16/:id")
  @Permissions("blockchain.blockchainEntity16.update")
  async updateBlockchainEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-16" })
  @Delete("blockchain-entity-16/:id")
  @Permissions("blockchain.blockchainEntity16.delete")
  async deleteBlockchainEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-17" })
  @Get("blockchain-entity-17")
  @Permissions("blockchain.blockchainEntity17.read")
  async listBlockchainEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-17" })
  @Get("blockchain-entity-17/:id")
  @Permissions("blockchain.blockchainEntity17.read")
  async getBlockchainEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-17" })
  @Post("blockchain-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity17.create")
  async createBlockchainEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-17" })
  @Put("blockchain-entity-17/:id")
  @Permissions("blockchain.blockchainEntity17.update")
  async updateBlockchainEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-17" })
  @Delete("blockchain-entity-17/:id")
  @Permissions("blockchain.blockchainEntity17.delete")
  async deleteBlockchainEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-18" })
  @Get("blockchain-entity-18")
  @Permissions("blockchain.blockchainEntity18.read")
  async listBlockchainEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-18" })
  @Get("blockchain-entity-18/:id")
  @Permissions("blockchain.blockchainEntity18.read")
  async getBlockchainEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-18" })
  @Post("blockchain-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity18.create")
  async createBlockchainEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-18" })
  @Put("blockchain-entity-18/:id")
  @Permissions("blockchain.blockchainEntity18.update")
  async updateBlockchainEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-18" })
  @Delete("blockchain-entity-18/:id")
  @Permissions("blockchain.blockchainEntity18.delete")
  async deleteBlockchainEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-19" })
  @Get("blockchain-entity-19")
  @Permissions("blockchain.blockchainEntity19.read")
  async listBlockchainEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-19" })
  @Get("blockchain-entity-19/:id")
  @Permissions("blockchain.blockchainEntity19.read")
  async getBlockchainEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-19" })
  @Post("blockchain-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity19.create")
  async createBlockchainEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-19" })
  @Put("blockchain-entity-19/:id")
  @Permissions("blockchain.blockchainEntity19.update")
  async updateBlockchainEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-19" })
  @Delete("blockchain-entity-19/:id")
  @Permissions("blockchain.blockchainEntity19.delete")
  async deleteBlockchainEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-20" })
  @Get("blockchain-entity-20")
  @Permissions("blockchain.blockchainEntity20.read")
  async listBlockchainEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-20" })
  @Get("blockchain-entity-20/:id")
  @Permissions("blockchain.blockchainEntity20.read")
  async getBlockchainEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-20" })
  @Post("blockchain-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity20.create")
  async createBlockchainEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-20" })
  @Put("blockchain-entity-20/:id")
  @Permissions("blockchain.blockchainEntity20.update")
  async updateBlockchainEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-20" })
  @Delete("blockchain-entity-20/:id")
  @Permissions("blockchain.blockchainEntity20.delete")
  async deleteBlockchainEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-21" })
  @Get("blockchain-entity-21")
  @Permissions("blockchain.blockchainEntity21.read")
  async listBlockchainEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-21" })
  @Get("blockchain-entity-21/:id")
  @Permissions("blockchain.blockchainEntity21.read")
  async getBlockchainEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-21" })
  @Post("blockchain-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity21.create")
  async createBlockchainEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-21" })
  @Put("blockchain-entity-21/:id")
  @Permissions("blockchain.blockchainEntity21.update")
  async updateBlockchainEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-21" })
  @Delete("blockchain-entity-21/:id")
  @Permissions("blockchain.blockchainEntity21.delete")
  async deleteBlockchainEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-22" })
  @Get("blockchain-entity-22")
  @Permissions("blockchain.blockchainEntity22.read")
  async listBlockchainEntity22(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity22(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-22" })
  @Get("blockchain-entity-22/:id")
  @Permissions("blockchain.blockchainEntity22.read")
  async getBlockchainEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-22" })
  @Post("blockchain-entity-22")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity22.create")
  async createBlockchainEntity22(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity22(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-22" })
  @Put("blockchain-entity-22/:id")
  @Permissions("blockchain.blockchainEntity22.update")
  async updateBlockchainEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity22(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-22" })
  @Delete("blockchain-entity-22/:id")
  @Permissions("blockchain.blockchainEntity22.delete")
  async deleteBlockchainEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-23" })
  @Get("blockchain-entity-23")
  @Permissions("blockchain.blockchainEntity23.read")
  async listBlockchainEntity23(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity23(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-23" })
  @Get("blockchain-entity-23/:id")
  @Permissions("blockchain.blockchainEntity23.read")
  async getBlockchainEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-23" })
  @Post("blockchain-entity-23")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity23.create")
  async createBlockchainEntity23(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity23(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-23" })
  @Put("blockchain-entity-23/:id")
  @Permissions("blockchain.blockchainEntity23.update")
  async updateBlockchainEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity23(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-23" })
  @Delete("blockchain-entity-23/:id")
  @Permissions("blockchain.blockchainEntity23.delete")
  async deleteBlockchainEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-24" })
  @Get("blockchain-entity-24")
  @Permissions("blockchain.blockchainEntity24.read")
  async listBlockchainEntity24(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity24(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-24" })
  @Get("blockchain-entity-24/:id")
  @Permissions("blockchain.blockchainEntity24.read")
  async getBlockchainEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-24" })
  @Post("blockchain-entity-24")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity24.create")
  async createBlockchainEntity24(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity24(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-24" })
  @Put("blockchain-entity-24/:id")
  @Permissions("blockchain.blockchainEntity24.update")
  async updateBlockchainEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity24(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-24" })
  @Delete("blockchain-entity-24/:id")
  @Permissions("blockchain.blockchainEntity24.delete")
  async deleteBlockchainEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-25" })
  @Get("blockchain-entity-25")
  @Permissions("blockchain.blockchainEntity25.read")
  async listBlockchainEntity25(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity25(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-25" })
  @Get("blockchain-entity-25/:id")
  @Permissions("blockchain.blockchainEntity25.read")
  async getBlockchainEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-25" })
  @Post("blockchain-entity-25")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity25.create")
  async createBlockchainEntity25(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity25(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-25" })
  @Put("blockchain-entity-25/:id")
  @Permissions("blockchain.blockchainEntity25.update")
  async updateBlockchainEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity25(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-25" })
  @Delete("blockchain-entity-25/:id")
  @Permissions("blockchain.blockchainEntity25.delete")
  async deleteBlockchainEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-26" })
  @Get("blockchain-entity-26")
  @Permissions("blockchain.blockchainEntity26.read")
  async listBlockchainEntity26(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity26(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-26" })
  @Get("blockchain-entity-26/:id")
  @Permissions("blockchain.blockchainEntity26.read")
  async getBlockchainEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-26" })
  @Post("blockchain-entity-26")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity26.create")
  async createBlockchainEntity26(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity26(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-26" })
  @Put("blockchain-entity-26/:id")
  @Permissions("blockchain.blockchainEntity26.update")
  async updateBlockchainEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity26(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-26" })
  @Delete("blockchain-entity-26/:id")
  @Permissions("blockchain.blockchainEntity26.delete")
  async deleteBlockchainEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-27" })
  @Get("blockchain-entity-27")
  @Permissions("blockchain.blockchainEntity27.read")
  async listBlockchainEntity27(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity27(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-27" })
  @Get("blockchain-entity-27/:id")
  @Permissions("blockchain.blockchainEntity27.read")
  async getBlockchainEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-27" })
  @Post("blockchain-entity-27")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity27.create")
  async createBlockchainEntity27(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity27(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-27" })
  @Put("blockchain-entity-27/:id")
  @Permissions("blockchain.blockchainEntity27.update")
  async updateBlockchainEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity27(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-27" })
  @Delete("blockchain-entity-27/:id")
  @Permissions("blockchain.blockchainEntity27.delete")
  async deleteBlockchainEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-28" })
  @Get("blockchain-entity-28")
  @Permissions("blockchain.blockchainEntity28.read")
  async listBlockchainEntity28(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity28(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-28" })
  @Get("blockchain-entity-28/:id")
  @Permissions("blockchain.blockchainEntity28.read")
  async getBlockchainEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-28" })
  @Post("blockchain-entity-28")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity28.create")
  async createBlockchainEntity28(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity28(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-28" })
  @Put("blockchain-entity-28/:id")
  @Permissions("blockchain.blockchainEntity28.update")
  async updateBlockchainEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity28(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-28" })
  @Delete("blockchain-entity-28/:id")
  @Permissions("blockchain.blockchainEntity28.delete")
  async deleteBlockchainEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-29" })
  @Get("blockchain-entity-29")
  @Permissions("blockchain.blockchainEntity29.read")
  async listBlockchainEntity29(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity29(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-29" })
  @Get("blockchain-entity-29/:id")
  @Permissions("blockchain.blockchainEntity29.read")
  async getBlockchainEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-29" })
  @Post("blockchain-entity-29")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity29.create")
  async createBlockchainEntity29(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity29(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-29" })
  @Put("blockchain-entity-29/:id")
  @Permissions("blockchain.blockchainEntity29.update")
  async updateBlockchainEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity29(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-29" })
  @Delete("blockchain-entity-29/:id")
  @Permissions("blockchain.blockchainEntity29.delete")
  async deleteBlockchainEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-30" })
  @Get("blockchain-entity-30")
  @Permissions("blockchain.blockchainEntity30.read")
  async listBlockchainEntity30(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity30(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-30" })
  @Get("blockchain-entity-30/:id")
  @Permissions("blockchain.blockchainEntity30.read")
  async getBlockchainEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-30" })
  @Post("blockchain-entity-30")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity30.create")
  async createBlockchainEntity30(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity30(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-30" })
  @Put("blockchain-entity-30/:id")
  @Permissions("blockchain.blockchainEntity30.update")
  async updateBlockchainEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity30(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-30" })
  @Delete("blockchain-entity-30/:id")
  @Permissions("blockchain.blockchainEntity30.delete")
  async deleteBlockchainEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-31" })
  @Get("blockchain-entity-31")
  @Permissions("blockchain.blockchainEntity31.read")
  async listBlockchainEntity31(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity31(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-31" })
  @Get("blockchain-entity-31/:id")
  @Permissions("blockchain.blockchainEntity31.read")
  async getBlockchainEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-31" })
  @Post("blockchain-entity-31")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity31.create")
  async createBlockchainEntity31(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity31(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-31" })
  @Put("blockchain-entity-31/:id")
  @Permissions("blockchain.blockchainEntity31.update")
  async updateBlockchainEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity31(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-31" })
  @Delete("blockchain-entity-31/:id")
  @Permissions("blockchain.blockchainEntity31.delete")
  async deleteBlockchainEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-32" })
  @Get("blockchain-entity-32")
  @Permissions("blockchain.blockchainEntity32.read")
  async listBlockchainEntity32(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity32(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-32" })
  @Get("blockchain-entity-32/:id")
  @Permissions("blockchain.blockchainEntity32.read")
  async getBlockchainEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-32" })
  @Post("blockchain-entity-32")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity32.create")
  async createBlockchainEntity32(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity32(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-32" })
  @Put("blockchain-entity-32/:id")
  @Permissions("blockchain.blockchainEntity32.update")
  async updateBlockchainEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity32(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-32" })
  @Delete("blockchain-entity-32/:id")
  @Permissions("blockchain.blockchainEntity32.delete")
  async deleteBlockchainEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-33" })
  @Get("blockchain-entity-33")
  @Permissions("blockchain.blockchainEntity33.read")
  async listBlockchainEntity33(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity33(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-33" })
  @Get("blockchain-entity-33/:id")
  @Permissions("blockchain.blockchainEntity33.read")
  async getBlockchainEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-33" })
  @Post("blockchain-entity-33")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity33.create")
  async createBlockchainEntity33(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity33(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-33" })
  @Put("blockchain-entity-33/:id")
  @Permissions("blockchain.blockchainEntity33.update")
  async updateBlockchainEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity33(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-33" })
  @Delete("blockchain-entity-33/:id")
  @Permissions("blockchain.blockchainEntity33.delete")
  async deleteBlockchainEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-34" })
  @Get("blockchain-entity-34")
  @Permissions("blockchain.blockchainEntity34.read")
  async listBlockchainEntity34(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity34(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-34" })
  @Get("blockchain-entity-34/:id")
  @Permissions("blockchain.blockchainEntity34.read")
  async getBlockchainEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-34" })
  @Post("blockchain-entity-34")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity34.create")
  async createBlockchainEntity34(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity34(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-34" })
  @Put("blockchain-entity-34/:id")
  @Permissions("blockchain.blockchainEntity34.update")
  async updateBlockchainEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity34(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-34" })
  @Delete("blockchain-entity-34/:id")
  @Permissions("blockchain.blockchainEntity34.delete")
  async deleteBlockchainEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-35" })
  @Get("blockchain-entity-35")
  @Permissions("blockchain.blockchainEntity35.read")
  async listBlockchainEntity35(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity35(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-35" })
  @Get("blockchain-entity-35/:id")
  @Permissions("blockchain.blockchainEntity35.read")
  async getBlockchainEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-35" })
  @Post("blockchain-entity-35")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity35.create")
  async createBlockchainEntity35(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity35(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-35" })
  @Put("blockchain-entity-35/:id")
  @Permissions("blockchain.blockchainEntity35.update")
  async updateBlockchainEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity35(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-35" })
  @Delete("blockchain-entity-35/:id")
  @Permissions("blockchain.blockchainEntity35.delete")
  async deleteBlockchainEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-36" })
  @Get("blockchain-entity-36")
  @Permissions("blockchain.blockchainEntity36.read")
  async listBlockchainEntity36(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity36(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-36" })
  @Get("blockchain-entity-36/:id")
  @Permissions("blockchain.blockchainEntity36.read")
  async getBlockchainEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-36" })
  @Post("blockchain-entity-36")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity36.create")
  async createBlockchainEntity36(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity36(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-36" })
  @Put("blockchain-entity-36/:id")
  @Permissions("blockchain.blockchainEntity36.update")
  async updateBlockchainEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity36(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-36" })
  @Delete("blockchain-entity-36/:id")
  @Permissions("blockchain.blockchainEntity36.delete")
  async deleteBlockchainEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-37" })
  @Get("blockchain-entity-37")
  @Permissions("blockchain.blockchainEntity37.read")
  async listBlockchainEntity37(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity37(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-37" })
  @Get("blockchain-entity-37/:id")
  @Permissions("blockchain.blockchainEntity37.read")
  async getBlockchainEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-37" })
  @Post("blockchain-entity-37")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity37.create")
  async createBlockchainEntity37(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity37(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-37" })
  @Put("blockchain-entity-37/:id")
  @Permissions("blockchain.blockchainEntity37.update")
  async updateBlockchainEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity37(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-37" })
  @Delete("blockchain-entity-37/:id")
  @Permissions("blockchain.blockchainEntity37.delete")
  async deleteBlockchainEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-38" })
  @Get("blockchain-entity-38")
  @Permissions("blockchain.blockchainEntity38.read")
  async listBlockchainEntity38(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity38(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-38" })
  @Get("blockchain-entity-38/:id")
  @Permissions("blockchain.blockchainEntity38.read")
  async getBlockchainEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-38" })
  @Post("blockchain-entity-38")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity38.create")
  async createBlockchainEntity38(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity38(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-38" })
  @Put("blockchain-entity-38/:id")
  @Permissions("blockchain.blockchainEntity38.update")
  async updateBlockchainEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity38(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-38" })
  @Delete("blockchain-entity-38/:id")
  @Permissions("blockchain.blockchainEntity38.delete")
  async deleteBlockchainEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-39" })
  @Get("blockchain-entity-39")
  @Permissions("blockchain.blockchainEntity39.read")
  async listBlockchainEntity39(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity39(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-39" })
  @Get("blockchain-entity-39/:id")
  @Permissions("blockchain.blockchainEntity39.read")
  async getBlockchainEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-39" })
  @Post("blockchain-entity-39")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity39.create")
  async createBlockchainEntity39(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity39(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-39" })
  @Put("blockchain-entity-39/:id")
  @Permissions("blockchain.blockchainEntity39.update")
  async updateBlockchainEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity39(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-39" })
  @Delete("blockchain-entity-39/:id")
  @Permissions("blockchain.blockchainEntity39.delete")
  async deleteBlockchainEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-40" })
  @Get("blockchain-entity-40")
  @Permissions("blockchain.blockchainEntity40.read")
  async listBlockchainEntity40(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity40(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-40" })
  @Get("blockchain-entity-40/:id")
  @Permissions("blockchain.blockchainEntity40.read")
  async getBlockchainEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity40(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-40" })
  @Post("blockchain-entity-40")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity40.create")
  async createBlockchainEntity40(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity40(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-40" })
  @Put("blockchain-entity-40/:id")
  @Permissions("blockchain.blockchainEntity40.update")
  async updateBlockchainEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity40(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-40" })
  @Delete("blockchain-entity-40/:id")
  @Permissions("blockchain.blockchainEntity40.delete")
  async deleteBlockchainEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity40(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List blockchain-entity-41" })
  @Get("blockchain-entity-41")
  @Permissions("blockchain.blockchainEntity41.read")
  async listBlockchainEntity41(@Req() req: AuthenticatedRequest) {
    return this.svc.listBlockchainEntity41(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get blockchain-entity-41" })
  @Get("blockchain-entity-41/:id")
  @Permissions("blockchain.blockchainEntity41.read")
  async getBlockchainEntity41(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBlockchainEntity41(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create blockchain-entity-41" })
  @Post("blockchain-entity-41")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.blockchainEntity41.create")
  async createBlockchainEntity41(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createBlockchainEntity41(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update blockchain-entity-41" })
  @Put("blockchain-entity-41/:id")
  @Permissions("blockchain.blockchainEntity41.update")
  async updateBlockchainEntity41(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateBlockchainEntity41(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete blockchain-entity-41" })
  @Delete("blockchain-entity-41/:id")
  @Permissions("blockchain.blockchainEntity41.delete")
  async deleteBlockchainEntity41(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteBlockchainEntity41(req.user.tenantId, id);
  }
}
