/**
 * BlockchainController — REST API for blockchain operations
 *
 * Provides endpoints for:
 *  - Verifying document/entity authenticity
 *  - Querying blockchain transaction records
 *  - Admin network health and stats
 *
 * Routes: /blockchain/*
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DocumentBlockchainService } from './services/document-blockchain.service';
import { FinanceLedgerBlockchainService } from './services/finance-ledger-blockchain.service';
import { SupplyChainBlockchainService } from './services/supply-chain-blockchain.service';
import { ProcurementBlockchainService } from './services/procurement-blockchain.service';
import { FabricGatewayProvider } from './providers/fabric-gateway.provider';
import { prisma } from '@unerp/database';
import { BlockchainTxStatus } from '@unerp/blockchain';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { VerifyJournalDto } from './dto/verify-journal.dto';
import { ThreeWayMatchDto } from './dto/three-way-match.dto';
import { GetProvenanceDto } from './dto/get-provenance.dto';
import { IssueRecallDto } from './dto/issue-recall.dto';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('Blockchain')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly documentBlockchain: DocumentBlockchainService,
    private readonly financeLedger: FinanceLedgerBlockchainService,
    private readonly supplyChain: SupplyChainBlockchainService,
    private readonly procurement: ProcurementBlockchainService,
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Network Health
  // ──────────────────────────────────────────────────────────────

  @Get('health')
  @Permissions('blockchain.network.read')
  @ApiOperation({ summary: 'Get Fabric network health status' })
  async getNetworkHealth() {
    return {
      connected: this.fabricGateway.isConnected(),
      enabled: process.env['BLOCKCHAIN_ENABLED'] === 'true',
      timestamp: new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Document Registry
  // ──────────────────────────────────────────────────────────────

  @Post('verify/document')
  @HttpCode(HttpStatus.OK)
  @Permissions('blockchain.document.verify')
  @ApiOperation({ summary: 'Verify document authenticity on the blockchain' })
  async verifyDocument(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyDocumentDto,
  ) {
    const result = await this.documentBlockchain.verifyDocument({
      tenantId: req.user.tenantId,
      documentId: dto.documentId,
      currentHash: dto.currentHash,
    });

    return {
      ...result,
      documentId: dto.documentId,
      verifiedAt: new Date().toISOString(),
    };
  }

  @Get('transactions/document/:documentId')
  @Permissions('blockchain.document.read')
  @ApiOperation({ summary: 'Get blockchain transaction record for a document' })
  async getDocumentBlockchainRecord(
    @Req() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
  ) {
    const record = await this.documentBlockchain.getDocumentBlockchainRecord(req.user.tenantId, documentId);
    if (!record) throw new NotFoundException(`No blockchain record found for document ${documentId}`);
    return record;
  }

  // ──────────────────────────────────────────────────────────────
  // Finance Ledger
  // ──────────────────────────────────────────────────────────────

  @Post('verify/journal-entry')
  @HttpCode(HttpStatus.OK)
  @Permissions('blockchain.finance.verify')
  @ApiOperation({ summary: 'Verify GL journal entry integrity on the blockchain' })
  async verifyJournalEntry(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyJournalDto,
  ) {
    const result = await this.financeLedger.verifyJournalEntry({
      tenantId: req.user.tenantId,
      journalId: dto.journalId,
      currentEntryData: dto.currentEntryData,
    });

    return {
      result,
      journalId: dto.journalId,
      verifiedAt: new Date().toISOString(),
    };
  }

  @Get('transactions/journal/:journalId')
  @Permissions('blockchain.finance.read')
  @ApiOperation({ summary: 'Get blockchain transaction record for a GL journal entry' })
  async getJournalBlockchainRecord(
    @Req() req: AuthenticatedRequest,
    @Param('journalId') journalId: string,
  ) {
    const record = await this.financeLedger.getJournalBlockchainRecord(req.user.tenantId, journalId);
    if (!record) throw new NotFoundException(`No blockchain record found for journal ${journalId}`);
    return record;
  }

  // ──────────────────────────────────────────────────────────────
  // Supply Chain Traceability
  // ──────────────────────────────────────────────────────────────

  @Post('supply-chain/provenance')
  @HttpCode(HttpStatus.OK)
  @Permissions('blockchain.supply-chain.read')
  @ApiOperation({ summary: 'Get product provenance chain from blockchain' })
  async getProvenance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: GetProvenanceDto,
  ) {
    const records = await this.supplyChain.getProvenance(req.user.tenantId, dto.productId, dto.batchId);
    return {
      productId: dto.productId,
      batchId: dto.batchId,
      provenanceChain: records,
      totalEvents: records.length,
    };
  }

  @Post('supply-chain/recall')
  @Permissions('blockchain.supply-chain.write')
  @ApiOperation({ summary: 'Issue a product recall on the blockchain' })
  async issueRecall(
    @Req() req: AuthenticatedRequest,
    @Body() dto: IssueRecallDto,
  ) {
    const result = await this.supplyChain.issueRecall({
      tenantId: req.user.tenantId,
      ...dto,
    });
    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // Procurement 3-Way Match
  // ──────────────────────────────────────────────────────────────

  @Post('procurement/three-way-match')
  @HttpCode(HttpStatus.OK)
  @Permissions('blockchain.procurement.match')
  @ApiOperation({ summary: 'Execute automated 3-way PO/Receipt/Invoice match on blockchain' })
  async executeThreeWayMatch(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ThreeWayMatchDto,
  ) {
    const result = await this.procurement.executeThreeWayMatch(req.user.tenantId, dto.poId);
    return {
      poId: dto.poId,
      ...result,
      executedAt: new Date().toISOString(),
    };
  }

  @Get('procurement/po/:poId/history')
  @Permissions('blockchain.procurement.read')
  @ApiOperation({ summary: 'Get the full blockchain history of a purchase order' })
  async getPurchaseOrderHistory(
    @Req() req: AuthenticatedRequest,
    @Param('poId') poId: string,
  ) {
    const history = await this.procurement.getPurchaseOrderHistory(req.user.tenantId, poId);
    return { poId, history };
  }

  // ──────────────────────────────────────────────────────────────
  // Generic transaction list (all entity types)
  // ──────────────────────────────────────────────────────────────

  @Get('transactions')
  @Permissions('blockchain.transactions.read')
  @ApiOperation({ summary: 'List blockchain transaction records (paginated)' })
  async listTransactions(
    @Req() req: AuthenticatedRequest,
    @Query('entityType') entityType?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      tenantId: req.user.tenantId,
      ...(entityType && { entityType }),
      ...(status && { status: status as BlockchainTxStatus }),
    };

    const [data, total] = await Promise.all([
      prisma.blockchainTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.blockchainTransaction.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('stats')
  @Permissions('blockchain.network.read')
  @ApiOperation({ summary: 'Get blockchain statistics for the tenant' })
  async getStats(@Req() req: AuthenticatedRequest) {
    const [byStatus, byEntityType] = await Promise.all([
      prisma.blockchainTransaction.groupBy({
        by: ['status'],
        where: { tenantId: req.user.tenantId },
        _count: { _all: true },
      }),
      prisma.blockchainTransaction.groupBy({
        by: ['entityType'],
        where: { tenantId: req.user.tenantId },
        _count: { _all: true },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      byEntityType: byEntityType.map((e) => ({ entityType: e.entityType, count: e._count._all })),
      networkConnected: this.fabricGateway.isConnected(),
    };
  }
}
