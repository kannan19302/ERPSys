import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmQuoteSignatureService,
  requestSignatureSchema,
  signQuotationSchema,
  RequestSignatureInput,
  SignQuotationInput,
} from './crm-quote-signature.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/** Tenant-staff-facing admin endpoints: request a signature, view signatures/certificates. */
@ApiTags('crm-quote-signature')
@ApiBearerAuth()
@Controller('crm/quote-signature')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmQuoteSignatureController {
  constructor(private readonly svc: CrmQuoteSignatureService) {}

  @ApiOperation({ summary: 'List signature requests for a quotation' })
  @Get('quotations/:quotationId')
  @Permissions('crm.opportunity.read')
  async list(@Req() req: AuthenticatedRequest, @Param('quotationId') quotationId: string) {
    return this.svc.listSignatures(req.user.tenantId, quotationId);
  }

  @ApiOperation({ summary: 'Request an e-signature for a quotation' })
  @Post('request')
  @Permissions('crm.opportunity.update')
  @TrackChanges('QuotationSignature')
  async request(@Req() req: AuthenticatedRequest, @ZodBody(requestSignatureSchema) dto: RequestSignatureInput) {
    return this.svc.requestSignature(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get the signature audit certificate' })
  @Get('certificates/:signatureId')
  @Permissions('crm.opportunity.read')
  async certificate(@Req() req: AuthenticatedRequest, @Param('signatureId') signatureId: string) {
    return this.svc.getCertificate(req.user.tenantId, signatureId);
  }

  @ApiOperation({ summary: 'Render the certificate document (text content a PDF export would embed)' })
  @Get('certificates/:signatureId/document')
  @Permissions('crm.opportunity.read')
  async certificateDocument(@Req() req: AuthenticatedRequest, @Param('signatureId') signatureId: string) {
    return this.svc.renderCertificateDocument(req.user.tenantId, signatureId);
  }
}

/**
 * Public (unauthenticated) endpoints for the external signer — the token
 * itself is the credential (mirrors `CustomerPortalController`'s pattern),
 * so there is no JWT/RBAC guard here. Mounted under `/public/*` so the
 * existing CSRF middleware exemption for that prefix applies.
 */
@ApiTags('crm-quote-signature-public')
@Controller('public/quote-signature')
export class CrmQuoteSignaturePublicController {
  constructor(private readonly svc: CrmQuoteSignatureService) {}

  @ApiOperation({ summary: 'Look up a pending signature request by token' })
  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.svc.getSignatureByToken(token);
  }

  @ApiOperation({ summary: 'Sign the quotation via the emailed token' })
  @Post('sign')
  async sign(@ZodBody(signQuotationSchema) dto: SignQuotationInput, @Req() req: Request) {
    return this.svc.signQuotation({
      ...dto,
      ipAddress: dto.ipAddress ?? req.ip,
      userAgent: dto.userAgent ?? req.headers['user-agent'],
    });
  }

  @ApiOperation({ summary: 'Public: fetch the issued certificate document for a signed quotation' })
  @Get('certificates/:signatureId/document')
  async certificateDocument(@Param('signatureId') signatureId: string) {
    return this.svc.renderCertificateDocumentPublic(signatureId);
  }
}
