import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { BlockchainDeepService } from "./blockchain-deep.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("blockchain")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("blockchain")
export class BlockchainDeepController {
  constructor(private readonly blockchainDeepService: BlockchainDeepService) {}

  /* ─── Transaction Explorer ─── */

  @ApiOperation({ summary: "List blockchain transactions with search" })
  @Get("transactions")
  @Permissions("blockchain.transaction.read")
  async listTransactions(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.blockchainDeepService.listTransactions(req.user.tenantId, {
      page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20, search, status,
    });
  }

  @ApiOperation({ summary: "Get transaction details" })
  @Get("transactions/:id")
  @Permissions("blockchain.transaction.read")
  async getTransaction(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.blockchainDeepService.getTransaction(req.user.tenantId, id);
  }

  /* ─── Smart Contract Registry ─── */

  @ApiOperation({ summary: "List smart contracts" })
  @Get("contracts")
  @Permissions("blockchain.contract.read")
  async listContracts(@Req() req: AuthenticatedRequest) {
    return this.blockchainDeepService.listContracts(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create smart contract" })
  @Post("contracts")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.contract.create")
  async createContract(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1), address: z.string().min(1), network: z.string().optional(), abi: z.array(z.any()).optional(), version: z.string().optional() }))
    body: { name: string; address: string; network?: string; abi?: any[]; version?: string },
  ) {
    return this.blockchainDeepService.createContract(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update smart contract" })
  @Put("contracts/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("blockchain.contract.update")
  async updateContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string().optional(), address: z.string().optional(), network: z.string().optional(), abi: z.array(z.any()).optional(), version: z.string().optional() }))
    body: Partial<{ name: string; address: string; network: string; abi: any[]; version: string }>,
  ) {
    return this.blockchainDeepService.updateContract(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete smart contract" })
  @Delete("contracts/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("blockchain.contract.delete")
  async deleteContract(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.blockchainDeepService.deleteContract(req.user.tenantId, id);
  }

  /* ─── Blockchain Audit Trail ─── */

  @ApiOperation({ summary: "List blockchain audit trail entries" })
  @Get("audit")
  @Permissions("blockchain.audit.read")
  async listAuditTrails(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
  ) {
    return this.blockchainDeepService.listAuditTrails(req.user.tenantId, { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 50, entityType, entityId });
  }

  @ApiOperation({ summary: "Create audit trail entry" })
  @Post("audit")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.audit.create")
  async createAuditTrail(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ entityType: z.string(), entityId: z.string(), action: z.string(), transactionHash: z.string().optional(), metadata: z.any().optional() }))
    body: { entityType: string; entityId: string; action: string; transactionHash?: string; metadata?: any },
  ) {
    return this.blockchainDeepService.createAuditTrail(req.user.tenantId, { ...body, performedBy: req.user.userId });
  }

  /* ─── Network Health Dashboard ─── */

  @ApiOperation({ summary: "Get network health status" })
  @Get("network/health")
  @Permissions("blockchain.network.read")
  async getNetworkHealth() {
    return this.blockchainDeepService.getNetworkHealth();
  }

  @ApiOperation({ summary: "Get aggregated network stats" })
  @Get("network/stats")
  @Permissions("blockchain.network.read")
  async getNetworkStats() {
    return this.blockchainDeepService.getNetworkStats();
  }

  @ApiOperation({ summary: "Upsert network health record" })
  @Post("network/health")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("blockchain.network.manage")
  async upsertNetworkHealth(@ZodBody(z.object({ network: z.string(), blockHeight: z.number().int(), peers: z.number().int(), syncStatus: z.string() })) body: { network: string; blockHeight: number; peers: number; syncStatus: string }) {
    return this.blockchainDeepService.upsertNetworkHealth(body);
  }
}
