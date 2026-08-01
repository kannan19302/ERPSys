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
import { DriveGeneratedService } from "./drive-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("drive")
@ApiBearerAuth()
@Controller("drive")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DriveGeneratedController {
  constructor(private readonly svc: DriveGeneratedService) {}

  @ApiOperation({ summary: "List drive-entity-1" })
  @Get("drive-entity-1")
  @Permissions("drive.driveEntity1.read")
  async listDriveEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-1" })
  @Get("drive-entity-1/:id")
  @Permissions("drive.driveEntity1.read")
  async getDriveEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-1" })
  @Post("drive-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity1.create")
  async createDriveEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-1" })
  @Put("drive-entity-1/:id")
  @Permissions("drive.driveEntity1.update")
  async updateDriveEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-1" })
  @Delete("drive-entity-1/:id")
  @Permissions("drive.driveEntity1.delete")
  async deleteDriveEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-2" })
  @Get("drive-entity-2")
  @Permissions("drive.driveEntity2.read")
  async listDriveEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-2" })
  @Get("drive-entity-2/:id")
  @Permissions("drive.driveEntity2.read")
  async getDriveEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-2" })
  @Post("drive-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity2.create")
  async createDriveEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-2" })
  @Put("drive-entity-2/:id")
  @Permissions("drive.driveEntity2.update")
  async updateDriveEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-2" })
  @Delete("drive-entity-2/:id")
  @Permissions("drive.driveEntity2.delete")
  async deleteDriveEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-3" })
  @Get("drive-entity-3")
  @Permissions("drive.driveEntity3.read")
  async listDriveEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-3" })
  @Get("drive-entity-3/:id")
  @Permissions("drive.driveEntity3.read")
  async getDriveEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-3" })
  @Post("drive-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity3.create")
  async createDriveEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-3" })
  @Put("drive-entity-3/:id")
  @Permissions("drive.driveEntity3.update")
  async updateDriveEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-3" })
  @Delete("drive-entity-3/:id")
  @Permissions("drive.driveEntity3.delete")
  async deleteDriveEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-4" })
  @Get("drive-entity-4")
  @Permissions("drive.driveEntity4.read")
  async listDriveEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-4" })
  @Get("drive-entity-4/:id")
  @Permissions("drive.driveEntity4.read")
  async getDriveEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-4" })
  @Post("drive-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity4.create")
  async createDriveEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-4" })
  @Put("drive-entity-4/:id")
  @Permissions("drive.driveEntity4.update")
  async updateDriveEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-4" })
  @Delete("drive-entity-4/:id")
  @Permissions("drive.driveEntity4.delete")
  async deleteDriveEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-5" })
  @Get("drive-entity-5")
  @Permissions("drive.driveEntity5.read")
  async listDriveEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-5" })
  @Get("drive-entity-5/:id")
  @Permissions("drive.driveEntity5.read")
  async getDriveEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-5" })
  @Post("drive-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity5.create")
  async createDriveEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-5" })
  @Put("drive-entity-5/:id")
  @Permissions("drive.driveEntity5.update")
  async updateDriveEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-5" })
  @Delete("drive-entity-5/:id")
  @Permissions("drive.driveEntity5.delete")
  async deleteDriveEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-6" })
  @Get("drive-entity-6")
  @Permissions("drive.driveEntity6.read")
  async listDriveEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-6" })
  @Get("drive-entity-6/:id")
  @Permissions("drive.driveEntity6.read")
  async getDriveEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-6" })
  @Post("drive-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity6.create")
  async createDriveEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-6" })
  @Put("drive-entity-6/:id")
  @Permissions("drive.driveEntity6.update")
  async updateDriveEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-6" })
  @Delete("drive-entity-6/:id")
  @Permissions("drive.driveEntity6.delete")
  async deleteDriveEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-7" })
  @Get("drive-entity-7")
  @Permissions("drive.driveEntity7.read")
  async listDriveEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-7" })
  @Get("drive-entity-7/:id")
  @Permissions("drive.driveEntity7.read")
  async getDriveEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-7" })
  @Post("drive-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity7.create")
  async createDriveEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-7" })
  @Put("drive-entity-7/:id")
  @Permissions("drive.driveEntity7.update")
  async updateDriveEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-7" })
  @Delete("drive-entity-7/:id")
  @Permissions("drive.driveEntity7.delete")
  async deleteDriveEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-8" })
  @Get("drive-entity-8")
  @Permissions("drive.driveEntity8.read")
  async listDriveEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-8" })
  @Get("drive-entity-8/:id")
  @Permissions("drive.driveEntity8.read")
  async getDriveEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-8" })
  @Post("drive-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity8.create")
  async createDriveEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-8" })
  @Put("drive-entity-8/:id")
  @Permissions("drive.driveEntity8.update")
  async updateDriveEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-8" })
  @Delete("drive-entity-8/:id")
  @Permissions("drive.driveEntity8.delete")
  async deleteDriveEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-9" })
  @Get("drive-entity-9")
  @Permissions("drive.driveEntity9.read")
  async listDriveEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-9" })
  @Get("drive-entity-9/:id")
  @Permissions("drive.driveEntity9.read")
  async getDriveEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-9" })
  @Post("drive-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity9.create")
  async createDriveEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-9" })
  @Put("drive-entity-9/:id")
  @Permissions("drive.driveEntity9.update")
  async updateDriveEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-9" })
  @Delete("drive-entity-9/:id")
  @Permissions("drive.driveEntity9.delete")
  async deleteDriveEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-10" })
  @Get("drive-entity-10")
  @Permissions("drive.driveEntity10.read")
  async listDriveEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-10" })
  @Get("drive-entity-10/:id")
  @Permissions("drive.driveEntity10.read")
  async getDriveEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-10" })
  @Post("drive-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity10.create")
  async createDriveEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-10" })
  @Put("drive-entity-10/:id")
  @Permissions("drive.driveEntity10.update")
  async updateDriveEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-10" })
  @Delete("drive-entity-10/:id")
  @Permissions("drive.driveEntity10.delete")
  async deleteDriveEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-11" })
  @Get("drive-entity-11")
  @Permissions("drive.driveEntity11.read")
  async listDriveEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-11" })
  @Get("drive-entity-11/:id")
  @Permissions("drive.driveEntity11.read")
  async getDriveEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-11" })
  @Post("drive-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity11.create")
  async createDriveEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-11" })
  @Put("drive-entity-11/:id")
  @Permissions("drive.driveEntity11.update")
  async updateDriveEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-11" })
  @Delete("drive-entity-11/:id")
  @Permissions("drive.driveEntity11.delete")
  async deleteDriveEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-12" })
  @Get("drive-entity-12")
  @Permissions("drive.driveEntity12.read")
  async listDriveEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-12" })
  @Get("drive-entity-12/:id")
  @Permissions("drive.driveEntity12.read")
  async getDriveEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-12" })
  @Post("drive-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity12.create")
  async createDriveEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-12" })
  @Put("drive-entity-12/:id")
  @Permissions("drive.driveEntity12.update")
  async updateDriveEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-12" })
  @Delete("drive-entity-12/:id")
  @Permissions("drive.driveEntity12.delete")
  async deleteDriveEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-13" })
  @Get("drive-entity-13")
  @Permissions("drive.driveEntity13.read")
  async listDriveEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-13" })
  @Get("drive-entity-13/:id")
  @Permissions("drive.driveEntity13.read")
  async getDriveEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-13" })
  @Post("drive-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity13.create")
  async createDriveEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-13" })
  @Put("drive-entity-13/:id")
  @Permissions("drive.driveEntity13.update")
  async updateDriveEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-13" })
  @Delete("drive-entity-13/:id")
  @Permissions("drive.driveEntity13.delete")
  async deleteDriveEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-14" })
  @Get("drive-entity-14")
  @Permissions("drive.driveEntity14.read")
  async listDriveEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-14" })
  @Get("drive-entity-14/:id")
  @Permissions("drive.driveEntity14.read")
  async getDriveEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-14" })
  @Post("drive-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity14.create")
  async createDriveEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-14" })
  @Put("drive-entity-14/:id")
  @Permissions("drive.driveEntity14.update")
  async updateDriveEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-14" })
  @Delete("drive-entity-14/:id")
  @Permissions("drive.driveEntity14.delete")
  async deleteDriveEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-15" })
  @Get("drive-entity-15")
  @Permissions("drive.driveEntity15.read")
  async listDriveEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-15" })
  @Get("drive-entity-15/:id")
  @Permissions("drive.driveEntity15.read")
  async getDriveEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-15" })
  @Post("drive-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity15.create")
  async createDriveEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-15" })
  @Put("drive-entity-15/:id")
  @Permissions("drive.driveEntity15.update")
  async updateDriveEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-15" })
  @Delete("drive-entity-15/:id")
  @Permissions("drive.driveEntity15.delete")
  async deleteDriveEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-16" })
  @Get("drive-entity-16")
  @Permissions("drive.driveEntity16.read")
  async listDriveEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-16" })
  @Get("drive-entity-16/:id")
  @Permissions("drive.driveEntity16.read")
  async getDriveEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-16" })
  @Post("drive-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity16.create")
  async createDriveEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-16" })
  @Put("drive-entity-16/:id")
  @Permissions("drive.driveEntity16.update")
  async updateDriveEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-16" })
  @Delete("drive-entity-16/:id")
  @Permissions("drive.driveEntity16.delete")
  async deleteDriveEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-17" })
  @Get("drive-entity-17")
  @Permissions("drive.driveEntity17.read")
  async listDriveEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-17" })
  @Get("drive-entity-17/:id")
  @Permissions("drive.driveEntity17.read")
  async getDriveEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-17" })
  @Post("drive-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity17.create")
  async createDriveEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-17" })
  @Put("drive-entity-17/:id")
  @Permissions("drive.driveEntity17.update")
  async updateDriveEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-17" })
  @Delete("drive-entity-17/:id")
  @Permissions("drive.driveEntity17.delete")
  async deleteDriveEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-18" })
  @Get("drive-entity-18")
  @Permissions("drive.driveEntity18.read")
  async listDriveEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-18" })
  @Get("drive-entity-18/:id")
  @Permissions("drive.driveEntity18.read")
  async getDriveEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-18" })
  @Post("drive-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity18.create")
  async createDriveEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-18" })
  @Put("drive-entity-18/:id")
  @Permissions("drive.driveEntity18.update")
  async updateDriveEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-18" })
  @Delete("drive-entity-18/:id")
  @Permissions("drive.driveEntity18.delete")
  async deleteDriveEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-19" })
  @Get("drive-entity-19")
  @Permissions("drive.driveEntity19.read")
  async listDriveEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-19" })
  @Get("drive-entity-19/:id")
  @Permissions("drive.driveEntity19.read")
  async getDriveEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-19" })
  @Post("drive-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity19.create")
  async createDriveEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-19" })
  @Put("drive-entity-19/:id")
  @Permissions("drive.driveEntity19.update")
  async updateDriveEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-19" })
  @Delete("drive-entity-19/:id")
  @Permissions("drive.driveEntity19.delete")
  async deleteDriveEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-20" })
  @Get("drive-entity-20")
  @Permissions("drive.driveEntity20.read")
  async listDriveEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-20" })
  @Get("drive-entity-20/:id")
  @Permissions("drive.driveEntity20.read")
  async getDriveEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-20" })
  @Post("drive-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity20.create")
  async createDriveEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-20" })
  @Put("drive-entity-20/:id")
  @Permissions("drive.driveEntity20.update")
  async updateDriveEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-20" })
  @Delete("drive-entity-20/:id")
  @Permissions("drive.driveEntity20.delete")
  async deleteDriveEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-21" })
  @Get("drive-entity-21")
  @Permissions("drive.driveEntity21.read")
  async listDriveEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-21" })
  @Get("drive-entity-21/:id")
  @Permissions("drive.driveEntity21.read")
  async getDriveEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-21" })
  @Post("drive-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity21.create")
  async createDriveEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-21" })
  @Put("drive-entity-21/:id")
  @Permissions("drive.driveEntity21.update")
  async updateDriveEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-21" })
  @Delete("drive-entity-21/:id")
  @Permissions("drive.driveEntity21.delete")
  async deleteDriveEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-22" })
  @Get("drive-entity-22")
  @Permissions("drive.driveEntity22.read")
  async listDriveEntity22(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity22(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-22" })
  @Get("drive-entity-22/:id")
  @Permissions("drive.driveEntity22.read")
  async getDriveEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-22" })
  @Post("drive-entity-22")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity22.create")
  async createDriveEntity22(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity22(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-22" })
  @Put("drive-entity-22/:id")
  @Permissions("drive.driveEntity22.update")
  async updateDriveEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity22(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-22" })
  @Delete("drive-entity-22/:id")
  @Permissions("drive.driveEntity22.delete")
  async deleteDriveEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-23" })
  @Get("drive-entity-23")
  @Permissions("drive.driveEntity23.read")
  async listDriveEntity23(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity23(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-23" })
  @Get("drive-entity-23/:id")
  @Permissions("drive.driveEntity23.read")
  async getDriveEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-23" })
  @Post("drive-entity-23")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity23.create")
  async createDriveEntity23(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity23(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-23" })
  @Put("drive-entity-23/:id")
  @Permissions("drive.driveEntity23.update")
  async updateDriveEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity23(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-23" })
  @Delete("drive-entity-23/:id")
  @Permissions("drive.driveEntity23.delete")
  async deleteDriveEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-24" })
  @Get("drive-entity-24")
  @Permissions("drive.driveEntity24.read")
  async listDriveEntity24(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity24(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-24" })
  @Get("drive-entity-24/:id")
  @Permissions("drive.driveEntity24.read")
  async getDriveEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-24" })
  @Post("drive-entity-24")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity24.create")
  async createDriveEntity24(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity24(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-24" })
  @Put("drive-entity-24/:id")
  @Permissions("drive.driveEntity24.update")
  async updateDriveEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity24(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-24" })
  @Delete("drive-entity-24/:id")
  @Permissions("drive.driveEntity24.delete")
  async deleteDriveEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-25" })
  @Get("drive-entity-25")
  @Permissions("drive.driveEntity25.read")
  async listDriveEntity25(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity25(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-25" })
  @Get("drive-entity-25/:id")
  @Permissions("drive.driveEntity25.read")
  async getDriveEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-25" })
  @Post("drive-entity-25")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity25.create")
  async createDriveEntity25(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity25(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-25" })
  @Put("drive-entity-25/:id")
  @Permissions("drive.driveEntity25.update")
  async updateDriveEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity25(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-25" })
  @Delete("drive-entity-25/:id")
  @Permissions("drive.driveEntity25.delete")
  async deleteDriveEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-26" })
  @Get("drive-entity-26")
  @Permissions("drive.driveEntity26.read")
  async listDriveEntity26(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity26(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-26" })
  @Get("drive-entity-26/:id")
  @Permissions("drive.driveEntity26.read")
  async getDriveEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-26" })
  @Post("drive-entity-26")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity26.create")
  async createDriveEntity26(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity26(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-26" })
  @Put("drive-entity-26/:id")
  @Permissions("drive.driveEntity26.update")
  async updateDriveEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity26(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-26" })
  @Delete("drive-entity-26/:id")
  @Permissions("drive.driveEntity26.delete")
  async deleteDriveEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-27" })
  @Get("drive-entity-27")
  @Permissions("drive.driveEntity27.read")
  async listDriveEntity27(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity27(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-27" })
  @Get("drive-entity-27/:id")
  @Permissions("drive.driveEntity27.read")
  async getDriveEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-27" })
  @Post("drive-entity-27")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity27.create")
  async createDriveEntity27(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity27(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-27" })
  @Put("drive-entity-27/:id")
  @Permissions("drive.driveEntity27.update")
  async updateDriveEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity27(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-27" })
  @Delete("drive-entity-27/:id")
  @Permissions("drive.driveEntity27.delete")
  async deleteDriveEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-28" })
  @Get("drive-entity-28")
  @Permissions("drive.driveEntity28.read")
  async listDriveEntity28(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity28(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-28" })
  @Get("drive-entity-28/:id")
  @Permissions("drive.driveEntity28.read")
  async getDriveEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-28" })
  @Post("drive-entity-28")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity28.create")
  async createDriveEntity28(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity28(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-28" })
  @Put("drive-entity-28/:id")
  @Permissions("drive.driveEntity28.update")
  async updateDriveEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity28(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-28" })
  @Delete("drive-entity-28/:id")
  @Permissions("drive.driveEntity28.delete")
  async deleteDriveEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-29" })
  @Get("drive-entity-29")
  @Permissions("drive.driveEntity29.read")
  async listDriveEntity29(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity29(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-29" })
  @Get("drive-entity-29/:id")
  @Permissions("drive.driveEntity29.read")
  async getDriveEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-29" })
  @Post("drive-entity-29")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity29.create")
  async createDriveEntity29(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity29(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-29" })
  @Put("drive-entity-29/:id")
  @Permissions("drive.driveEntity29.update")
  async updateDriveEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity29(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-29" })
  @Delete("drive-entity-29/:id")
  @Permissions("drive.driveEntity29.delete")
  async deleteDriveEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-30" })
  @Get("drive-entity-30")
  @Permissions("drive.driveEntity30.read")
  async listDriveEntity30(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity30(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-30" })
  @Get("drive-entity-30/:id")
  @Permissions("drive.driveEntity30.read")
  async getDriveEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-30" })
  @Post("drive-entity-30")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity30.create")
  async createDriveEntity30(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity30(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-30" })
  @Put("drive-entity-30/:id")
  @Permissions("drive.driveEntity30.update")
  async updateDriveEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity30(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-30" })
  @Delete("drive-entity-30/:id")
  @Permissions("drive.driveEntity30.delete")
  async deleteDriveEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-31" })
  @Get("drive-entity-31")
  @Permissions("drive.driveEntity31.read")
  async listDriveEntity31(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity31(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-31" })
  @Get("drive-entity-31/:id")
  @Permissions("drive.driveEntity31.read")
  async getDriveEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-31" })
  @Post("drive-entity-31")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity31.create")
  async createDriveEntity31(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity31(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-31" })
  @Put("drive-entity-31/:id")
  @Permissions("drive.driveEntity31.update")
  async updateDriveEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity31(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-31" })
  @Delete("drive-entity-31/:id")
  @Permissions("drive.driveEntity31.delete")
  async deleteDriveEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-32" })
  @Get("drive-entity-32")
  @Permissions("drive.driveEntity32.read")
  async listDriveEntity32(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity32(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-32" })
  @Get("drive-entity-32/:id")
  @Permissions("drive.driveEntity32.read")
  async getDriveEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-32" })
  @Post("drive-entity-32")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity32.create")
  async createDriveEntity32(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity32(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-32" })
  @Put("drive-entity-32/:id")
  @Permissions("drive.driveEntity32.update")
  async updateDriveEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity32(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-32" })
  @Delete("drive-entity-32/:id")
  @Permissions("drive.driveEntity32.delete")
  async deleteDriveEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-33" })
  @Get("drive-entity-33")
  @Permissions("drive.driveEntity33.read")
  async listDriveEntity33(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity33(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-33" })
  @Get("drive-entity-33/:id")
  @Permissions("drive.driveEntity33.read")
  async getDriveEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-33" })
  @Post("drive-entity-33")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity33.create")
  async createDriveEntity33(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity33(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-33" })
  @Put("drive-entity-33/:id")
  @Permissions("drive.driveEntity33.update")
  async updateDriveEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity33(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-33" })
  @Delete("drive-entity-33/:id")
  @Permissions("drive.driveEntity33.delete")
  async deleteDriveEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-34" })
  @Get("drive-entity-34")
  @Permissions("drive.driveEntity34.read")
  async listDriveEntity34(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity34(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-34" })
  @Get("drive-entity-34/:id")
  @Permissions("drive.driveEntity34.read")
  async getDriveEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-34" })
  @Post("drive-entity-34")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity34.create")
  async createDriveEntity34(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity34(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-34" })
  @Put("drive-entity-34/:id")
  @Permissions("drive.driveEntity34.update")
  async updateDriveEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity34(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-34" })
  @Delete("drive-entity-34/:id")
  @Permissions("drive.driveEntity34.delete")
  async deleteDriveEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-35" })
  @Get("drive-entity-35")
  @Permissions("drive.driveEntity35.read")
  async listDriveEntity35(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity35(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-35" })
  @Get("drive-entity-35/:id")
  @Permissions("drive.driveEntity35.read")
  async getDriveEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-35" })
  @Post("drive-entity-35")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity35.create")
  async createDriveEntity35(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity35(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-35" })
  @Put("drive-entity-35/:id")
  @Permissions("drive.driveEntity35.update")
  async updateDriveEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity35(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-35" })
  @Delete("drive-entity-35/:id")
  @Permissions("drive.driveEntity35.delete")
  async deleteDriveEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-36" })
  @Get("drive-entity-36")
  @Permissions("drive.driveEntity36.read")
  async listDriveEntity36(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity36(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-36" })
  @Get("drive-entity-36/:id")
  @Permissions("drive.driveEntity36.read")
  async getDriveEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-36" })
  @Post("drive-entity-36")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity36.create")
  async createDriveEntity36(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity36(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-36" })
  @Put("drive-entity-36/:id")
  @Permissions("drive.driveEntity36.update")
  async updateDriveEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity36(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-36" })
  @Delete("drive-entity-36/:id")
  @Permissions("drive.driveEntity36.delete")
  async deleteDriveEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-37" })
  @Get("drive-entity-37")
  @Permissions("drive.driveEntity37.read")
  async listDriveEntity37(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity37(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-37" })
  @Get("drive-entity-37/:id")
  @Permissions("drive.driveEntity37.read")
  async getDriveEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-37" })
  @Post("drive-entity-37")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity37.create")
  async createDriveEntity37(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity37(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-37" })
  @Put("drive-entity-37/:id")
  @Permissions("drive.driveEntity37.update")
  async updateDriveEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity37(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-37" })
  @Delete("drive-entity-37/:id")
  @Permissions("drive.driveEntity37.delete")
  async deleteDriveEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-38" })
  @Get("drive-entity-38")
  @Permissions("drive.driveEntity38.read")
  async listDriveEntity38(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity38(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-38" })
  @Get("drive-entity-38/:id")
  @Permissions("drive.driveEntity38.read")
  async getDriveEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-38" })
  @Post("drive-entity-38")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity38.create")
  async createDriveEntity38(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity38(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-38" })
  @Put("drive-entity-38/:id")
  @Permissions("drive.driveEntity38.update")
  async updateDriveEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity38(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-38" })
  @Delete("drive-entity-38/:id")
  @Permissions("drive.driveEntity38.delete")
  async deleteDriveEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-39" })
  @Get("drive-entity-39")
  @Permissions("drive.driveEntity39.read")
  async listDriveEntity39(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity39(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-39" })
  @Get("drive-entity-39/:id")
  @Permissions("drive.driveEntity39.read")
  async getDriveEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-39" })
  @Post("drive-entity-39")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity39.create")
  async createDriveEntity39(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity39(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-39" })
  @Put("drive-entity-39/:id")
  @Permissions("drive.driveEntity39.update")
  async updateDriveEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity39(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-39" })
  @Delete("drive-entity-39/:id")
  @Permissions("drive.driveEntity39.delete")
  async deleteDriveEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List drive-entity-40" })
  @Get("drive-entity-40")
  @Permissions("drive.driveEntity40.read")
  async listDriveEntity40(@Req() req: AuthenticatedRequest) {
    return this.svc.listDriveEntity40(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get drive-entity-40" })
  @Get("drive-entity-40/:id")
  @Permissions("drive.driveEntity40.read")
  async getDriveEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDriveEntity40(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create drive-entity-40" })
  @Post("drive-entity-40")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("drive.driveEntity40.create")
  async createDriveEntity40(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createDriveEntity40(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update drive-entity-40" })
  @Put("drive-entity-40/:id")
  @Permissions("drive.driveEntity40.update")
  async updateDriveEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateDriveEntity40(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete drive-entity-40" })
  @Delete("drive-entity-40/:id")
  @Permissions("drive.driveEntity40.delete")
  async deleteDriveEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDriveEntity40(req.user.tenantId, id);
  }
}
