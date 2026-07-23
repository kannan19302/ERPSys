import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import {
  TaxJurisdictionLookupService,
  TaxFilingCalendarService,
  RecurringJournalSchedulerService,
} from "./services";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const lookupTaxRateSchema = z.object({
  country: z.string().optional(),
  state: z.string().min(1),
  county: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().min(1),
  taxCategory: z
    .enum([
      "SAAS",
      "DIGITAL_GOODS",
      "PHYSICAL_GOODS",
      "EXEMPT_FREIGHT",
      "PROFESSIONAL_SERVICES",
    ])
    .optional(),
  taxableAmount: z.number().min(0),
});

const createJurisdictionOverrideSchema = z.object({
  country: z.string().optional(),
  state: z.string().min(1),
  county: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  revenueThreshold: z.number().optional(),
  notes: z.string().optional(),
});

const updateJurisdictionSchema = z.object({
  revenueThreshold: z.number().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const journalLineSchema = z.object({
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const createRecurringTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  maxOccurrences: z.number().optional(),
  autoPost: z.boolean().optional(),
  lines: z.array(journalLineSchema).min(1),
});

const updateRecurringTemplateSchema = z.object({
  name: z.string().optional(),
  frequency: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"])
    .optional(),
  status: z.string().optional(),
  lines: z.array(journalLineSchema).optional(),
});

@ApiTags("Finance - Tax Jurisdiction & Recurring Journals")
@Controller("advanced-finance")
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class FinanceTaxJournalDeepController {
  constructor(
    private readonly taxLookupService: TaxJurisdictionLookupService,
    private readonly filingCalendarService: TaxFilingCalendarService,
    private readonly recurringJournalService: RecurringJournalSchedulerService,
  ) {}

  // ── TAX JURISDICTION LOOKUP ─────────────────────

  @ApiOperation({
    summary: "Lookup real-time tax rate for postal code & category",
  })
  @Post("tax/lookup-rate")
  @Permissions("finance.tax.read")
  async lookupTaxRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(lookupTaxRateSchema) body: z.infer<typeof lookupTaxRateSchema>,
  ) {
    return this.taxLookupService.lookupTaxRate(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "List configured tax jurisdictions" })
  @Get("tax/jurisdictions")
  @Permissions("finance.tax.read")
  async listJurisdictions(@Req() req: AuthenticatedRequest) {
    return this.taxLookupService.listJurisdictions(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create custom jurisdiction rate override" })
  @Post("tax/jurisdictions")
  @Permissions("finance.tax.create")
  @TrackChanges("EconomicNexusThreshold")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createJurisdictionOverride(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createJurisdictionOverrideSchema)
    body: z.infer<typeof createJurisdictionOverrideSchema>,
  ) {
    return this.taxLookupService.createJurisdictionOverride(
      req.user.tenantId,
      body,
    );
  }

  @ApiOperation({ summary: "Update jurisdiction rate override" })
  @Put("tax/jurisdictions/:id")
  @Permissions("finance.tax.update")
  @TrackChanges("EconomicNexusThreshold")
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateJurisdiction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateJurisdictionSchema)
    body: z.infer<typeof updateJurisdictionSchema>,
  ) {
    return this.taxLookupService.updateJurisdiction(
      req.user.tenantId,
      id,
      body,
    );
  }

  // ── TAX FILING CALENDAR & REMINDERS ─────────────

  @ApiOperation({ summary: "Get tax return filing calendar schedules" })
  @Get("tax/filing-calendar")
  @Permissions("finance.tax.read")
  async getFilingCalendar(@Req() req: AuthenticatedRequest) {
    return this.filingCalendarService.getFilingCalendar(req.user.tenantId);
  }

  @ApiOperation({ summary: "Recalculate tax filing calendar schedules" })
  @Post("tax/filing-calendar/recalculate")
  @Permissions("finance.tax.create")
  async recalculateFilingCalendar(@Req() req: AuthenticatedRequest) {
    return this.filingCalendarService.recalculateFilingCalendar(
      req.user.tenantId,
    );
  }

  @ApiOperation({ summary: "Get tax filing reminders queue" })
  @Get("tax/filing-reminders")
  @Permissions("finance.tax.read")
  async getFilingReminders(@Req() req: AuthenticatedRequest) {
    return this.filingCalendarService.getFilingReminders(req.user.tenantId);
  }

  @ApiOperation({ summary: "Acknowledge tax filing reminder" })
  @Post("tax/filing-reminders/:id/acknowledge")
  @Permissions("finance.tax.update")
  async acknowledgeReminder(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.filingCalendarService.acknowledgeReminder(
      req.user.tenantId,
      id,
    );
  }

  // ── RECURRING JOURNALS ──────────────────────────

  @ApiOperation({ summary: "List recurring journal templates" })
  @Get("recurring-journals/templates")
  @Permissions("finance.gl.read")
  async listRecurringTemplates(@Req() req: AuthenticatedRequest) {
    return this.recurringJournalService.listTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create recurring journal template" })
  @Post("recurring-journals/templates")
  @Permissions("finance.gl.create")
  @TrackChanges("RecurringJournal")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createRecurringTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRecurringTemplateSchema)
    body: z.infer<typeof createRecurringTemplateSchema>,
  ) {
    const orgId = await resolveOrgId(req.user.tenantId, req.user.orgId);
    return this.recurringJournalService.createTemplate(
      req.user.tenantId,
      orgId,
      body,
    );
  }

  @ApiOperation({ summary: "Update recurring journal template" })
  @Put("recurring-journals/templates/:id")
  @Permissions("finance.gl.update")
  @TrackChanges("RecurringJournal")
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateRecurringTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateRecurringTemplateSchema)
    body: z.infer<typeof updateRecurringTemplateSchema>,
  ) {
    return this.recurringJournalService.updateTemplate(
      req.user.tenantId,
      id,
      body,
    );
  }

  @ApiOperation({ summary: "Post recurring journal template immediately" })
  @Post("recurring-journals/templates/:id/post-now")
  @Permissions("finance.gl.create")
  @TrackChanges("JournalEntry")
  @UseInterceptors(ChangeHistoryInterceptor)
  async postTemplateNow(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.recurringJournalService.postTemplateNow(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Process all due recurring journals" })
  @Post("recurring-journals/process-due")
  @Permissions("finance.gl.create")
  async processDueRecurringJournals(@Req() req: AuthenticatedRequest) {
    return this.recurringJournalService.processDueRecurringJournals(
      req.user.tenantId,
    );
  }
}
