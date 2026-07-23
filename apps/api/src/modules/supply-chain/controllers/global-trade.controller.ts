import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { GlobalTradeService } from "../services/global-trade.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createImportDeclarationSchema = z.object({
  declarationNumber: z.string().min(1), entryNumber: z.string().optional(),
  portOfEntry: z.string().optional(), portOfLading: z.string().optional(),
  vessel: z.string().optional(), voyageNumber: z.string().optional(),
  containerNumber: z.string().optional(), supplierId: z.string().optional(),
  supplierName: z.string().optional(), hsCodeId: z.string().optional(),
  hsCode: z.string().optional(), countryOfOrigin: z.string().optional(),
  invoiceValue: z.number().optional(), currency: z.string().optional(),
  dutyAmount: z.number().optional(), freightCost: z.number().optional(),
  insuranceCost: z.number().optional(), brokerName: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({ productName: z.string().optional(), productSku: z.string().optional(), quantity: z.number().positive(), uom: z.string().optional(), unitValue: z.number().optional(), hsCode: z.string().optional(), countryOfOrigin: z.string().optional() })).optional(),
});

const createExportDeclarationSchema = z.object({
  declarationNumber: z.string().min(1), portOfExport: z.string().optional(),
  destinationCountry: z.string().optional(), shipmentId: z.string().optional(),
  carrierName: z.string().optional(), containerNumber: z.string().optional(),
  hsCodeId: z.string().optional(), hsCode: z.string().optional(),
  invoiceValue: z.number().optional(), currency: z.string().optional(),
  exportLicense: z.string().optional(), eccn: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({ productName: z.string().optional(), productSku: z.string().optional(), quantity: z.number().positive(), uom: z.string().optional(), unitValue: z.number().optional() })).optional(),
});

@ApiTags("supply-chain / global-trade")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class GlobalTradeController {
  constructor(private readonly tradeSvc: GlobalTradeService) {}

  @Get("hs-codes")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List HS codes with search and pagination" })
  listHsCodes(@Req() req: AuthRequest, @Query("search") search?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.tradeSvc.getHsCodes(req.user.tenantId, { search, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  }

  @Get("hs-codes/:id")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "Get HS code by id" })
  getHsCode(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tradeSvc.getHsCodeById(req.user.tenantId, id);
  }

  @Post("hs-codes")
  @Permissions("supply-chain.customs.create")
  @TrackChanges("HsCode")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new HS code" })
  createHsCode(@Req() req: AuthRequest, @ZodBody(z.object({ code: z.string(), description: z.string(), category: z.string().optional(), dutyRate: z.number().optional(), restrictions: z.any().optional() })) body: any) {
    return this.tradeSvc.createHsCode(req.user.tenantId, body);
  }

  @Patch("hs-codes/:id")
  @Permissions("supply-chain.customs.update")
  @TrackChanges("HsCode", "id")
  @ApiOperation({ summary: "Update an HS code" })
  updateHsCode(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ description: z.string().optional(), dutyRate: z.number().optional(), restrictions: z.any().optional() })) body: any) {
    return this.tradeSvc.updateHsCode(req.user.tenantId, id, body);
  }

  @Get("countries-of-origin")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List countries of origin" })
  listCountries(@Req() req: AuthRequest) {
    return this.tradeSvc.getCountriesOfOrigin(req.user.tenantId);
  }

  @Post("countries-of-origin")
  @Permissions("supply-chain.customs.create")
  @TrackChanges("CountryOfOrigin")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a country of origin" })
  createCountry(@Req() req: AuthRequest, @ZodBody(z.object({ countryCode: z.string(), countryName: z.string(), region: z.string().optional() })) body: any) {
    return this.tradeSvc.createCountryOfOrigin(req.user.tenantId, body);
  }

  @Get("import-declarations")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List import declarations" })
  listImportDeclarations(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.tradeSvc.getImportDeclarations(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status });
  }

  @Get("import-declarations/:id")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "Get import declaration by id" })
  getImportDeclaration(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tradeSvc.getImportDeclarationById(req.user.tenantId, id);
  }

  @Post("import-declarations")
  @Permissions("supply-chain.customs.create")
  @TrackChanges("ImportDeclaration")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an import declaration" })
  createImportDeclaration(@Req() req: AuthRequest, @ZodBody(createImportDeclarationSchema) body: z.infer<typeof createImportDeclarationSchema>) {
    return this.tradeSvc.createImportDeclaration(req.user.tenantId, body, req.user.userId);
  }

  @Patch("import-declarations/:id/status")
  @Permissions("supply-chain.customs.update")
  @TrackChanges("ImportDeclaration", "id")
  @ApiOperation({ summary: "Update import declaration status" })
  updateImportStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.tradeSvc.updateImportDeclarationStatus(req.user.tenantId, id, body.status);
  }

  @Get("export-declarations")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List export declarations" })
  listExportDeclarations(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.tradeSvc.getExportDeclarations(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status });
  }

  @Post("export-declarations")
  @Permissions("supply-chain.customs.create")
  @TrackChanges("ExportDeclaration")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an export declaration" })
  createExportDeclaration(@Req() req: AuthRequest, @ZodBody(createExportDeclarationSchema) body: z.infer<typeof createExportDeclarationSchema>) {
    return this.tradeSvc.createExportDeclaration(req.user.tenantId, body, req.user.userId);
  }

  @Get("compliance-screenings")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List trade compliance screenings" })
  listScreenings(@Req() req: AuthRequest, @Query("status") status?: string, @Query("screenType") screenType?: string) {
    return this.tradeSvc.getComplianceScreenings(req.user.tenantId, { status, screenType });
  }

  @Post("compliance-screenings")
  @Permissions("supply-chain.customs.create")
  @TrackChanges("TradeComplianceScreening")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a trade compliance screening" })
  createScreening(@Req() req: AuthRequest, @ZodBody(z.object({ screenType: z.string(), entityName: z.string(), entityCountry: z.string().optional(), referenceType: z.string().optional(), referenceId: z.string().optional(), notes: z.string().optional() })) body: any) {
    return this.tradeSvc.createComplianceScreening(req.user.tenantId, body, req.user.userId);
  }

  @Post("compliance-screenings/:id/resolve")
  @Permissions("supply-chain.customs.update")
  @TrackChanges("TradeComplianceScreening", "id")
  @ApiOperation({ summary: "Resolve a compliance screening" })
  resolveScreening(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ resolution: z.string() })) body: { resolution: string }) {
    return this.tradeSvc.resolveComplianceScreening(req.user.tenantId, id, body.resolution, req.user.userId);
  }
}
