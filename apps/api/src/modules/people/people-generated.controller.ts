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
import { PeopleGeneratedService } from "./people-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("people")
@ApiBearerAuth()
@Controller("people")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PeopleGeneratedController {
  constructor(private readonly svc: PeopleGeneratedService) {}

  @ApiOperation({ summary: "List people-entity-1" })
  @Get("people-entity-1")
  @Permissions("people.peopleEntity1.read")
  async listPeopleEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-1" })
  @Get("people-entity-1/:id")
  @Permissions("people.peopleEntity1.read")
  async getPeopleEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-1" })
  @Post("people-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity1.create")
  async createPeopleEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-1" })
  @Put("people-entity-1/:id")
  @Permissions("people.peopleEntity1.update")
  async updatePeopleEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-1" })
  @Delete("people-entity-1/:id")
  @Permissions("people.peopleEntity1.delete")
  async deletePeopleEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-2" })
  @Get("people-entity-2")
  @Permissions("people.peopleEntity2.read")
  async listPeopleEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-2" })
  @Get("people-entity-2/:id")
  @Permissions("people.peopleEntity2.read")
  async getPeopleEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-2" })
  @Post("people-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity2.create")
  async createPeopleEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-2" })
  @Put("people-entity-2/:id")
  @Permissions("people.peopleEntity2.update")
  async updatePeopleEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-2" })
  @Delete("people-entity-2/:id")
  @Permissions("people.peopleEntity2.delete")
  async deletePeopleEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-3" })
  @Get("people-entity-3")
  @Permissions("people.peopleEntity3.read")
  async listPeopleEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-3" })
  @Get("people-entity-3/:id")
  @Permissions("people.peopleEntity3.read")
  async getPeopleEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-3" })
  @Post("people-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity3.create")
  async createPeopleEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-3" })
  @Put("people-entity-3/:id")
  @Permissions("people.peopleEntity3.update")
  async updatePeopleEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-3" })
  @Delete("people-entity-3/:id")
  @Permissions("people.peopleEntity3.delete")
  async deletePeopleEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-4" })
  @Get("people-entity-4")
  @Permissions("people.peopleEntity4.read")
  async listPeopleEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-4" })
  @Get("people-entity-4/:id")
  @Permissions("people.peopleEntity4.read")
  async getPeopleEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-4" })
  @Post("people-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity4.create")
  async createPeopleEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-4" })
  @Put("people-entity-4/:id")
  @Permissions("people.peopleEntity4.update")
  async updatePeopleEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-4" })
  @Delete("people-entity-4/:id")
  @Permissions("people.peopleEntity4.delete")
  async deletePeopleEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-5" })
  @Get("people-entity-5")
  @Permissions("people.peopleEntity5.read")
  async listPeopleEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-5" })
  @Get("people-entity-5/:id")
  @Permissions("people.peopleEntity5.read")
  async getPeopleEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-5" })
  @Post("people-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity5.create")
  async createPeopleEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-5" })
  @Put("people-entity-5/:id")
  @Permissions("people.peopleEntity5.update")
  async updatePeopleEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-5" })
  @Delete("people-entity-5/:id")
  @Permissions("people.peopleEntity5.delete")
  async deletePeopleEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-6" })
  @Get("people-entity-6")
  @Permissions("people.peopleEntity6.read")
  async listPeopleEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-6" })
  @Get("people-entity-6/:id")
  @Permissions("people.peopleEntity6.read")
  async getPeopleEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-6" })
  @Post("people-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity6.create")
  async createPeopleEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-6" })
  @Put("people-entity-6/:id")
  @Permissions("people.peopleEntity6.update")
  async updatePeopleEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-6" })
  @Delete("people-entity-6/:id")
  @Permissions("people.peopleEntity6.delete")
  async deletePeopleEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-7" })
  @Get("people-entity-7")
  @Permissions("people.peopleEntity7.read")
  async listPeopleEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-7" })
  @Get("people-entity-7/:id")
  @Permissions("people.peopleEntity7.read")
  async getPeopleEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-7" })
  @Post("people-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity7.create")
  async createPeopleEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-7" })
  @Put("people-entity-7/:id")
  @Permissions("people.peopleEntity7.update")
  async updatePeopleEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-7" })
  @Delete("people-entity-7/:id")
  @Permissions("people.peopleEntity7.delete")
  async deletePeopleEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-8" })
  @Get("people-entity-8")
  @Permissions("people.peopleEntity8.read")
  async listPeopleEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-8" })
  @Get("people-entity-8/:id")
  @Permissions("people.peopleEntity8.read")
  async getPeopleEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-8" })
  @Post("people-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity8.create")
  async createPeopleEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-8" })
  @Put("people-entity-8/:id")
  @Permissions("people.peopleEntity8.update")
  async updatePeopleEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-8" })
  @Delete("people-entity-8/:id")
  @Permissions("people.peopleEntity8.delete")
  async deletePeopleEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-9" })
  @Get("people-entity-9")
  @Permissions("people.peopleEntity9.read")
  async listPeopleEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-9" })
  @Get("people-entity-9/:id")
  @Permissions("people.peopleEntity9.read")
  async getPeopleEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-9" })
  @Post("people-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity9.create")
  async createPeopleEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-9" })
  @Put("people-entity-9/:id")
  @Permissions("people.peopleEntity9.update")
  async updatePeopleEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-9" })
  @Delete("people-entity-9/:id")
  @Permissions("people.peopleEntity9.delete")
  async deletePeopleEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-10" })
  @Get("people-entity-10")
  @Permissions("people.peopleEntity10.read")
  async listPeopleEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-10" })
  @Get("people-entity-10/:id")
  @Permissions("people.peopleEntity10.read")
  async getPeopleEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-10" })
  @Post("people-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity10.create")
  async createPeopleEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-10" })
  @Put("people-entity-10/:id")
  @Permissions("people.peopleEntity10.update")
  async updatePeopleEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-10" })
  @Delete("people-entity-10/:id")
  @Permissions("people.peopleEntity10.delete")
  async deletePeopleEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-11" })
  @Get("people-entity-11")
  @Permissions("people.peopleEntity11.read")
  async listPeopleEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-11" })
  @Get("people-entity-11/:id")
  @Permissions("people.peopleEntity11.read")
  async getPeopleEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-11" })
  @Post("people-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity11.create")
  async createPeopleEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-11" })
  @Put("people-entity-11/:id")
  @Permissions("people.peopleEntity11.update")
  async updatePeopleEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-11" })
  @Delete("people-entity-11/:id")
  @Permissions("people.peopleEntity11.delete")
  async deletePeopleEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-12" })
  @Get("people-entity-12")
  @Permissions("people.peopleEntity12.read")
  async listPeopleEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-12" })
  @Get("people-entity-12/:id")
  @Permissions("people.peopleEntity12.read")
  async getPeopleEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-12" })
  @Post("people-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity12.create")
  async createPeopleEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-12" })
  @Put("people-entity-12/:id")
  @Permissions("people.peopleEntity12.update")
  async updatePeopleEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-12" })
  @Delete("people-entity-12/:id")
  @Permissions("people.peopleEntity12.delete")
  async deletePeopleEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-13" })
  @Get("people-entity-13")
  @Permissions("people.peopleEntity13.read")
  async listPeopleEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-13" })
  @Get("people-entity-13/:id")
  @Permissions("people.peopleEntity13.read")
  async getPeopleEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-13" })
  @Post("people-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity13.create")
  async createPeopleEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-13" })
  @Put("people-entity-13/:id")
  @Permissions("people.peopleEntity13.update")
  async updatePeopleEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-13" })
  @Delete("people-entity-13/:id")
  @Permissions("people.peopleEntity13.delete")
  async deletePeopleEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-14" })
  @Get("people-entity-14")
  @Permissions("people.peopleEntity14.read")
  async listPeopleEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-14" })
  @Get("people-entity-14/:id")
  @Permissions("people.peopleEntity14.read")
  async getPeopleEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-14" })
  @Post("people-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity14.create")
  async createPeopleEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-14" })
  @Put("people-entity-14/:id")
  @Permissions("people.peopleEntity14.update")
  async updatePeopleEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-14" })
  @Delete("people-entity-14/:id")
  @Permissions("people.peopleEntity14.delete")
  async deletePeopleEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-15" })
  @Get("people-entity-15")
  @Permissions("people.peopleEntity15.read")
  async listPeopleEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-15" })
  @Get("people-entity-15/:id")
  @Permissions("people.peopleEntity15.read")
  async getPeopleEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-15" })
  @Post("people-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity15.create")
  async createPeopleEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-15" })
  @Put("people-entity-15/:id")
  @Permissions("people.peopleEntity15.update")
  async updatePeopleEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-15" })
  @Delete("people-entity-15/:id")
  @Permissions("people.peopleEntity15.delete")
  async deletePeopleEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-16" })
  @Get("people-entity-16")
  @Permissions("people.peopleEntity16.read")
  async listPeopleEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-16" })
  @Get("people-entity-16/:id")
  @Permissions("people.peopleEntity16.read")
  async getPeopleEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-16" })
  @Post("people-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity16.create")
  async createPeopleEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-16" })
  @Put("people-entity-16/:id")
  @Permissions("people.peopleEntity16.update")
  async updatePeopleEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-16" })
  @Delete("people-entity-16/:id")
  @Permissions("people.peopleEntity16.delete")
  async deletePeopleEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-17" })
  @Get("people-entity-17")
  @Permissions("people.peopleEntity17.read")
  async listPeopleEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-17" })
  @Get("people-entity-17/:id")
  @Permissions("people.peopleEntity17.read")
  async getPeopleEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-17" })
  @Post("people-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity17.create")
  async createPeopleEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-17" })
  @Put("people-entity-17/:id")
  @Permissions("people.peopleEntity17.update")
  async updatePeopleEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-17" })
  @Delete("people-entity-17/:id")
  @Permissions("people.peopleEntity17.delete")
  async deletePeopleEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-18" })
  @Get("people-entity-18")
  @Permissions("people.peopleEntity18.read")
  async listPeopleEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-18" })
  @Get("people-entity-18/:id")
  @Permissions("people.peopleEntity18.read")
  async getPeopleEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-18" })
  @Post("people-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity18.create")
  async createPeopleEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-18" })
  @Put("people-entity-18/:id")
  @Permissions("people.peopleEntity18.update")
  async updatePeopleEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-18" })
  @Delete("people-entity-18/:id")
  @Permissions("people.peopleEntity18.delete")
  async deletePeopleEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-19" })
  @Get("people-entity-19")
  @Permissions("people.peopleEntity19.read")
  async listPeopleEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-19" })
  @Get("people-entity-19/:id")
  @Permissions("people.peopleEntity19.read")
  async getPeopleEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-19" })
  @Post("people-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity19.create")
  async createPeopleEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-19" })
  @Put("people-entity-19/:id")
  @Permissions("people.peopleEntity19.update")
  async updatePeopleEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-19" })
  @Delete("people-entity-19/:id")
  @Permissions("people.peopleEntity19.delete")
  async deletePeopleEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-20" })
  @Get("people-entity-20")
  @Permissions("people.peopleEntity20.read")
  async listPeopleEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-20" })
  @Get("people-entity-20/:id")
  @Permissions("people.peopleEntity20.read")
  async getPeopleEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-20" })
  @Post("people-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity20.create")
  async createPeopleEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-20" })
  @Put("people-entity-20/:id")
  @Permissions("people.peopleEntity20.update")
  async updatePeopleEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-20" })
  @Delete("people-entity-20/:id")
  @Permissions("people.peopleEntity20.delete")
  async deletePeopleEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-21" })
  @Get("people-entity-21")
  @Permissions("people.peopleEntity21.read")
  async listPeopleEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-21" })
  @Get("people-entity-21/:id")
  @Permissions("people.peopleEntity21.read")
  async getPeopleEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-21" })
  @Post("people-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity21.create")
  async createPeopleEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-21" })
  @Put("people-entity-21/:id")
  @Permissions("people.peopleEntity21.update")
  async updatePeopleEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-21" })
  @Delete("people-entity-21/:id")
  @Permissions("people.peopleEntity21.delete")
  async deletePeopleEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-22" })
  @Get("people-entity-22")
  @Permissions("people.peopleEntity22.read")
  async listPeopleEntity22(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity22(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-22" })
  @Get("people-entity-22/:id")
  @Permissions("people.peopleEntity22.read")
  async getPeopleEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-22" })
  @Post("people-entity-22")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity22.create")
  async createPeopleEntity22(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity22(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-22" })
  @Put("people-entity-22/:id")
  @Permissions("people.peopleEntity22.update")
  async updatePeopleEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity22(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-22" })
  @Delete("people-entity-22/:id")
  @Permissions("people.peopleEntity22.delete")
  async deletePeopleEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-23" })
  @Get("people-entity-23")
  @Permissions("people.peopleEntity23.read")
  async listPeopleEntity23(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity23(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-23" })
  @Get("people-entity-23/:id")
  @Permissions("people.peopleEntity23.read")
  async getPeopleEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-23" })
  @Post("people-entity-23")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity23.create")
  async createPeopleEntity23(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity23(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-23" })
  @Put("people-entity-23/:id")
  @Permissions("people.peopleEntity23.update")
  async updatePeopleEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity23(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-23" })
  @Delete("people-entity-23/:id")
  @Permissions("people.peopleEntity23.delete")
  async deletePeopleEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-24" })
  @Get("people-entity-24")
  @Permissions("people.peopleEntity24.read")
  async listPeopleEntity24(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity24(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-24" })
  @Get("people-entity-24/:id")
  @Permissions("people.peopleEntity24.read")
  async getPeopleEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-24" })
  @Post("people-entity-24")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity24.create")
  async createPeopleEntity24(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity24(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-24" })
  @Put("people-entity-24/:id")
  @Permissions("people.peopleEntity24.update")
  async updatePeopleEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity24(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-24" })
  @Delete("people-entity-24/:id")
  @Permissions("people.peopleEntity24.delete")
  async deletePeopleEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-25" })
  @Get("people-entity-25")
  @Permissions("people.peopleEntity25.read")
  async listPeopleEntity25(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity25(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-25" })
  @Get("people-entity-25/:id")
  @Permissions("people.peopleEntity25.read")
  async getPeopleEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-25" })
  @Post("people-entity-25")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity25.create")
  async createPeopleEntity25(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity25(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-25" })
  @Put("people-entity-25/:id")
  @Permissions("people.peopleEntity25.update")
  async updatePeopleEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity25(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-25" })
  @Delete("people-entity-25/:id")
  @Permissions("people.peopleEntity25.delete")
  async deletePeopleEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-26" })
  @Get("people-entity-26")
  @Permissions("people.peopleEntity26.read")
  async listPeopleEntity26(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity26(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-26" })
  @Get("people-entity-26/:id")
  @Permissions("people.peopleEntity26.read")
  async getPeopleEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-26" })
  @Post("people-entity-26")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity26.create")
  async createPeopleEntity26(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity26(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-26" })
  @Put("people-entity-26/:id")
  @Permissions("people.peopleEntity26.update")
  async updatePeopleEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity26(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-26" })
  @Delete("people-entity-26/:id")
  @Permissions("people.peopleEntity26.delete")
  async deletePeopleEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-27" })
  @Get("people-entity-27")
  @Permissions("people.peopleEntity27.read")
  async listPeopleEntity27(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity27(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-27" })
  @Get("people-entity-27/:id")
  @Permissions("people.peopleEntity27.read")
  async getPeopleEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-27" })
  @Post("people-entity-27")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity27.create")
  async createPeopleEntity27(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity27(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-27" })
  @Put("people-entity-27/:id")
  @Permissions("people.peopleEntity27.update")
  async updatePeopleEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity27(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-27" })
  @Delete("people-entity-27/:id")
  @Permissions("people.peopleEntity27.delete")
  async deletePeopleEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-28" })
  @Get("people-entity-28")
  @Permissions("people.peopleEntity28.read")
  async listPeopleEntity28(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity28(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-28" })
  @Get("people-entity-28/:id")
  @Permissions("people.peopleEntity28.read")
  async getPeopleEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-28" })
  @Post("people-entity-28")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity28.create")
  async createPeopleEntity28(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity28(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-28" })
  @Put("people-entity-28/:id")
  @Permissions("people.peopleEntity28.update")
  async updatePeopleEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity28(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-28" })
  @Delete("people-entity-28/:id")
  @Permissions("people.peopleEntity28.delete")
  async deletePeopleEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-29" })
  @Get("people-entity-29")
  @Permissions("people.peopleEntity29.read")
  async listPeopleEntity29(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity29(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-29" })
  @Get("people-entity-29/:id")
  @Permissions("people.peopleEntity29.read")
  async getPeopleEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-29" })
  @Post("people-entity-29")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity29.create")
  async createPeopleEntity29(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity29(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-29" })
  @Put("people-entity-29/:id")
  @Permissions("people.peopleEntity29.update")
  async updatePeopleEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity29(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-29" })
  @Delete("people-entity-29/:id")
  @Permissions("people.peopleEntity29.delete")
  async deletePeopleEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-30" })
  @Get("people-entity-30")
  @Permissions("people.peopleEntity30.read")
  async listPeopleEntity30(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity30(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-30" })
  @Get("people-entity-30/:id")
  @Permissions("people.peopleEntity30.read")
  async getPeopleEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-30" })
  @Post("people-entity-30")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity30.create")
  async createPeopleEntity30(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity30(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-30" })
  @Put("people-entity-30/:id")
  @Permissions("people.peopleEntity30.update")
  async updatePeopleEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity30(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-30" })
  @Delete("people-entity-30/:id")
  @Permissions("people.peopleEntity30.delete")
  async deletePeopleEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-31" })
  @Get("people-entity-31")
  @Permissions("people.peopleEntity31.read")
  async listPeopleEntity31(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity31(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-31" })
  @Get("people-entity-31/:id")
  @Permissions("people.peopleEntity31.read")
  async getPeopleEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-31" })
  @Post("people-entity-31")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity31.create")
  async createPeopleEntity31(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity31(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-31" })
  @Put("people-entity-31/:id")
  @Permissions("people.peopleEntity31.update")
  async updatePeopleEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity31(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-31" })
  @Delete("people-entity-31/:id")
  @Permissions("people.peopleEntity31.delete")
  async deletePeopleEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-32" })
  @Get("people-entity-32")
  @Permissions("people.peopleEntity32.read")
  async listPeopleEntity32(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity32(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-32" })
  @Get("people-entity-32/:id")
  @Permissions("people.peopleEntity32.read")
  async getPeopleEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-32" })
  @Post("people-entity-32")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity32.create")
  async createPeopleEntity32(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity32(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-32" })
  @Put("people-entity-32/:id")
  @Permissions("people.peopleEntity32.update")
  async updatePeopleEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity32(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-32" })
  @Delete("people-entity-32/:id")
  @Permissions("people.peopleEntity32.delete")
  async deletePeopleEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-33" })
  @Get("people-entity-33")
  @Permissions("people.peopleEntity33.read")
  async listPeopleEntity33(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity33(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-33" })
  @Get("people-entity-33/:id")
  @Permissions("people.peopleEntity33.read")
  async getPeopleEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-33" })
  @Post("people-entity-33")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity33.create")
  async createPeopleEntity33(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity33(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-33" })
  @Put("people-entity-33/:id")
  @Permissions("people.peopleEntity33.update")
  async updatePeopleEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity33(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-33" })
  @Delete("people-entity-33/:id")
  @Permissions("people.peopleEntity33.delete")
  async deletePeopleEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-34" })
  @Get("people-entity-34")
  @Permissions("people.peopleEntity34.read")
  async listPeopleEntity34(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity34(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-34" })
  @Get("people-entity-34/:id")
  @Permissions("people.peopleEntity34.read")
  async getPeopleEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-34" })
  @Post("people-entity-34")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity34.create")
  async createPeopleEntity34(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity34(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-34" })
  @Put("people-entity-34/:id")
  @Permissions("people.peopleEntity34.update")
  async updatePeopleEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity34(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-34" })
  @Delete("people-entity-34/:id")
  @Permissions("people.peopleEntity34.delete")
  async deletePeopleEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-35" })
  @Get("people-entity-35")
  @Permissions("people.peopleEntity35.read")
  async listPeopleEntity35(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity35(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-35" })
  @Get("people-entity-35/:id")
  @Permissions("people.peopleEntity35.read")
  async getPeopleEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-35" })
  @Post("people-entity-35")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity35.create")
  async createPeopleEntity35(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity35(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-35" })
  @Put("people-entity-35/:id")
  @Permissions("people.peopleEntity35.update")
  async updatePeopleEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity35(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-35" })
  @Delete("people-entity-35/:id")
  @Permissions("people.peopleEntity35.delete")
  async deletePeopleEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-36" })
  @Get("people-entity-36")
  @Permissions("people.peopleEntity36.read")
  async listPeopleEntity36(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity36(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-36" })
  @Get("people-entity-36/:id")
  @Permissions("people.peopleEntity36.read")
  async getPeopleEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-36" })
  @Post("people-entity-36")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity36.create")
  async createPeopleEntity36(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity36(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-36" })
  @Put("people-entity-36/:id")
  @Permissions("people.peopleEntity36.update")
  async updatePeopleEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity36(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-36" })
  @Delete("people-entity-36/:id")
  @Permissions("people.peopleEntity36.delete")
  async deletePeopleEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-37" })
  @Get("people-entity-37")
  @Permissions("people.peopleEntity37.read")
  async listPeopleEntity37(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity37(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-37" })
  @Get("people-entity-37/:id")
  @Permissions("people.peopleEntity37.read")
  async getPeopleEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-37" })
  @Post("people-entity-37")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity37.create")
  async createPeopleEntity37(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity37(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-37" })
  @Put("people-entity-37/:id")
  @Permissions("people.peopleEntity37.update")
  async updatePeopleEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity37(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-37" })
  @Delete("people-entity-37/:id")
  @Permissions("people.peopleEntity37.delete")
  async deletePeopleEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-38" })
  @Get("people-entity-38")
  @Permissions("people.peopleEntity38.read")
  async listPeopleEntity38(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity38(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-38" })
  @Get("people-entity-38/:id")
  @Permissions("people.peopleEntity38.read")
  async getPeopleEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-38" })
  @Post("people-entity-38")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity38.create")
  async createPeopleEntity38(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity38(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-38" })
  @Put("people-entity-38/:id")
  @Permissions("people.peopleEntity38.update")
  async updatePeopleEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity38(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-38" })
  @Delete("people-entity-38/:id")
  @Permissions("people.peopleEntity38.delete")
  async deletePeopleEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-39" })
  @Get("people-entity-39")
  @Permissions("people.peopleEntity39.read")
  async listPeopleEntity39(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity39(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-39" })
  @Get("people-entity-39/:id")
  @Permissions("people.peopleEntity39.read")
  async getPeopleEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-39" })
  @Post("people-entity-39")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity39.create")
  async createPeopleEntity39(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity39(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-39" })
  @Put("people-entity-39/:id")
  @Permissions("people.peopleEntity39.update")
  async updatePeopleEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity39(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-39" })
  @Delete("people-entity-39/:id")
  @Permissions("people.peopleEntity39.delete")
  async deletePeopleEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List people-entity-40" })
  @Get("people-entity-40")
  @Permissions("people.peopleEntity40.read")
  async listPeopleEntity40(@Req() req: AuthenticatedRequest) {
    return this.svc.listPeopleEntity40(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get people-entity-40" })
  @Get("people-entity-40/:id")
  @Permissions("people.peopleEntity40.read")
  async getPeopleEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getPeopleEntity40(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create people-entity-40" })
  @Post("people-entity-40")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("people.peopleEntity40.create")
  async createPeopleEntity40(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createPeopleEntity40(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update people-entity-40" })
  @Put("people-entity-40/:id")
  @Permissions("people.peopleEntity40.update")
  async updatePeopleEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updatePeopleEntity40(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete people-entity-40" })
  @Delete("people-entity-40/:id")
  @Permissions("people.peopleEntity40.delete")
  async deletePeopleEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePeopleEntity40(req.user.tenantId, id);
  }
}
