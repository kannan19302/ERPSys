import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { hashPassword, comparePassword, signToken } from '@unerp/auth';
import { randomBytes } from 'crypto';

/**
 * Supplier self-service portal: lets a vendor's own staff log in (separately
 * from tenant staff — no Role/Permission records, no RbacGuard) and view
 * only their own purchase orders and performance metrics. Tenant admins
 * invite/manage the portal accounts; the portal login issues a scoped JWT
 * (compatible with the existing JwtAuthGuard, since it just decodes whatever
 * claims are in the token) carrying `{ tenantId, userId, vendorId, portal: true }`
 * — every portal-facing query is filtered by that vendorId, not just tenantId.
 */
@Injectable()
export class VendorPortalService {
  async inviteUser(tenantId: string, vendorId: string, email: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (!email) throw new BadRequestException('email is required');

    const existing = await prisma.vendorPortalUser.findFirst({ where: { tenantId, email } });
    if (existing) throw new BadRequestException('A portal user with this email already exists for this tenant');

    // Dev/demo-friendly invite flow: generate a temporary password and return
    // it directly instead of sending an email (no email-delivery integration
    // wired into this module). A production rollout would email an invite
    // link instead of surfacing the password in the API response.
    const tempPassword = randomBytes(9).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.vendorPortalUser.create({
      data: { tenantId, vendorId, email, passwordHash, status: 'INVITED' },
    });

    return { id: user.id, email: user.email, status: user.status, tempPassword };
  }

  async listUsers(tenantId: string, vendorId: string) {
    return prisma.vendorPortalUser.findMany({
      where: { tenantId, vendorId },
      select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async disableUser(tenantId: string, userId: string) {
    const existing = await prisma.vendorPortalUser.findFirst({ where: { id: userId, tenantId } });
    if (!existing) throw new NotFoundException('Portal user not found');
    return prisma.vendorPortalUser.update({ where: { id: userId }, data: { status: 'DISABLED' } });
  }

  /**
   * Portal login. Email is only unique per-tenant (`@@unique([tenantId, email])`),
   * not globally, so this checks every matching row across tenants and verifies
   * the password against each — the same pattern any global-email login needs
   * when there's no tenant-identifying subdomain/slug at login time.
   */
  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('email and password are required');

    const candidates = await prisma.vendorPortalUser.findMany({ where: { email, status: { not: 'DISABLED' } } });
    for (const candidate of candidates) {
      if (await comparePassword(password, candidate.passwordHash)) {
        await prisma.vendorPortalUser.update({
          where: { id: candidate.id },
          data: { status: 'ACTIVE', lastLoginAt: new Date() },
        });
        const token = signToken(
          { tenantId: candidate.tenantId, userId: candidate.id, vendorId: candidate.vendorId, portal: true, email: candidate.email },
          '8h',
        );
        return { token, vendorId: candidate.vendorId };
      }
    }
    throw new UnauthorizedException('Invalid portal credentials');
  }

  /** Purchase orders visible to a portal user — strictly their own vendor's. */
  async getMyPurchaseOrders(tenantId: string, vendorId: string) {
    return prisma.purchaseOrder.findMany({
      where: { tenantId, vendorId, deletedAt: null },
      include: { lineItems: true, receipts: true },
      orderBy: { orderDate: 'desc' },
    });
  }

  /** RFQs the vendor has been invited to quote on. */
  async getMyRfqs(tenantId: string, vendorId: string) {
    return prisma.rFQ.findMany({
      where: {
        tenantId,
        deletedAt: null,
        supplierQuotations: { some: { vendorId } },
      },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
