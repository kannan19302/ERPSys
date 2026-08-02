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
import { SearchGeneratedService } from "./search-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("search")
@ApiBearerAuth()
@Controller("search")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SearchGeneratedController {
  constructor(private readonly svc: SearchGeneratedService) {}

  @ApiOperation({ summary: "List search-entity-1" })
  @Get("search-entity-1")
  @Permissions("search.searchEntity1.read")
  async listSearchEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-1" })
  @Get("search-entity-1/:id")
  @Permissions("search.searchEntity1.read")
  async getSearchEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-1" })
  @Post("search-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity1.create")
  async createSearchEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-1" })
  @Put("search-entity-1/:id")
  @Permissions("search.searchEntity1.update")
  async updateSearchEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-1" })
  @Delete("search-entity-1/:id")
  @Permissions("search.searchEntity1.delete")
  async deleteSearchEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-2" })
  @Get("search-entity-2")
  @Permissions("search.searchEntity2.read")
  async listSearchEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-2" })
  @Get("search-entity-2/:id")
  @Permissions("search.searchEntity2.read")
  async getSearchEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-2" })
  @Post("search-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity2.create")
  async createSearchEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-2" })
  @Put("search-entity-2/:id")
  @Permissions("search.searchEntity2.update")
  async updateSearchEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-2" })
  @Delete("search-entity-2/:id")
  @Permissions("search.searchEntity2.delete")
  async deleteSearchEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-3" })
  @Get("search-entity-3")
  @Permissions("search.searchEntity3.read")
  async listSearchEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-3" })
  @Get("search-entity-3/:id")
  @Permissions("search.searchEntity3.read")
  async getSearchEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-3" })
  @Post("search-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity3.create")
  async createSearchEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-3" })
  @Put("search-entity-3/:id")
  @Permissions("search.searchEntity3.update")
  async updateSearchEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-3" })
  @Delete("search-entity-3/:id")
  @Permissions("search.searchEntity3.delete")
  async deleteSearchEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-4" })
  @Get("search-entity-4")
  @Permissions("search.searchEntity4.read")
  async listSearchEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-4" })
  @Get("search-entity-4/:id")
  @Permissions("search.searchEntity4.read")
  async getSearchEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-4" })
  @Post("search-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity4.create")
  async createSearchEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-4" })
  @Put("search-entity-4/:id")
  @Permissions("search.searchEntity4.update")
  async updateSearchEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-4" })
  @Delete("search-entity-4/:id")
  @Permissions("search.searchEntity4.delete")
  async deleteSearchEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-5" })
  @Get("search-entity-5")
  @Permissions("search.searchEntity5.read")
  async listSearchEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-5" })
  @Get("search-entity-5/:id")
  @Permissions("search.searchEntity5.read")
  async getSearchEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-5" })
  @Post("search-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity5.create")
  async createSearchEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-5" })
  @Put("search-entity-5/:id")
  @Permissions("search.searchEntity5.update")
  async updateSearchEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-5" })
  @Delete("search-entity-5/:id")
  @Permissions("search.searchEntity5.delete")
  async deleteSearchEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-6" })
  @Get("search-entity-6")
  @Permissions("search.searchEntity6.read")
  async listSearchEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-6" })
  @Get("search-entity-6/:id")
  @Permissions("search.searchEntity6.read")
  async getSearchEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-6" })
  @Post("search-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity6.create")
  async createSearchEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-6" })
  @Put("search-entity-6/:id")
  @Permissions("search.searchEntity6.update")
  async updateSearchEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-6" })
  @Delete("search-entity-6/:id")
  @Permissions("search.searchEntity6.delete")
  async deleteSearchEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-7" })
  @Get("search-entity-7")
  @Permissions("search.searchEntity7.read")
  async listSearchEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-7" })
  @Get("search-entity-7/:id")
  @Permissions("search.searchEntity7.read")
  async getSearchEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-7" })
  @Post("search-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity7.create")
  async createSearchEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-7" })
  @Put("search-entity-7/:id")
  @Permissions("search.searchEntity7.update")
  async updateSearchEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-7" })
  @Delete("search-entity-7/:id")
  @Permissions("search.searchEntity7.delete")
  async deleteSearchEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-8" })
  @Get("search-entity-8")
  @Permissions("search.searchEntity8.read")
  async listSearchEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-8" })
  @Get("search-entity-8/:id")
  @Permissions("search.searchEntity8.read")
  async getSearchEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-8" })
  @Post("search-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity8.create")
  async createSearchEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-8" })
  @Put("search-entity-8/:id")
  @Permissions("search.searchEntity8.update")
  async updateSearchEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-8" })
  @Delete("search-entity-8/:id")
  @Permissions("search.searchEntity8.delete")
  async deleteSearchEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-9" })
  @Get("search-entity-9")
  @Permissions("search.searchEntity9.read")
  async listSearchEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-9" })
  @Get("search-entity-9/:id")
  @Permissions("search.searchEntity9.read")
  async getSearchEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-9" })
  @Post("search-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity9.create")
  async createSearchEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-9" })
  @Put("search-entity-9/:id")
  @Permissions("search.searchEntity9.update")
  async updateSearchEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-9" })
  @Delete("search-entity-9/:id")
  @Permissions("search.searchEntity9.delete")
  async deleteSearchEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-10" })
  @Get("search-entity-10")
  @Permissions("search.searchEntity10.read")
  async listSearchEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-10" })
  @Get("search-entity-10/:id")
  @Permissions("search.searchEntity10.read")
  async getSearchEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-10" })
  @Post("search-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity10.create")
  async createSearchEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-10" })
  @Put("search-entity-10/:id")
  @Permissions("search.searchEntity10.update")
  async updateSearchEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-10" })
  @Delete("search-entity-10/:id")
  @Permissions("search.searchEntity10.delete")
  async deleteSearchEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-11" })
  @Get("search-entity-11")
  @Permissions("search.searchEntity11.read")
  async listSearchEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-11" })
  @Get("search-entity-11/:id")
  @Permissions("search.searchEntity11.read")
  async getSearchEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-11" })
  @Post("search-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity11.create")
  async createSearchEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-11" })
  @Put("search-entity-11/:id")
  @Permissions("search.searchEntity11.update")
  async updateSearchEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-11" })
  @Delete("search-entity-11/:id")
  @Permissions("search.searchEntity11.delete")
  async deleteSearchEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-12" })
  @Get("search-entity-12")
  @Permissions("search.searchEntity12.read")
  async listSearchEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-12" })
  @Get("search-entity-12/:id")
  @Permissions("search.searchEntity12.read")
  async getSearchEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-12" })
  @Post("search-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity12.create")
  async createSearchEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-12" })
  @Put("search-entity-12/:id")
  @Permissions("search.searchEntity12.update")
  async updateSearchEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-12" })
  @Delete("search-entity-12/:id")
  @Permissions("search.searchEntity12.delete")
  async deleteSearchEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-13" })
  @Get("search-entity-13")
  @Permissions("search.searchEntity13.read")
  async listSearchEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-13" })
  @Get("search-entity-13/:id")
  @Permissions("search.searchEntity13.read")
  async getSearchEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-13" })
  @Post("search-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity13.create")
  async createSearchEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-13" })
  @Put("search-entity-13/:id")
  @Permissions("search.searchEntity13.update")
  async updateSearchEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-13" })
  @Delete("search-entity-13/:id")
  @Permissions("search.searchEntity13.delete")
  async deleteSearchEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-14" })
  @Get("search-entity-14")
  @Permissions("search.searchEntity14.read")
  async listSearchEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-14" })
  @Get("search-entity-14/:id")
  @Permissions("search.searchEntity14.read")
  async getSearchEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-14" })
  @Post("search-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity14.create")
  async createSearchEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-14" })
  @Put("search-entity-14/:id")
  @Permissions("search.searchEntity14.update")
  async updateSearchEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-14" })
  @Delete("search-entity-14/:id")
  @Permissions("search.searchEntity14.delete")
  async deleteSearchEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-15" })
  @Get("search-entity-15")
  @Permissions("search.searchEntity15.read")
  async listSearchEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-15" })
  @Get("search-entity-15/:id")
  @Permissions("search.searchEntity15.read")
  async getSearchEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-15" })
  @Post("search-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity15.create")
  async createSearchEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-15" })
  @Put("search-entity-15/:id")
  @Permissions("search.searchEntity15.update")
  async updateSearchEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-15" })
  @Delete("search-entity-15/:id")
  @Permissions("search.searchEntity15.delete")
  async deleteSearchEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-16" })
  @Get("search-entity-16")
  @Permissions("search.searchEntity16.read")
  async listSearchEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-16" })
  @Get("search-entity-16/:id")
  @Permissions("search.searchEntity16.read")
  async getSearchEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-16" })
  @Post("search-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity16.create")
  async createSearchEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-16" })
  @Put("search-entity-16/:id")
  @Permissions("search.searchEntity16.update")
  async updateSearchEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-16" })
  @Delete("search-entity-16/:id")
  @Permissions("search.searchEntity16.delete")
  async deleteSearchEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-17" })
  @Get("search-entity-17")
  @Permissions("search.searchEntity17.read")
  async listSearchEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-17" })
  @Get("search-entity-17/:id")
  @Permissions("search.searchEntity17.read")
  async getSearchEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-17" })
  @Post("search-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity17.create")
  async createSearchEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-17" })
  @Put("search-entity-17/:id")
  @Permissions("search.searchEntity17.update")
  async updateSearchEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-17" })
  @Delete("search-entity-17/:id")
  @Permissions("search.searchEntity17.delete")
  async deleteSearchEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-18" })
  @Get("search-entity-18")
  @Permissions("search.searchEntity18.read")
  async listSearchEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-18" })
  @Get("search-entity-18/:id")
  @Permissions("search.searchEntity18.read")
  async getSearchEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-18" })
  @Post("search-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity18.create")
  async createSearchEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-18" })
  @Put("search-entity-18/:id")
  @Permissions("search.searchEntity18.update")
  async updateSearchEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-18" })
  @Delete("search-entity-18/:id")
  @Permissions("search.searchEntity18.delete")
  async deleteSearchEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-19" })
  @Get("search-entity-19")
  @Permissions("search.searchEntity19.read")
  async listSearchEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-19" })
  @Get("search-entity-19/:id")
  @Permissions("search.searchEntity19.read")
  async getSearchEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-19" })
  @Post("search-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity19.create")
  async createSearchEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-19" })
  @Put("search-entity-19/:id")
  @Permissions("search.searchEntity19.update")
  async updateSearchEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-19" })
  @Delete("search-entity-19/:id")
  @Permissions("search.searchEntity19.delete")
  async deleteSearchEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-20" })
  @Get("search-entity-20")
  @Permissions("search.searchEntity20.read")
  async listSearchEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-20" })
  @Get("search-entity-20/:id")
  @Permissions("search.searchEntity20.read")
  async getSearchEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-20" })
  @Post("search-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity20.create")
  async createSearchEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-20" })
  @Put("search-entity-20/:id")
  @Permissions("search.searchEntity20.update")
  async updateSearchEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-20" })
  @Delete("search-entity-20/:id")
  @Permissions("search.searchEntity20.delete")
  async deleteSearchEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-21" })
  @Get("search-entity-21")
  @Permissions("search.searchEntity21.read")
  async listSearchEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-21" })
  @Get("search-entity-21/:id")
  @Permissions("search.searchEntity21.read")
  async getSearchEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-21" })
  @Post("search-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity21.create")
  async createSearchEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-21" })
  @Put("search-entity-21/:id")
  @Permissions("search.searchEntity21.update")
  async updateSearchEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-21" })
  @Delete("search-entity-21/:id")
  @Permissions("search.searchEntity21.delete")
  async deleteSearchEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-22" })
  @Get("search-entity-22")
  @Permissions("search.searchEntity22.read")
  async listSearchEntity22(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity22(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-22" })
  @Get("search-entity-22/:id")
  @Permissions("search.searchEntity22.read")
  async getSearchEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-22" })
  @Post("search-entity-22")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity22.create")
  async createSearchEntity22(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity22(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-22" })
  @Put("search-entity-22/:id")
  @Permissions("search.searchEntity22.update")
  async updateSearchEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity22(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-22" })
  @Delete("search-entity-22/:id")
  @Permissions("search.searchEntity22.delete")
  async deleteSearchEntity22(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity22(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-23" })
  @Get("search-entity-23")
  @Permissions("search.searchEntity23.read")
  async listSearchEntity23(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity23(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-23" })
  @Get("search-entity-23/:id")
  @Permissions("search.searchEntity23.read")
  async getSearchEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-23" })
  @Post("search-entity-23")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity23.create")
  async createSearchEntity23(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity23(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-23" })
  @Put("search-entity-23/:id")
  @Permissions("search.searchEntity23.update")
  async updateSearchEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity23(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-23" })
  @Delete("search-entity-23/:id")
  @Permissions("search.searchEntity23.delete")
  async deleteSearchEntity23(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity23(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-24" })
  @Get("search-entity-24")
  @Permissions("search.searchEntity24.read")
  async listSearchEntity24(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity24(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-24" })
  @Get("search-entity-24/:id")
  @Permissions("search.searchEntity24.read")
  async getSearchEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-24" })
  @Post("search-entity-24")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity24.create")
  async createSearchEntity24(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity24(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-24" })
  @Put("search-entity-24/:id")
  @Permissions("search.searchEntity24.update")
  async updateSearchEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity24(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-24" })
  @Delete("search-entity-24/:id")
  @Permissions("search.searchEntity24.delete")
  async deleteSearchEntity24(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity24(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-25" })
  @Get("search-entity-25")
  @Permissions("search.searchEntity25.read")
  async listSearchEntity25(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity25(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-25" })
  @Get("search-entity-25/:id")
  @Permissions("search.searchEntity25.read")
  async getSearchEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-25" })
  @Post("search-entity-25")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity25.create")
  async createSearchEntity25(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity25(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-25" })
  @Put("search-entity-25/:id")
  @Permissions("search.searchEntity25.update")
  async updateSearchEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity25(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-25" })
  @Delete("search-entity-25/:id")
  @Permissions("search.searchEntity25.delete")
  async deleteSearchEntity25(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity25(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-26" })
  @Get("search-entity-26")
  @Permissions("search.searchEntity26.read")
  async listSearchEntity26(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity26(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-26" })
  @Get("search-entity-26/:id")
  @Permissions("search.searchEntity26.read")
  async getSearchEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-26" })
  @Post("search-entity-26")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity26.create")
  async createSearchEntity26(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity26(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-26" })
  @Put("search-entity-26/:id")
  @Permissions("search.searchEntity26.update")
  async updateSearchEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity26(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-26" })
  @Delete("search-entity-26/:id")
  @Permissions("search.searchEntity26.delete")
  async deleteSearchEntity26(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity26(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-27" })
  @Get("search-entity-27")
  @Permissions("search.searchEntity27.read")
  async listSearchEntity27(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity27(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-27" })
  @Get("search-entity-27/:id")
  @Permissions("search.searchEntity27.read")
  async getSearchEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-27" })
  @Post("search-entity-27")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity27.create")
  async createSearchEntity27(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity27(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-27" })
  @Put("search-entity-27/:id")
  @Permissions("search.searchEntity27.update")
  async updateSearchEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity27(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-27" })
  @Delete("search-entity-27/:id")
  @Permissions("search.searchEntity27.delete")
  async deleteSearchEntity27(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity27(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-28" })
  @Get("search-entity-28")
  @Permissions("search.searchEntity28.read")
  async listSearchEntity28(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity28(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-28" })
  @Get("search-entity-28/:id")
  @Permissions("search.searchEntity28.read")
  async getSearchEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-28" })
  @Post("search-entity-28")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity28.create")
  async createSearchEntity28(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity28(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-28" })
  @Put("search-entity-28/:id")
  @Permissions("search.searchEntity28.update")
  async updateSearchEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity28(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-28" })
  @Delete("search-entity-28/:id")
  @Permissions("search.searchEntity28.delete")
  async deleteSearchEntity28(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity28(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-29" })
  @Get("search-entity-29")
  @Permissions("search.searchEntity29.read")
  async listSearchEntity29(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity29(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-29" })
  @Get("search-entity-29/:id")
  @Permissions("search.searchEntity29.read")
  async getSearchEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-29" })
  @Post("search-entity-29")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity29.create")
  async createSearchEntity29(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity29(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-29" })
  @Put("search-entity-29/:id")
  @Permissions("search.searchEntity29.update")
  async updateSearchEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity29(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-29" })
  @Delete("search-entity-29/:id")
  @Permissions("search.searchEntity29.delete")
  async deleteSearchEntity29(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity29(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-30" })
  @Get("search-entity-30")
  @Permissions("search.searchEntity30.read")
  async listSearchEntity30(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity30(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-30" })
  @Get("search-entity-30/:id")
  @Permissions("search.searchEntity30.read")
  async getSearchEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-30" })
  @Post("search-entity-30")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity30.create")
  async createSearchEntity30(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity30(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-30" })
  @Put("search-entity-30/:id")
  @Permissions("search.searchEntity30.update")
  async updateSearchEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity30(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-30" })
  @Delete("search-entity-30/:id")
  @Permissions("search.searchEntity30.delete")
  async deleteSearchEntity30(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity30(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-31" })
  @Get("search-entity-31")
  @Permissions("search.searchEntity31.read")
  async listSearchEntity31(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity31(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-31" })
  @Get("search-entity-31/:id")
  @Permissions("search.searchEntity31.read")
  async getSearchEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-31" })
  @Post("search-entity-31")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity31.create")
  async createSearchEntity31(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity31(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-31" })
  @Put("search-entity-31/:id")
  @Permissions("search.searchEntity31.update")
  async updateSearchEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity31(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-31" })
  @Delete("search-entity-31/:id")
  @Permissions("search.searchEntity31.delete")
  async deleteSearchEntity31(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity31(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-32" })
  @Get("search-entity-32")
  @Permissions("search.searchEntity32.read")
  async listSearchEntity32(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity32(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-32" })
  @Get("search-entity-32/:id")
  @Permissions("search.searchEntity32.read")
  async getSearchEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-32" })
  @Post("search-entity-32")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity32.create")
  async createSearchEntity32(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity32(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-32" })
  @Put("search-entity-32/:id")
  @Permissions("search.searchEntity32.update")
  async updateSearchEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity32(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-32" })
  @Delete("search-entity-32/:id")
  @Permissions("search.searchEntity32.delete")
  async deleteSearchEntity32(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity32(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-33" })
  @Get("search-entity-33")
  @Permissions("search.searchEntity33.read")
  async listSearchEntity33(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity33(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-33" })
  @Get("search-entity-33/:id")
  @Permissions("search.searchEntity33.read")
  async getSearchEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-33" })
  @Post("search-entity-33")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity33.create")
  async createSearchEntity33(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity33(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-33" })
  @Put("search-entity-33/:id")
  @Permissions("search.searchEntity33.update")
  async updateSearchEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity33(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-33" })
  @Delete("search-entity-33/:id")
  @Permissions("search.searchEntity33.delete")
  async deleteSearchEntity33(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity33(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-34" })
  @Get("search-entity-34")
  @Permissions("search.searchEntity34.read")
  async listSearchEntity34(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity34(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-34" })
  @Get("search-entity-34/:id")
  @Permissions("search.searchEntity34.read")
  async getSearchEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-34" })
  @Post("search-entity-34")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity34.create")
  async createSearchEntity34(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity34(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-34" })
  @Put("search-entity-34/:id")
  @Permissions("search.searchEntity34.update")
  async updateSearchEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity34(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-34" })
  @Delete("search-entity-34/:id")
  @Permissions("search.searchEntity34.delete")
  async deleteSearchEntity34(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity34(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-35" })
  @Get("search-entity-35")
  @Permissions("search.searchEntity35.read")
  async listSearchEntity35(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity35(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-35" })
  @Get("search-entity-35/:id")
  @Permissions("search.searchEntity35.read")
  async getSearchEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-35" })
  @Post("search-entity-35")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity35.create")
  async createSearchEntity35(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity35(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-35" })
  @Put("search-entity-35/:id")
  @Permissions("search.searchEntity35.update")
  async updateSearchEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity35(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-35" })
  @Delete("search-entity-35/:id")
  @Permissions("search.searchEntity35.delete")
  async deleteSearchEntity35(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity35(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-36" })
  @Get("search-entity-36")
  @Permissions("search.searchEntity36.read")
  async listSearchEntity36(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity36(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-36" })
  @Get("search-entity-36/:id")
  @Permissions("search.searchEntity36.read")
  async getSearchEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-36" })
  @Post("search-entity-36")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity36.create")
  async createSearchEntity36(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity36(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-36" })
  @Put("search-entity-36/:id")
  @Permissions("search.searchEntity36.update")
  async updateSearchEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity36(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-36" })
  @Delete("search-entity-36/:id")
  @Permissions("search.searchEntity36.delete")
  async deleteSearchEntity36(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity36(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-37" })
  @Get("search-entity-37")
  @Permissions("search.searchEntity37.read")
  async listSearchEntity37(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity37(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-37" })
  @Get("search-entity-37/:id")
  @Permissions("search.searchEntity37.read")
  async getSearchEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-37" })
  @Post("search-entity-37")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity37.create")
  async createSearchEntity37(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity37(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-37" })
  @Put("search-entity-37/:id")
  @Permissions("search.searchEntity37.update")
  async updateSearchEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity37(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-37" })
  @Delete("search-entity-37/:id")
  @Permissions("search.searchEntity37.delete")
  async deleteSearchEntity37(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity37(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-38" })
  @Get("search-entity-38")
  @Permissions("search.searchEntity38.read")
  async listSearchEntity38(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity38(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-38" })
  @Get("search-entity-38/:id")
  @Permissions("search.searchEntity38.read")
  async getSearchEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-38" })
  @Post("search-entity-38")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity38.create")
  async createSearchEntity38(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity38(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-38" })
  @Put("search-entity-38/:id")
  @Permissions("search.searchEntity38.update")
  async updateSearchEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity38(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-38" })
  @Delete("search-entity-38/:id")
  @Permissions("search.searchEntity38.delete")
  async deleteSearchEntity38(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity38(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-39" })
  @Get("search-entity-39")
  @Permissions("search.searchEntity39.read")
  async listSearchEntity39(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity39(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-39" })
  @Get("search-entity-39/:id")
  @Permissions("search.searchEntity39.read")
  async getSearchEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-39" })
  @Post("search-entity-39")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity39.create")
  async createSearchEntity39(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity39(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-39" })
  @Put("search-entity-39/:id")
  @Permissions("search.searchEntity39.update")
  async updateSearchEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity39(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-39" })
  @Delete("search-entity-39/:id")
  @Permissions("search.searchEntity39.delete")
  async deleteSearchEntity39(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity39(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List search-entity-40" })
  @Get("search-entity-40")
  @Permissions("search.searchEntity40.read")
  async listSearchEntity40(@Req() req: AuthenticatedRequest) {
    return this.svc.listSearchEntity40(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get search-entity-40" })
  @Get("search-entity-40/:id")
  @Permissions("search.searchEntity40.read")
  async getSearchEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSearchEntity40(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create search-entity-40" })
  @Post("search-entity-40")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("search.searchEntity40.create")
  async createSearchEntity40(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.createSearchEntity40(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update search-entity-40" })
  @Put("search-entity-40/:id")
  @Permissions("search.searchEntity40.update")
  async updateSearchEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: { name: string },
  ) {
    return this.svc.updateSearchEntity40(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete search-entity-40" })
  @Delete("search-entity-40/:id")
  @Permissions("search.searchEntity40.delete")
  async deleteSearchEntity40(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSearchEntity40(req.user.tenantId, id);
  }
}
