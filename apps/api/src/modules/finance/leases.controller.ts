import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { LeaseAccountingService } from "./lease-accounting.service";

interface AuthRequest extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

const CreateLeaseSchema = z.object({
  leaseRef: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  leaseType: z.enum(["OPERATING", "FINANCE"]).default("OPERATING"),
  presentValue: z.number().positive().optional(),
  interestRate: z.number().min(0).max(1).optional(),
});

const UpdateLeaseSchema = z.object({
  leaseRef: z.string().optional(),
  description: z.string().optional(),
  leaseType: z.enum(["OPERATING", "FINANCE"]).optional(),
});

const StatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED", "TERMINATED"]),
});
const PostMonthSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
});
const BulkPostSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
});
const TerminateSchema = z.object({ terminationDate: z.string() });
const RenewSchema = z.object({
  newEndDate: z.string(),
  newPresentValue: z.number().positive().optional(),
});

@ApiTags("Finance - Leases")
@ApiBearerAuth()
@Controller("finance/leases")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class LeasesController {
  constructor(private readonly svc: LeaseAccountingService) {}

  private tid(req: AuthRequest) {
    return req.user?.tenantId ?? (req as any).headers?.["x-tenant-id"];
  }
  private oid(req: AuthRequest) {
    return req.user?.orgId ?? (req as any).headers?.["x-org-id"];
  }

  @ApiOperation({ summary: "List leases with pagination, search, and filters" })
  @Get()
  @Permissions("finance.leases.read")
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("leaseType") leaseType?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.svc.getLeases(this.tid(req), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      leaseType,
      status,
      sortBy,
      sortOrder,
    });
  }

  @ApiOperation({ summary: "Get aggregate lease portfolio summary" })
  @Get("summary")
  @Permissions("finance.leases.read")
  summary(@Req() req: AuthRequest) {
    return this.svc.getLeaseSummary(this.tid(req));
  }

  @ApiOperation({ summary: "Get upcoming lease payments within a day window" })
  @Get("upcoming-payments")
  @Permissions("finance.leases.read")
  upcomingPayments(@Req() req: AuthRequest, @Query("days") days?: string) {
    return this.svc.getUpcomingPayments(
      this.tid(req),
      days ? Number(days) : 30,
    );
  }

  @ApiOperation({ summary: "Get leases expiring within a day window" })
  @Get("expiring-soon")
  @Permissions("finance.leases.read")
  expiringSoon(@Req() req: AuthRequest, @Query("days") days?: string) {
    return this.svc.getExpiringSoon(this.tid(req), days ? Number(days) : 90);
  }

  @ApiOperation({ summary: "Get lease analytics (cost trends, breakdowns)" })
  @Get("analytics")
  @Permissions("finance.leases.read")
  analytics(@Req() req: AuthRequest) {
    return this.svc.getLeaseAnalytics(this.tid(req));
  }

  @ApiOperation({
    summary: "Bulk post monthly lease journal entries for a period",
  })
  @Post("bulk-post")
  @Permissions("finance.leases.post")
  @TrackChanges("finance.leases.bulk-post")
  bulkPost(
    @Req() req: AuthRequest,
    @ZodBody(BulkPostSchema) body: z.infer<typeof BulkPostSchema>,
  ) {
    return this.svc.bulkPostMonth(this.tid(req), body.period);
  }

  @ApiOperation({ summary: "Get a lease by id" })
  @Get(":id")
  @Permissions("finance.leases.read")
  getOne(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getLeaseById(this.tid(req), id);
  }

  @ApiOperation({ summary: "Get the amortization schedule for a lease" })
  @Get(":id/schedule")
  @Permissions("finance.leases.read")
  schedule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getLeaseSchedule(this.tid(req), id);
  }

  @ApiOperation({ summary: "Get journal entries posted for a lease" })
  @Get(":id/journal-entries")
  @Permissions("finance.leases.read")
  journalEntries(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getLeaseJournalEntries(this.tid(req), id);
  }

  @ApiOperation({ summary: "Create a new lease" })
  @Post()
  @Permissions("finance.leases.create")
  @TrackChanges("finance.leases.create")
  create(
    @Req() req: AuthRequest,
    @ZodBody(CreateLeaseSchema) body: z.infer<typeof CreateLeaseSchema>,
  ) {
    return this.svc.createLease(this.tid(req), this.oid(req), body);
  }

  @ApiOperation({ summary: "Update lease details" })
  @Patch(":id")
  @Permissions("finance.leases.update")
  @TrackChanges("finance.leases.update")
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(UpdateLeaseSchema) body: z.infer<typeof UpdateLeaseSchema>,
  ) {
    return this.svc.updateLease(this.tid(req), id, body);
  }

  @ApiOperation({ summary: "Update the status of a lease" })
  @Patch(":id/status")
  @Permissions("finance.leases.update")
  @TrackChanges("finance.leases.status")
  setStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(StatusSchema) body: z.infer<typeof StatusSchema>,
  ) {
    return this.svc.setLeaseStatus(this.tid(req), id, body.status);
  }

  @ApiOperation({ summary: "Delete a lease" })
  @Delete(":id")
  @Permissions("finance.leases.delete")
  @TrackChanges("finance.leases.delete")
  remove(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.deleteLease(this.tid(req), id);
  }

  @ApiOperation({
    summary: "Post the monthly journal entry for a lease period",
  })
  @Post(":id/post-month")
  @Permissions("finance.leases.post")
  @TrackChanges("finance.leases.post-month")
  postMonth(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(PostMonthSchema) body: z.infer<typeof PostMonthSchema>,
  ) {
    return this.svc.postMonthlyEntry(this.tid(req), id, body.period);
  }

  @ApiOperation({ summary: "Terminate a lease early" })
  @Post(":id/terminate")
  @Permissions("finance.leases.update")
  @TrackChanges("finance.leases.terminate")
  terminate(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(TerminateSchema) body: z.infer<typeof TerminateSchema>,
  ) {
    return this.svc.terminateLease(this.tid(req), id, body.terminationDate);
  }

  @ApiOperation({
    summary: "Renew a lease with a new end date and present value",
  })
  @Post(":id/renew")
  @Permissions("finance.leases.update")
  @TrackChanges("finance.leases.renew")
  renew(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(RenewSchema) body: z.infer<typeof RenewSchema>,
  ) {
    return this.svc.renewLease(
      this.tid(req),
      id,
      body.newEndDate,
      body.newPresentValue,
    );
  }
}
