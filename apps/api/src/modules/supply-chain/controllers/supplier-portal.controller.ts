// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
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
import { SupplyChainSupplierPortalService } from "../services/supply-chain-supplier-portal.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const inviteSchema = z.object({
  supplierId: z.string().min(1),
  email: z.string().email(),
  portalAccessLevel: z.string().optional(),
  message: z.string().optional(),
  expiresInDays: z.number().int().optional(),
});
const documentSchema = z.object({
  supplierId: z.string().min(1),
  documentType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  fileSize: z.number().optional(),
  sharedBy: z.string().optional(),
  expiresAt: z.string().optional(),
});
const poCollabSchema = z.object({
  purchaseOrderId: z.string().min(1),
  supplierId: z.string().min(1),
  message: z.string().min(1),
  proposedChanges: z.any().optional(),
  attachmentUrl: z.string().optional(),
  createdBy: z.string().optional(),
});
const poCollabResponseSchema = z.object({
  response: z.string().min(1),
  status: z.string().min(1),
  respondedBy: z.string().optional(),
});

@ApiTags("supply-chain / supplier-portal")
@ApiBearerAuth()
@Controller("supply-chain/supplier-portal")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierPortalController {
  constructor(private readonly svc: SupplyChainSupplierPortalService) {}

  @Get("dashboard")
  @Permissions("supply-chain.supplier-portal.read")
  @ApiOperation({ summary: "Supplier portal dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getPortalDashboard(req.user.tenantId);
  }

  @Post("invite")
  @Permissions("supply-chain.supplier-portal.create")
  @ApiOperation({ summary: "Send supplier portal invite" })
  @HttpCode(HttpStatus.CREATED)
  sendInvite(
    @Req() req: AuthRequest,
    @ZodBody(inviteSchema) body: z.infer<typeof inviteSchema>,
  ) {
    return this.svc.sendSupplierInvite(req.user.tenantId, body);
  }

  @Get("users")
  @Permissions("supply-chain.supplier-portal.read")
  @ApiOperation({ summary: "List portal users" })
  listUsers(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("vendorId") vendorId?: string,
  ) {
    return this.svc.listPortalUsers(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      vendorId,
    });
  }

  @Patch("users/:id/activate")
  @Permissions("supply-chain.supplier-portal.update")
  @ApiOperation({ summary: "Activate portal user" })
  activateUser(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.activatePortalUser(req.user.tenantId, id);
  }

  @Patch("users/:id/deactivate")
  @Permissions("supply-chain.supplier-portal.update")
  @ApiOperation({ summary: "Deactivate portal user" })
  deactivateUser(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.deactivatePortalUser(req.user.tenantId, id);
  }

  @Post("documents")
  @Permissions("supply-chain.supplier-portal.create")
  @ApiOperation({ summary: "Share document with supplier" })
  @HttpCode(HttpStatus.CREATED)
  shareDocument(
    @Req() req: AuthRequest,
    @ZodBody(documentSchema) body: z.infer<typeof documentSchema>,
  ) {
    return this.svc.shareDocument(req.user.tenantId, body);
  }

  @Get("documents")
  @Permissions("supply-chain.supplier-portal.read")
  @ApiOperation({ summary: "List shared documents" })
  listDocuments(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("supplierId") supplierId?: string,
    @Query("documentType") documentType?: string,
  ) {
    return this.svc.listSharedDocuments(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      supplierId,
      documentType,
    });
  }

  @Post("po-collaboration")
  @Permissions("supply-chain.supplier-portal.create")
  @ApiOperation({ summary: "Collaborate on purchase order" })
  @HttpCode(HttpStatus.CREATED)
  collaborateOnPO(
    @Req() req: AuthRequest,
    @ZodBody(poCollabSchema) body: z.infer<typeof poCollabSchema>,
  ) {
    return this.svc.collaborateOnPO(req.user.tenantId, body);
  }

  @Get("po-collaboration")
  @Permissions("supply-chain.supplier-portal.read")
  @ApiOperation({ summary: "List PO collaborations" })
  listPOCollabs(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("purchaseOrderId") purchaseOrderId?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.listPOCollaborations(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      purchaseOrderId,
      status,
    });
  }

  @Patch("po-collaboration/:id/respond")
  @Permissions("supply-chain.supplier-portal.update")
  @ApiOperation({ summary: "Respond to PO collaboration" })
  respondToPOCollab(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(poCollabResponseSchema)
    body: z.infer<typeof poCollabResponseSchema>,
  ) {
    return this.svc.respondToPOCollaboration(req.user.tenantId, id, body);
  }
}
