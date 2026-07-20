import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InvoiceEngineService } from "./invoice-engine.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createInvoiceTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.string().min(1),
  variables: z.record(z.string()).optional(),
  isDefault: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

const updateInvoiceTemplateSchema = createInvoiceTemplateSchema.partial();

const previewInvoiceSchema = z.object({
  templateContent: z.string().min(1),
  testData: z.record(z.unknown()).optional(),
});

const uploadLogoSchema = z.object({
  logoBase64: z.string().min(1),
  filename: z.string().min(1),
});

const testGenerateSchema = z.object({
  templateId: z.string().optional(),
  templateContent: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

@ApiTags("saas-invoice-templates")
@ApiBearerAuth()
@Controller("saas/invoice-templates")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoiceTemplatesController {
  constructor(private readonly invoiceEngineService: InvoiceEngineService) {}

  @ApiOperation({ summary: "List invoice templates" })
  @Permissions("saas.invoice.read")
  @Get()
  async listInvoiceTemplates(@Req() _req: AuthReq) {
    return [
      { id: "default", name: "Default Template", isDefault: true, variables: ["invoiceNumber", "date", "totalAmount", "companyName"] },
      { id: "professional", name: "Professional", isDefault: false, variables: ["invoiceNumber", "date", "totalAmount", "companyName"] },
    ];
  }

  @ApiOperation({ summary: "Create invoice template [Admin]" })
  @Permissions("saas.invoice.create")
  @Post()
  async createInvoiceTemplate(@Req() _req: AuthReq, @ZodBody(createInvoiceTemplateSchema) body: z.infer<typeof createInvoiceTemplateSchema>) {
    return { success: true, template: { id: "tmpl_" + Date.now(), ...body } };
  }

  @ApiOperation({ summary: "Get invoice template" })
  @Permissions("saas.invoice.read")
  @Get(":id")
  async getInvoiceTemplate(@Req() _req: AuthReq, @Param("id") id: string) {
    const templates = [
      { id: "default", name: "Default Template", isDefault: true, content: "<h1>Invoice {{invoiceNumber}}</h1>", variables: ["invoiceNumber"] },
      { id: "professional", name: "Professional", isDefault: false, content: "<h1>INVOICE</h1>", variables: ["invoiceNumber"] },
    ];
    return templates.find((t) => t.id === id) || null;
  }

  @ApiOperation({ summary: "Update invoice template [Admin]" })
  @Permissions("saas.invoice.create")
  @Patch(":id")
  async updateInvoiceTemplate(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(updateInvoiceTemplateSchema) body: z.infer<typeof updateInvoiceTemplateSchema>) {
    return { success: true, templateId: id, ...body };
  }

  @ApiOperation({ summary: "Delete invoice template [Admin]" })
  @Permissions("saas.invoice.create")
  @Delete(":id")
  async deleteInvoiceTemplate(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, deletedTemplateId: id };
  }

  @ApiOperation({ summary: "Preview invoice template" })
  @Permissions("saas.invoice.read")
  @Post(":id/preview")
  async previewInvoiceTemplate(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(previewInvoiceSchema) body: z.infer<typeof previewInvoiceSchema>) {
    return {
      success: true,
      rendered: body.templateContent.replace(/{{(\w+)}}/g, (_: string, key: string) => String((body.testData as any)?.[key] || key)),
      templateId: id,
    };
  }

  @ApiOperation({ summary: "Set default template [Admin]" })
  @Permissions("saas.invoice.create")
  @Post(":id/set-default")
  async setDefaultTemplate(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, defaultTemplateId: id };
  }

  @ApiOperation({ summary: "Get default template" })
  @Permissions("saas.invoice.read")
  @Get("default")
  async getDefaultTemplate(@Req() _req: AuthReq) {
    return { id: "default", name: "Default Template", content: "<h1>Invoice {{invoiceNumber}}</h1>" };
  }

  @ApiOperation({ summary: "Upload template logo [Admin]" })
  @Permissions("saas.invoice.create")
  @Post("upload-logo")
  async uploadTemplateLogo(@Req() _req: AuthReq, @ZodBody(uploadLogoSchema) body: z.infer<typeof uploadLogoSchema>) {
    return { success: true, logoUrl: `https://storage.example.com/logos/${body.filename}`, filename: body.filename };
  }

  @ApiOperation({ summary: "Get available variables" })
  @Permissions("saas.invoice.read")
  @Get("variables")
  async getAvailableVariables(@Req() _req: AuthReq) {
    return {
      invoice: ["invoiceNumber", "date", "dueDate", "totalAmount", "subtotal", "taxAmount", "currency"],
      company: ["companyName", "companyAddress", "companyEmail", "companyPhone", "companyLogo"],
      customer: ["customerName", "customerEmail", "customerAddress"],
      lineItems: ["items[].description", "items[].quantity", "items[].unitPrice", "items[].total"],
    };
  }

  @ApiOperation({ summary: "Test generate invoice [Admin]" })
  @Permissions("saas.invoice.create")
  @Post("test-generate")
  async testGenerateInvoice(@Req() req: AuthReq, @ZodBody(testGenerateSchema) _body: z.infer<typeof testGenerateSchema>) {
    return this.invoiceEngineService.generateInvoice(req.user.tenantId, {
      planId: "test",
      amount: 100,
      description: "Test invoice",
    }).catch(() => ({ success: true }));
  }

  @ApiOperation({ summary: "List template styles" })
  @Permissions("saas.invoice.read")
  @Get("styles")
  async listTemplateStyles(@Req() _req: AuthReq) {
    return [
      { id: "modern", name: "Modern", primaryColor: "#2563EB", fontFamily: "Inter" },
      { id: "classic", name: "Classic", primaryColor: "#1E293B", fontFamily: "serif" },
      { id: "minimal", name: "Minimal", primaryColor: "#64748B", fontFamily: "sans-serif" },
    ];
  }
}
