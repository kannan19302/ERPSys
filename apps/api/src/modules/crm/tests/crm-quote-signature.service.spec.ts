import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmQuoteSignatureService } from '../crm-quote-signature.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    quotation: { findFirst: vi.fn() },
    quotationSignature: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    quotationSignatureCertificate: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmQuoteSignatureService', () => {
  let service: CrmQuoteSignatureService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmQuoteSignatureService();
  });

  it('requests a signature with a unique token and expiry', async () => {
    (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'q1', quotationNumber: 'QT-1' });
    (prisma.quotationSignature.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'sig1', ...data }));

    const sig = await service.requestSignature(TENANT, {
      quotationId: 'q1', signerName: 'Jane Doe', signerEmail: 'jane@example.com', expiresInDays: 14,
    });
    expect(sig.status).toBe('PENDING');
    expect(sig.token).toHaveLength(48);
  });

  it('throws when requesting a signature for a missing quotation', async () => {
    (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.requestSignature(TENANT, {
      quotationId: 'missing', signerName: 'Jane', signerEmail: 'jane@example.com', expiresInDays: 14,
    })).rejects.toThrow('Quotation not found');
  });

  it('signs a quotation, issues a certificate with a deterministic hash, and returns it', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    (prisma.quotationSignature.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sig1', tenantId: TENANT, quotationId: 'q1', signerName: 'Jane Doe', signerEmail: 'jane@example.com',
      status: 'PENDING', createdAt, expiresAt: new Date(Date.now() + 86400000),
      quotation: { quotationNumber: 'QT-1' },
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([{}, {}]);
    (prisma.quotationSignatureCertificate.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cert1', tenantId: TENANT, signatureId: 'sig1', certificateNumber: 'CERT-2026-ABC123',
      documentHash: 'abc', signerName: 'Jane Doe', signerEmail: 'jane@example.com', auditTrail: [],
      issuedAt: new Date(), signature: { quotation: { quotationNumber: 'QT-1' } },
    });

    const result = await service.signQuotation({ token: 'tok1', signatureData: 'base64==', ipAddress: '1.2.3.4' });
    expect(result.certificateNumber).toBe('CERT-2026-ABC123');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects signing an already-signed request', async () => {
    (prisma.quotationSignature.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sig1', status: 'SIGNED', expiresAt: new Date(Date.now() + 86400000), quotation: { quotationNumber: 'QT-1' },
    });
    await expect(service.signQuotation({ token: 'tok1', signatureData: 'x' })).rejects.toThrow('already been signed');
  });

  it('rejects signing an expired request', async () => {
    (prisma.quotationSignature.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sig1', status: 'PENDING', expiresAt: new Date(Date.now() - 1000), quotation: { quotationNumber: 'QT-1' },
    });
    (prisma.quotationSignature.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await expect(service.signQuotation({ token: 'tok1', signatureData: 'x' })).rejects.toThrow('expired');
  });

  it('renders a certificate document including the audit trail', async () => {
    (prisma.quotationSignatureCertificate.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cert1', certificateNumber: 'CERT-2026-ABC123', documentHash: 'abc', signerName: 'Jane Doe', signerEmail: 'jane@example.com',
      ipAddress: '1.2.3.4', issuedAt: new Date('2026-01-01T00:00:00Z'),
      auditTrail: [{ event: 'SIGNED', at: '2026-01-01T00:00:00.000Z' }],
      signature: { quotation: { quotationNumber: 'QT-1' } },
    });
    const doc = await service.renderCertificateDocument(TENANT, 'sig1');
    expect(doc.content).toContain('CERT-2026-ABC123');
    expect(doc.content).toContain('SIGNED');
  });
});
