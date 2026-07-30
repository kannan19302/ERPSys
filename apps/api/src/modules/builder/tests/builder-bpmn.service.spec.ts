// @ts-nocheck
import { BuilderBpmnService } from "../services/builder-bpmn.service";
import { BuilderBpmnModuleTest } from "./fixtures/builder-bpmn-module-test";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    bpmnProcessDefinition: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "bpmn-1" }),
      update: vi.fn().mockResolvedValue({ id: "bpmn-1" }),
      delete: vi.fn().mockResolvedValue({ id: "bpmn-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    bpmnTimerDefinition: {
      create: vi.fn().mockResolvedValue({ id: "timer-1" }),
    },
    bpmnProcessInstance: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "inst-1" }),
      update: vi.fn().mockResolvedValue({ id: "inst-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    bpmnActivityInstance: {
      create: vi.fn().mockResolvedValue({ id: "act-1" }),
    },
  },
}));

describe("BuilderBpmnService", () => {
  let service: BuilderBpmnService;

  beforeEach(() => {
    service = new BuilderBpmnService();
    vi.clearAllMocks();
  });

  it("getBpmnProcesses returns paginated results", async () => {
    const result = await service.getBpmnProcesses("t1");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
  });

  it("getBpmnProcessById throws on missing", async () => {
    await expect(service.getBpmnProcessById("t1", "none")).rejects.toThrow();
  });

  it("getBpmnProcessById returns found", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
    });
    const result = await service.getBpmnProcessById("t1", "bpmn-1");
    expect(result.id).toBe("bpmn-1");
  });

  it("createBpmnProcess succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue(null);
    const result = await service.createBpmnProcess("t1", {
      name: "Test",
      key: "test",
    });
    expect(result).toBeDefined();
  });

  it("createBpmnProcess rejects duplicate key", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
    });
    await expect(
      service.createBpmnProcess("t1", { name: "Test", key: "dup" }),
    ).rejects.toThrow();
  });

  it("updateBpmnProcess updates fields", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
    });
    const result = await service.updateBpmnProcess("t1", "bpmn-1", {
      name: "Updated",
    });
    expect(result).toBeDefined();
  });

  it("deleteBpmnProcess deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
    });
    const result = await service.deleteBpmnProcess("t1", "bpmn-1");
    expect(result).toBeDefined();
  });

  it("addGateway adds element", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
      elements: [],
    });
    const result = await service.addGateway("t1", "bpmn-1", { label: "GW" });
    expect(result).toBeDefined();
  });

  it("executeWorkflowInstance creates instance", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.bpmnProcessDefinition.findFirst as any).mockResolvedValue({
      id: "bpmn-1",
      elements: [{ id: "start1", type: "startEvent", label: "Start" }],
    });
    const result = await service.executeWorkflowInstance("t1", "bpmn-1", {});
    expect(result).toBeDefined();
  });

  it("getBpmnDashboard returns metrics", async () => {
    const result = await service.getBpmnDashboard("t1");
    expect(result).toHaveProperty("totalProcesses");
    expect(result).toHaveProperty("activeProcesses");
    expect(result).toHaveProperty("totalInstances");
    expect(result).toHaveProperty("runningInstances");
  });
});
