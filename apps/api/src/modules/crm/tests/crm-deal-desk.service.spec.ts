import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmDealDeskService } from "../crm-deal-desk.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    opportunity: { findFirst: vi.fn(), findMany: vi.fn() },
    dealDeskRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    dealAlert: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    dealAutomationRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";
const ORG = "org-1";
const emit = vi.fn();
const mockEmitter = {
  emit,
} as unknown as import("@nestjs/event-emitter").EventEmitter2;

describe("CrmDealDeskService", () => {
  let service: CrmDealDeskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmDealDeskService(mockEmitter);
  });

  describe("getDealDeskRequests", () => {
    it("returns paginated requests with opportunity info", async () => {
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "req-1",
          opportunity: { id: "opp-1", name: "Big Deal", amount: 50000 },
        },
      ]);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(1);

      const result = await service.getDealDeskRequests(TENANT, {
        page: 1,
        limit: 50,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].opportunity.name).toBe("Big Deal");
    });

    it("filters by status when provided", async () => {
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);

      await service.getDealDeskRequests(TENANT, { status: "PENDING" });

      expect(prisma.dealDeskRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PENDING" }),
        }),
      );
    });
  });

  describe("createDealDeskRequest", () => {
    it("creates a request for a valid opportunity", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "opp-1", deletedAt: null });
      (
        prisma.dealDeskRequest.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "PENDING" });

      const result = await service.createDealDeskRequest(TENANT, ORG, {
        opportunityId: "opp-1",
        requestType: "DISCOUNT",
        description: "Need 10% off",
        discountRequest: 10,
        justification: "Competitive pressure",
        assignedById: "user-1",
      });

      expect(prisma.dealDeskRequest.create).toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(
        "crm.deal-desk.request_created",
        expect.objectContaining({ requestId: "req-1" }),
      );
      expect(result.status).toBe("PENDING");
    });

    it("throws if opportunity not found", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        service.createDealDeskRequest(TENANT, ORG, {
          opportunityId: "bad-id",
          requestType: "DISCOUNT",
        }),
      ).rejects.toThrow("Opportunity not found");
    });
  });

  describe("approveDealDeskRequest", () => {
    it("approves a pending request", async () => {
      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "PENDING", tenantId: TENANT });
      (
        prisma.dealDeskRequest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "APPROVED" });

      const result = await service.approveDealDeskRequest(TENANT, "req-1", {
        reviewedBy: "manager-1",
      });

      expect(prisma.dealDeskRequest.update).toHaveBeenCalled();
      expect(result.status).toBe("APPROVED");
    });

    it("throws if request is not pending", async () => {
      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "req-1",
        status: "APPROVED",
        tenantId: TENANT,
      });

      await expect(
        service.approveDealDeskRequest(TENANT, "req-1", {
          reviewedBy: "manager-1",
        }),
      ).rejects.toThrow("Request is not pending");
    });
  });

  describe("rejectDealDeskRequest", () => {
    it("rejects a pending request", async () => {
      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "PENDING", tenantId: TENANT });
      (
        prisma.dealDeskRequest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "REJECTED" });

      const result = await service.rejectDealDeskRequest(TENANT, "req-1", {
        reviewedBy: "manager-1",
      });

      expect(result.status).toBe("REJECTED");
    });
  });

  describe("requestMoreInfo / provideMoreInfo", () => {
    it("sets status to MORE_INFO and updates justification on provide", async () => {
      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "req-1",
        status: "PENDING",
        tenantId: TENANT,
      });
      (
        prisma.dealDeskRequest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: "req-1", status: "MORE_INFO" });

      await service.requestMoreInfo(TENANT, "req-1", {
        reviewedBy: "manager-1",
        reviewNotes: "Need more details",
      });

      expect(prisma.dealDeskRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "MORE_INFO" }),
        }),
      );

      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "req-1",
        status: "MORE_INFO",
        tenantId: TENANT,
      });
      (
        prisma.dealDeskRequest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: "req-1", status: "PENDING" });

      const result = await service.provideMoreInfo(TENANT, "req-1", {
        justification: "Updated details",
      });

      expect(result.status).toBe("PENDING");
    });
  });

  describe("escalateDealDeskRequest", () => {
    it("escalates and sets priority to URGENT", async () => {
      (
        prisma.dealDeskRequest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", status: "PENDING", tenantId: TENANT });
      (
        prisma.dealDeskRequest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "req-1", escalatedTo: "vp-sales" });

      const result = await service.escalateDealDeskRequest(TENANT, "req-1", {
        escalatedTo: "vp-sales",
      });

      expect(prisma.dealDeskRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalatedTo: "vp-sales",
            priority: "URGENT",
          }),
        }),
      );
    });
  });

  describe("getDealDeskStats", () => {
    it("returns aggregate statistics", async () => {
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(50); // total
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(20); // pending
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(15); // approved
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(10); // rejected
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(5); // moreInfo
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(8); // urgent
      (
        prisma.dealDeskRequest.groupBy as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ requestType: "DISCOUNT", _count: { id: 30 } }]);
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          createdAt: new Date("2026-01-01"),
          decisionAt: new Date("2026-01-03"),
        },
      ]);

      const result = await service.getDealDeskStats(TENANT);

      expect(result.total).toBe(50);
      expect(result.pending).toBe(20);
      expect(result.approved).toBe(15);
      expect(result.rejected).toBe(10);
      expect(result.urgent).toBe(8);
      expect(result.avgResponseHours).toBeGreaterThan(0);
    });
  });

  describe("deal alerts", () => {
    it("creates and acknowledges alerts", async () => {
      (prisma.dealAlert.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "alert-1",
        message: "Test alert",
      });
      (
        prisma.dealAlert.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "alert-1",
        status: "OPEN",
        tenantId: TENANT,
      });
      (prisma.dealAlert.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "alert-1",
        status: "ACKNOWLEDGED",
      });

      const created = await service.createDealAlert(TENANT, ORG, {
        opportunityId: "opp-1",
        alertType: "STAGE_STALL",
        severity: "WARNING",
        message: "Deal stalled",
      });
      expect(created.id).toBe("alert-1");
      expect(emit).toHaveBeenCalledWith(
        "crm.deal-desk.alert_created",
        expect.objectContaining({ alertId: "alert-1" }),
      );

      const acknowledged = await service.acknowledgeDealAlert(
        TENANT,
        "alert-1",
        "user-1",
      );
      expect(acknowledged.status).toBe("ACKNOWLEDGED");
    });
  });

  describe("automation rules CRUD", () => {
    it("creates, updates, deletes, and evaluates rules", async () => {
      (
        prisma.dealAutomationRule.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "rule-1", name: "Test Rule" });
      (
        prisma.dealAutomationRule.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.dealAutomationRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: "rule-1", tenantId: TENANT });
      (
        prisma.dealAutomationRule.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "rule-1", isActive: false });
      (
        prisma.dealAutomationRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: "rule-1", tenantId: TENANT });
      (
        prisma.dealAutomationRule.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "rule-1" });

      const created = await service.createDealAutomationRule(TENANT, {
        name: "Test Rule",
        triggerEvent: "STAGE_CHANGE",
        conditions: [
          { field: "stage", operator: "equals", value: "NEGOTIATION" },
        ],
        actions: [{ type: "notify", value: "manager" }],
      });
      expect(created.id).toBe("rule-1");

      const rules = await service.getDealAutomationRules(TENANT);
      expect(Array.isArray(rules)).toBe(true);

      const updated = await service.updateDealAutomationRule(TENANT, "rule-1", {
        isActive: false,
      });
      expect(updated.isActive).toBe(false);

      await service.deleteDealAutomationRule(TENANT, "rule-1");
      expect(prisma.dealAutomationRule.delete).toHaveBeenCalledWith({
        where: { id: "rule-1" },
      });
    });

    it("evaluates rules against an opportunity", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "opp-1", stage: "NEGOTIATION", amount: 50000 });
      (
        prisma.dealAutomationRule.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "rule-1",
          name: "Notify on negotiation",
          isActive: true,
          priority: 0,
          conditions: [
            { field: "stage", operator: "equals", value: "NEGOTIATION" },
          ],
          actions: [{ type: "notify", value: "manager-1" }],
        },
      ]);

      const result = await service.evaluateAutomationRules(TENANT, "opp-1");

      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesTriggered).toBe(1);
      expect(result.triggered[0].ruleName).toBe("Notify on negotiation");
    });
  });

  describe("getDiscountApprovalMatrix", () => {
    it("returns role-based discount thresholds", async () => {
      (idpPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      const result = await service.getDiscountApprovalMatrix(TENANT);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("role");
      expect(result[0]).toHaveProperty("maxDiscountPct");
    });
  });

  describe("getDealDeskDashboard", () => {
    it("returns dashboard summary with stats and recent activity", async () => {
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
      (
        prisma.dealDeskRequest.groupBy as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.dealDeskRequest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.getDealDeskDashboard(TENANT);

      expect(result).toHaveProperty("stats");
      expect(result).toHaveProperty("openRequests");
      expect(result).toHaveProperty("recentActivity");
    });
  });
});
