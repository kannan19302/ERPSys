import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { FreightManagementService } from "../services/freight-management.service";
import { SupplierCollaborationService } from "../services/supplier-collaboration.service";
import { SupplyNetworkRiskService } from "../services/supply-network-risk.service";
import { ScmControlTowerService } from "../services/scm-control-tower.service";

describe("SupplyChainExpansionServices", () => {
  let freightSvc: FreightManagementService;
  let supplierSvc: SupplierCollaborationService;
  let riskSvc: SupplyNetworkRiskService;
  let controlTowerSvc: ScmControlTowerService;

  const tenantId = "tenant-test-123";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightManagementService,
        SupplierCollaborationService,
        SupplyNetworkRiskService,
        ScmControlTowerService,
      ],
    }).compile();

    freightSvc = module.get<FreightManagementService>(FreightManagementService);
    supplierSvc = module.get<SupplierCollaborationService>(
      SupplierCollaborationService,
    );
    riskSvc = module.get<SupplyNetworkRiskService>(SupplyNetworkRiskService);
    controlTowerSvc = module.get<ScmControlTowerService>(
      ScmControlTowerService,
    );
  });

  describe("FreightManagementService", () => {
    it("should list freight orders with pagination defaults", async () => {
      const result = await freightSvc.listFreightOrders(tenantId, {});
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should list freight rates", async () => {
      const rates = await freightSvc.getFreightRates(tenantId);
      expect(rates).toBeDefined();
      expect(rates.length).toBeGreaterThan(0);
    });

    it("should calculate freight rate based on distance and weight", async () => {
      const calc = await freightSvc.calculateFreightRate(tenantId, {
        origin: "NY",
        destination: "LA",
        weightKg: 100,
        distanceKm: 500,
      });
      expect(calc).toBeDefined();
      expect(calc.totalCost).toBeGreaterThan(0);
      expect(calc.recommendedCarrier).toBeDefined();
    });

    it("should record and list tracking events", async () => {
      const event = await freightSvc.addTrackingEvent(tenantId, "freight-1", {
        location: "Chicago DC",
        status: "IN_TRANSIT",
        description: "Package scanned at hub",
        recordedBy: "user-1",
      });
      expect(event.id).toBeDefined();
      expect(event.status).toBe("IN_TRANSIT");

      const events = await freightSvc.getTrackingHistory(tenantId, "freight-1");
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe("SupplierCollaborationService", () => {
    it("should fetch supplier purchase orders", async () => {
      const pos = await supplierSvc.getSupplierPurchaseOrders(tenantId);
      expect(pos).toBeDefined();
      expect(Array.isArray(pos)).toBe(true);
    });

    it("should calculate supplier scorecards", async () => {
      const scorecards = await supplierSvc.getSupplierScorecards(tenantId);
      expect(scorecards).toBeDefined();
      expect(Array.isArray(scorecards)).toBe(true);
    });

    it("should create and retrieve collaboration thread", async () => {
      const thread = await supplierSvc.createThread(tenantId, {
        supplierId: "vendor-1",
        supplierName: "Acme Corp",
        subject: "Delivery Delay Query",
        initialMessage: "Where is shipment #102?",
        authorId: "user-1",
        authorName: "Buyer Bob",
        isSupplier: false,
      });
      expect(thread.id).toBeDefined();
      expect(thread.subject).toBe("Delivery Delay Query");

      const msg = await supplierSvc.addMessage(tenantId, thread.id, {
        content: "Shipment is delayed due to weather",
        authorId: "vendor-user-1",
        authorName: "Vendor Rep",
        isSupplier: true,
      });
      expect(msg.content).toBe("Shipment is delayed due to weather");

      const updatedThread = await supplierSvc.getThread(tenantId, thread.id);
      expect(updatedThread.messages.length).toBe(2);
    });
  });

  describe("SupplyNetworkRiskService", () => {
    it("should list risk events", async () => {
      const events = await riskSvc.listRiskEvents(tenantId);
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it("should create risk event and calculate impact", async () => {
      const event = await riskSvc.createRiskEvent(tenantId, {
        title: "Port Strike",
        description: "Port of Long Beach congestion",
        category: "LOGISTICS",
        severity: "HIGH",
        estimatedImpact: 50000,
        reportedBy: "user-1",
      });
      expect(event.id).toBeDefined();
      expect(event.severity).toBe("HIGH");

      const ack = await riskSvc.acknowledgeRiskEvent(
        tenantId,
        event.id,
        "user-2",
      );
      expect(ack.status).toBe("ACKNOWLEDGED");
    });

    it("should retrieve network topology nodes", async () => {
      const nodes = await riskSvc.getNetworkNodes(tenantId);
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe("ScmControlTowerService", () => {
    it("should return unified control tower dashboard payload", async () => {
      const dash = await controlTowerSvc.getDashboard(tenantId);
      expect(dash.summary).toBeDefined();
      expect(dash.kpis).toBeDefined();
      expect(dash.kpis.onTimeInFull).toBeGreaterThanOrEqual(0);
    });

    it("should return detailed KPI metrics", async () => {
      const kpis = await controlTowerSvc.getKpis(tenantId);
      expect(kpis.onTimeInFull.target).toBe(95);
      expect(kpis.history.onTimeInFull.length).toBe(6);
    });
  });
});
