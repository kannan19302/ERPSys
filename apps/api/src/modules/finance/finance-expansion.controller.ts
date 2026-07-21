import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { FinanceExpansionService } from "./finance-expansion.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import {
  createCreditNoteSchema,
  createDebitNoteSchema,
  updateCreditNoteSchema,
  updateDebitNoteSchema,
  createRecurringInvoiceSchema,
  updateRecurringInvoiceSchema,
  createExpenseReportSchema,
  updateExpenseReportSchema,
  createExpenseCategorySchema,
  createDunningRunSchema,
  createDunningLevelSchema,
  updateDunningLevelSchema,
  generateStatementSchema,
  createStatementTemplateSchema,
  CreateCreditNoteInput,
  UpdateCreditNoteInput,
  CreateDebitNoteInput,
  UpdateDebitNoteInput,
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,
  CreateExpenseReportInput,
  UpdateExpenseReportInput,
  CreateExpenseCategoryInput,
  CreateDunningRunInput,
  CreateDunningLevelInput,
  UpdateDunningLevelInput,
  GenerateStatementInput,
  CreateStatementTemplateInput,
} from "@unerp/shared";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("Finance - Expansion")
@ApiBearerAuth()
@Controller("finance")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FinanceExpansionController {
  constructor(private readonly svc: FinanceExpansionService) {}

  // ──────────────────────────────────────────────
  // 1. Credit Notes
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List credit notes" })
  @Get("credit-notes")
  @Permissions("finance.credit.read")
  async listCreditNotes(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getCreditNotes(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get credit note statistics" })
  @Get("credit-notes/stats")
  @Permissions("finance.credit.read")
  async getCreditNoteStats(@Req() req: AuthenticatedRequest) {
    const notes = await this.svc.getCreditNotes(req.user.tenantId);
    const totalAmount = notes.reduce((s, n) => s + n.totalAmount, 0);
    const byStatus = { DRAFT: 0, APPLIED: 0, VOID: 0 };
    for (const n of notes) byStatus[n.status]++;
    return { total: notes.length, totalAmount, byStatus };
  }

  @ApiOperation({ summary: "Get credit note by ID" })
  @Get("credit-notes/:id")
  @Permissions("finance.credit.read")
  async getCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getCreditNoteById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create credit note" })
  @Post("credit-notes")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.credit.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CreditNote")
  async createCreditNote(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCreditNoteSchema) dto: CreateCreditNoteInput,
  ) {
    return this.svc.createCreditNote(
      req.user.tenantId,
      req.user.orgId || "org-default",
      dto,
      req.user.userId || "system",
    );
  }

  @ApiOperation({ summary: "Update credit note" })
  @Patch("credit-notes/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.credit.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CreditNote", "id")
  async updateCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateCreditNoteSchema) dto: UpdateCreditNoteInput,
  ) {
    return this.svc.updateCreditNote(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete credit note" })
  @Delete("credit-notes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.credit.delete")
  async deleteCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteCreditNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Apply credit note to invoice" })
  @Post("credit-notes/:id/apply")
  @Permissions("finance.credit.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CreditNote", "id")
  async applyCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.applyCreditNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Void credit note" })
  @Post("credit-notes/:id/void")
  @Permissions("finance.credit.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CreditNote", "id")
  async voidCreditNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.voidCreditNote(req.user.tenantId, id);
  }

  // ──────────────────────────────────────────────
  // 2. Debit Notes
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List debit notes" })
  @Get("debit-notes")
  @Permissions("finance.debit.read")
  async listDebitNotes(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getDebitNotes(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get debit note statistics" })
  @Get("debit-notes/stats")
  @Permissions("finance.debit.read")
  async getDebitNoteStats(@Req() req: AuthenticatedRequest) {
    const notes = await this.svc.getDebitNotes(req.user.tenantId);
    const totalAmount = notes.reduce((s, n) => s + n.totalAmount, 0);
    const byStatus = { DRAFT: 0, APPLIED: 0, VOID: 0 };
    for (const n of notes) byStatus[n.status]++;
    return { total: notes.length, totalAmount, byStatus };
  }

  @ApiOperation({ summary: "Get debit note by ID" })
  @Get("debit-notes/:id")
  @Permissions("finance.debit.read")
  async getDebitNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDebitNoteById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create debit note" })
  @Post("debit-notes")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.debit.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DebitNote")
  async createDebitNote(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDebitNoteSchema) dto: CreateDebitNoteInput,
  ) {
    return this.svc.createDebitNote(
      req.user.tenantId,
      req.user.orgId || "org-default",
      dto,
      req.user.userId || "system",
    );
  }

  @ApiOperation({ summary: "Update debit note" })
  @Patch("debit-notes/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.debit.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DebitNote", "id")
  async updateDebitNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateDebitNoteSchema) dto: UpdateDebitNoteInput,
  ) {
    return this.svc.updateDebitNote(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete debit note" })
  @Delete("debit-notes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.debit.delete")
  async deleteDebitNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDebitNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Apply debit note" })
  @Post("debit-notes/:id/apply")
  @Permissions("finance.debit.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DebitNote", "id")
  async applyDebitNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.applyDebitNote(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Void debit note" })
  @Post("debit-notes/:id/void")
  @Permissions("finance.debit.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DebitNote", "id")
  async voidDebitNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.voidDebitNote(req.user.tenantId, id);
  }

  // ──────────────────────────────────────────────
  // 3. Recurring Invoices
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List recurring invoice templates" })
  @Get("recurring-invoices")
  @Permissions("finance.recurring.read")
  async listRecurringInvoices(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getRecurringInvoices(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get recurring invoice statistics" })
  @Get("recurring-invoices/stats")
  @Permissions("finance.recurring.read")
  async getRecurringInvoiceStats(@Req() req: AuthenticatedRequest) {
    const templates = await this.svc.getRecurringInvoices(req.user.tenantId);
    const byStatus = { ACTIVE: 0, PAUSED: 0, COMPLETED: 0 };
    for (const t of templates) byStatus[t.status]++;
    return { total: templates.length, byStatus };
  }

  @ApiOperation({ summary: "Get generated invoices from recurring templates" })
  @Get("recurring-invoices/generated")
  @Permissions("finance.recurring.read")
  async getGeneratedInvoices(
    @Req() req: AuthenticatedRequest,
    @Query("templateId") templateId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getGeneratedInvoices(
      req.user.tenantId,
      templateId || "",
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Bulk generate invoices from all due templates" })
  @Post("recurring-invoices/bulk-generate")
  @Permissions("finance.recurring.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice.bulk")
  async bulkGenerateInvoices(@Req() req: AuthenticatedRequest) {
    return this.svc.bulkGenerate(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get upcoming invoices (next 30 days)" })
  @Get("recurring-invoices/upcoming")
  @Permissions("finance.recurring.read")
  async getUpcomingInvoices(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getUpcomingInvoices(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get recurring invoice template by ID" })
  @Get("recurring-invoices/:id")
  @Permissions("finance.recurring.read")
  async getRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getRecurringInvoiceById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create recurring invoice template" })
  @Post("recurring-invoices")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.recurring.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice")
  async createRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRecurringInvoiceSchema) dto: CreateRecurringInvoiceInput,
  ) {
    return this.svc.createRecurringInvoice(
      req.user.tenantId,
      req.user.orgId || "org-default",
      dto,
    );
  }

  @ApiOperation({ summary: "Update recurring invoice template" })
  @Patch("recurring-invoices/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.recurring.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice", "id")
  async updateRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateRecurringInvoiceSchema) dto: UpdateRecurringInvoiceInput,
  ) {
    return this.svc.updateRecurringInvoice(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete recurring invoice template" })
  @Delete("recurring-invoices/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.recurring.delete")
  async deleteRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteRecurringInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Activate recurring invoice template" })
  @Post("recurring-invoices/:id/activate")
  @Permissions("finance.recurring.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice", "id")
  async activateRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.activateRecurringInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Pause recurring invoice template" })
  @Post("recurring-invoices/:id/pause")
  @Permissions("finance.recurring.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice", "id")
  async pauseRecurringInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.pauseRecurringInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Generate next invoice from recurring template" })
  @Post("recurring-invoices/:id/generate-next")
  @Permissions("finance.recurring.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("RecurringInvoice", "id")
  async generateNextInvoice(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.generateNextInvoice(req.user.tenantId, id);
  }

  // ──────────────────────────────────────────────
  // 4. Expense Reports
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List expense reports" })
  @Get("expenses")
  @Permissions("finance.expense.read")
  async listExpenseReports(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getExpenseReports(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get expense report statistics" })
  @Get("expenses/stats")
  @Permissions("finance.expense.read")
  async getExpenseReportStats(@Req() req: AuthenticatedRequest) {
    const reports = await this.svc.getExpenseReports(req.user.tenantId);
    const totalAmount = reports.reduce((s, r) => s + r.amount, 0);
    const byStatus = {
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      REIMBURSED: 0,
    };
    for (const r of reports) byStatus[r.status]++;
    return { total: reports.length, totalAmount, byStatus };
  }

  @ApiOperation({ summary: "Get expense categories" })
  @Get("expenses/categories")
  @Permissions("finance.expense.read")
  async listExpenseCategories(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getExpenseCategories(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get pending reimbursements" })
  @Get("expenses/pending-reimbursement")
  @Permissions("finance.expense.read")
  async getPendingReimbursements(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getPendingReimbursements(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get expense report by ID" })
  @Get("expenses/:id")
  @Permissions("finance.expense.read")
  async getExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getExpenseReportById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create expense report" })
  @Post("expenses")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.expense.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport")
  async createExpenseReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createExpenseReportSchema) dto: CreateExpenseReportInput,
  ) {
    return this.svc.createExpenseReport(
      req.user.tenantId,
      req.user.orgId || "org-default",
      {
        ...dto,
        employeeId: req.user.userId || "system",
      },
      req.user.userId || "system",
    );
  }

  @ApiOperation({ summary: "Update expense report" })
  @Patch("expenses/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.expense.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport", "id")
  async updateExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateExpenseReportSchema) dto: UpdateExpenseReportInput,
  ) {
    return this.svc.updateExpenseReport(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete expense report" })
  @Delete("expenses/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.expense.delete")
  async deleteExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Submit expense report for approval" })
  @Post("expenses/:id/submit")
  @Permissions("finance.expense.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport", "id")
  async submitExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.submitExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Approve expense report" })
  @Post("expenses/:id/approve")
  @Permissions("finance.expense.approve")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport", "id")
  async approveExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.approveExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Reject expense report" })
  @Post("expenses/:id/reject")
  @Permissions("finance.expense.approve")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport", "id")
  async rejectExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.rejectExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Reimburse expense report" })
  @Post("expenses/:id/reimburse")
  @Permissions("finance.expense.approve")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseReport", "id")
  async reimburseExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.reimburseExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create expense category" })
  @Post("expenses/categories")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.expense.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExpenseCategory")
  async createExpenseCategory(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createExpenseCategorySchema) dto: CreateExpenseCategoryInput,
  ) {
    return this.svc.createExpenseCategory(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Delete expense category" })
  @Delete("expenses/categories/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.expense.create")
  async deleteExpenseCategory(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteExpenseCategory(req.user.tenantId, id);
  }

  // ──────────────────────────────────────────────
  // 5. Dunning (Collections)
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List dunning runs" })
  @Get("dunning")
  @Permissions("finance.dunning.read")
  async listDunningRuns(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getDunningRuns(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get dunning statistics" })
  @Get("dunning/stats")
  @Permissions("finance.dunning.read")
  async getDunningStats(@Req() req: AuthenticatedRequest) {
    const runs = await this.svc.getDunningRuns(req.user.tenantId);
    const totalAmount = runs.reduce((s, r) => s + r.totalAmount, 0);
    const totalLetters = runs.reduce((s, r) => s + r.totalLetters, 0);
    const byStatus = { DRAFT: 0, SENT: 0 };
    for (const r of runs) byStatus[r.status]++;
    return { total: runs.length, totalAmount, totalLetters, byStatus };
  }

  @ApiOperation({ summary: "List dunning levels" })
  @Get("dunning/levels")
  @Permissions("finance.dunning.read")
  async listDunningLevels(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getDunningLevels(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get overdue summary with aging buckets" })
  @Get("dunning/overdue-summary")
  @Permissions("finance.dunning.read")
  async getOverdueSummary(@Req() req: AuthenticatedRequest) {
    return this.svc.getOverdueSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get dunning run by ID" })
  @Get("dunning/:id")
  @Permissions("finance.dunning.read")
  async getDunningRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDunningRunById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create a new dunning run" })
  @Post("dunning")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.dunning.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DunningRun")
  async createDunningRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDunningRunSchema) dto: CreateDunningRunInput,
  ) {
    return this.svc.createDunningRun(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Send dunning reminders for a run" })
  @Post("dunning/:id/send")
  @Permissions("finance.dunning.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DunningRun", "id")
  async sendDunningReminders(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.sendDunningReminders(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create a dunning level" })
  @Post("dunning/levels")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.dunning.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DunningLevel")
  async createDunningLevel(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDunningLevelSchema) dto: CreateDunningLevelInput,
  ) {
    return this.svc.createDunningLevel(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update a dunning level" })
  @Patch("dunning/levels/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.dunning.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DunningLevel", "id")
  async updateDunningLevel(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateDunningLevelSchema) dto: UpdateDunningLevelInput,
  ) {
    return this.svc.updateDunningLevel(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete a dunning level" })
  @Delete("dunning/levels/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.dunning.delete")
  async deleteDunningLevel(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDunningLevel(req.user.tenantId, id);
  }

  // ──────────────────────────────────────────────
  // 6. Customer Statements
  // ──────────────────────────────────────────────

  @ApiOperation({ summary: "List customer statements" })
  @Get("statements")
  @Permissions("finance.statement.read")
  async listStatements(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getStatements(
      req.user.tenantId,
      customerId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "List statement templates" })
  @Get("statements/templates")
  @Permissions("finance.statement.read")
  async listStatementTemplates(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getStatementTemplates(
      req.user.tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Bulk generate statements for all customers" })
  @Post("statements/bulk-generate")
  @Permissions("finance.statement.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Statement.bulk")
  async bulkGenerateStatements(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        customerIds: z.array(z.string()),
        asOfDate: z.string(),
        includePaidInvoices: z.boolean().optional(),
      }),
    )
    dto: {
      customerIds: string[];
      asOfDate: string;
      includePaidInvoices?: boolean;
    },
  ) {
    const results: Array<{
      customerId: string;
      statementId: string;
      status: string;
    }> = [];
    for (const customerId of dto.customerIds) {
      try {
        const statement = await this.svc.generateStatement(req.user.tenantId, {
          customerId,
          asOfDate: dto.asOfDate,
          includePaidInvoices: dto.includePaidInvoices,
        });
        results.push({
          customerId,
          statementId: statement.id,
          status: "success",
        });
      } catch {
        results.push({ customerId, statementId: "", status: "failed" });
      }
    }
    return results;
  }

  @ApiOperation({ summary: "Bulk send statements" })
  @Post("statements/bulk-send")
  @Permissions("finance.statement.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Statement.bulk-send")
  async bulkSendStatements(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ statementIds: z.array(z.string()) }))
    dto: { statementIds: string[] },
  ) {
    const results: Array<{ statementId: string; status: string }> = [];
    for (const statementId of dto.statementIds) {
      try {
        await this.svc.sendStatement(req.user.tenantId, statementId);
        results.push({ statementId, status: "success" });
      } catch {
        results.push({ statementId, status: "failed" });
      }
    }
    return results;
  }

  @ApiOperation({ summary: "Get statement by ID" })
  @Get("statements/:id")
  @Permissions("finance.statement.read")
  async getStatement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getStatementById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Generate a customer statement" })
  @Post("statements")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.statement.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CustomerStatement")
  async generateStatement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(generateStatementSchema) dto: GenerateStatementInput,
  ) {
    return this.svc.generateStatement(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Send a customer statement" })
  @Post("statements/:id/send")
  @Permissions("finance.statement.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("CustomerStatement", "id")
  async sendStatement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.sendStatement(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create a statement template" })
  @Post("statements/templates")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.statement.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("StatementTemplate")
  async createStatementTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createStatementTemplateSchema) dto: CreateStatementTemplateInput,
  ) {
    return this.svc.createStatementTemplate(req.user.tenantId, dto);
  }
}
