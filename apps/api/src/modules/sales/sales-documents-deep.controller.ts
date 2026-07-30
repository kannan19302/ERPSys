// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesDocumentsDeepService } from "./sales-documents-deep.service";

@ApiTags("SalesDocumentsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/documents-deep")
export class SalesDocumentsDeepController {
  constructor(private readonly documentsService: SalesDocumentsDeepService) {}

  @ApiOperation({ summary: "Get document templates" })
  @Permissions("sales.documents.read")
  @Get("templates")
  async getTemplates(@Req() req: any, @Query("category") category?: string) {
    return this.documentsService.getTemplates(req.user.tenantId, category);
  }

  @ApiOperation({ summary: "Create document template" })
  @Permissions("sales.documents.create")
  @Post("templates")
  async createTemplate(@Req() req: any, @Body() dto: any) {
    return this.documentsService.createTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Generate document from template" })
  @Permissions("sales.documents.create")
  @Post("generate")
  async generateDocument(@Req() req: any, @Body() dto: any) {
    return this.documentsService.generateDocument(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get generated documents" })
  @Permissions("sales.documents.read")
  @Get("generations")
  async getGenerations(
    @Req() req: any,
    @Query("customerId") customerId?: string,
  ) {
    return this.documentsService.getGenerations(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: "Update document generation status" })
  @Permissions("sales.documents.update")
  @Put("generations/:id/status")
  async updateGenerationStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.documentsService.updateGenerationStatus(
      req.user.tenantId,
      id,
      status,
    );
  }
}
