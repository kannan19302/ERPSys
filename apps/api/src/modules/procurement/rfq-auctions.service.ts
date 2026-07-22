import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class RfqAuctionsService {
  async listAuctions(tenantId: string, params: PaginationParams & { status?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, isAuction: true };
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.rFQ.findMany({
        where, skip, take, orderBy: orderBy as any,
        include: { _count: { select: { auctionBids: true, supplierQuotations: true } } },
      }),
      prisma.rFQ.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getAuctionById(tenantId: string, id: string) {
    const rfq = await prisma.rFQ.findFirst({
      where: { id, tenantId, isAuction: true },
      include: { auctionBids: { include: { vendor: { select: { name: true } } }, orderBy: { bidAmount: 'asc' as const } }, supplierQuotations: { include: { vendor: { select: { name: true } } } } },
    });
    if (!rfq) throw new NotFoundException('Auction not found');
    return rfq;
  }

  async createAuction(tenantId: string, orgId: string, dto: { items: Array<{ productId?: string; description: string; quantity: number }>; auctionEndsAt: string; notes?: string }) {
    const count = await prisma.rFQ.count({ where: { tenantId, orgId } });
    const rfqNumber = `AUC-${orgId.substring(0, 4).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;

    return prisma.rFQ.create({
      data: {
        tenantId, orgId,
        rfqNumber,
        status: 'DRAFT',
        isAuction: true,
        auctionEndsAt: new Date(dto.auctionEndsAt),
        notes: dto.notes,
        lineItems: { create: dto.items.map((item) => ({ tenantId: tenantId, productId: item.productId, description: item.description, quantity: item.quantity })) },
      },
      include: { lineItems: true, _count: { select: { auctionBids: true } } },
    });
  }

  async placeBid(tenantId: string, rfqId: string, vendorId: string, bidAmount: number, notes?: string) {
    const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, tenantId, isAuction: true } });
    if (!rfq) throw new NotFoundException('Auction not found');
    if (rfq.status !== 'SENT') throw new BadRequestException('Auction is not open for bids');

    return prisma.rFQAuctionBid.create({
      data: { tenantId, rfqId, vendorId, bidAmount, notes, status: 'SUBMITTED' },
      include: { vendor: { select: { name: true } } },
    });
  }

  async listBids(tenantId: string, rfqId: string): Promise<any[]> {
    return prisma.rFQAuctionBid.findMany({
      where: { tenantId, rfqId },
      include: { vendor: { select: { name: true } } },
      orderBy: { bidAmount: 'asc' as const },
    });
  }

  async selectWinningBid(tenantId: string, rfqId: string, bidId: string) {
    const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, tenantId, isAuction: true } });
    if (!rfq) throw new NotFoundException('Auction not found');

    const bid = await prisma.rFQAuctionBid.findFirst({ where: { id: bidId, rfqId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await prisma.rFQAuctionBid.updateMany({ where: { rfqId, status: 'SUBMITTED' }, data: { status: 'REJECTED' } });
    await prisma.rFQAuctionBid.update({ where: { id: bidId }, data: { status: 'WINNING' } });

    const quotation = await prisma.supplierQuotation.create({
      data: {
        tenantId, orgId: rfq.orgId,
        rfqId, vendorId: bid.vendorId,
        quotationNumber: `AUC-QTN-${rfq.rfqNumber}`,
        status: 'APPROVED',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: bid.bidAmount, taxAmount: 0, totalAmount: bid.bidAmount,
        lineItems: { create: [] },
      },
    });

    return { bid, quotation };
  }

  async updateAuctionStatus(tenantId: string, id: string, status: string) {
    const rfq = await prisma.rFQ.findFirst({ where: { id, tenantId, isAuction: true } });
    if (!rfq) throw new NotFoundException('Auction not found');

    const validTransitions: Record<string, string[]> = { DRAFT: ['SENT', 'CANCELLED'], SENT: ['COMPLETED', 'CANCELLED'] };
    const allowed = validTransitions[rfq.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition auction from ${rfq.status} to ${status}`);
    }

    return prisma.rFQ.update({ where: { id }, data: { status } });
  }

  async getStats(tenantId: string) {
    const auctions = await prisma.rFQ.findMany({ where: { tenantId, isAuction: true } });
    const bids = await prisma.rFQAuctionBid.findMany({ where: { tenantId } });
    return {
      totalAuctions: auctions.length,
      auctionByStatus: auctions.reduce((acc: Record<string, number>, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {}),
      totalBids: bids.length,
      averageBidsPerAuction: auctions.length > 0 ? Math.round(bids.length / auctions.length * 10) / 10 : 0,
      totalSavings: bids.filter(b => b.status === 'WINNING').reduce((sum, b) => sum + Number(b.bidAmount), 0),
    };
  }
}
