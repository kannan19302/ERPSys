import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CustomsDocumentService } from "../services/customs-document.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createSchema = z.object({
  documentNumber: z.string().min(1),
  customsBroker: z.string().optional(),
  direction: z.enum(["IMPORT", "EXPORT"]),
  declarationType: z.string().optional(),
  shipmentType: z.string().optional(),
  shipmentId: z.string().optional(),
  status: z.string().optional(),
  filingDate: z.string().optional(),
  clearanceDate: z.string().optional(),
  totalDuties: z.number().optional(),
  totalTaxes: z.number().optional(),
  currency: z.string().optional(),
  portOfEntry: z.string().optional(),
  portOfExit: z.string().optional(),
  notes: z.string().optional(),
  documents: z
    .array(
      z.object({
        documentType: z.string(),
        documentRef: z.string().optional(),
        fileName: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

const updateSchema = createSchema.partial();

@ApiTags("supply-chain / customs")
@ApiBearerAuth()
@Controller("supply-chain/customs")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CustomsDocumentController {
  constructor(private readonly svc: CustomsDocumentService) {}

  @Get()
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "List customs documents" })
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("direction") direction?: string,
    @Query("shipmentType") shipmentType?: string,
    @Query("shipmentId") shipmentId?: string,
  ) {
    return this.svc.list(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      direction,
      shipmentType,
      shipmentId,
    });
  }

  @Get(":id")
  @Permissions("supply-chain.customs.read")
  @ApiOperation({ summary: "Get customs document by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.customs.create")
  @ApiOperation({ summary: "Create customs document" })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @ZodBody(createSchema) body: z.infer<typeof createSchema>,
  ) {
    return this.svc.create(req.user.tenantId, body as any);
  }

  @Patch(":id")
  @Permissions("supply-chain.customs.update")
  @ApiOperation({ summary: "Update customs document" })
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateSchema) body: z.infer<typeof updateSchema>,
  ) {
    return this.svc.update(req.user.tenantId, id, body as any);
  }

  @Delete(":id")
  @Permissions("supply-chain.customs.delete")
  @ApiOperation({ summary: "Delete customs document" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/submit")
  @Permissions("supply-chain.customs.update")
  @ApiOperation({ summary: "Submit customs document for filing" })
  submit(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.submit(req.user.tenantId, id);
  }

  @Post(":id/clear")
  @Permissions("supply-chain.customs.update")
  @ApiOperation({ summary: "Mark customs document as cleared" })
  markCleared(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        clearedAt: z.string(),
        dutyAmount: z.number(),
        taxAmount: z.number(),
        totalFees: z.number(),
      }),
    )
    body: {
      clearedAt: string;
      dutyAmount: number;
      taxAmount: number;
      totalFees: number;
    },
  ) {
    return this.svc.markCleared(req.user.tenantId, id, body);
  }
}
