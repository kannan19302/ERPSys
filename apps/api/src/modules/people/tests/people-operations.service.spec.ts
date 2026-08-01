import { describe, it, expect, beforeEach, vi } from "vitest";
import { PeopleOperationsService } from "../people-operations.service";

describe("PeopleOperationsService", () => {
  let service: PeopleOperationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      peopleOnboardingTask: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "tsk-1", employeeId: "emp-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "tsk-1", ...data }),
          ),
      },
      peopleTimeOffRequest: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "tof-1", employeeId: "emp-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "tof-1", ...data }),
          ),
      },
      peoplePeerRecognition: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "rec-1", receiverId: "emp-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "rec-1", ...data }),
          ),
      },
    };
    service = new PeopleOperationsService(mockPrisma);
  });

  it("should list onboarding tasks", async () => {
    const result = await service.getOnboardingTasks("tenant-1", {
      employeeId: "emp-1",
    });
    expect(result).toHaveLength(1);
  });

  it("should create onboarding task", async () => {
    const data = { employeeId: "emp-1", title: "Setup Workstation Laptop" };
    const result = await service.createOnboardingTask("tenant-1", data);
    expect(result.title).toBe("Setup Workstation Laptop");
    expect(result.status).toBe("PENDING");
  });

  it("should create time off request", async () => {
    const data = {
      employeeId: "emp-1",
      leaveType: "VACATION",
      startDate: "2026-08-10",
      endDate: "2026-08-15",
      days: 5,
    };
    const result = await service.createTimeOffRequest("tenant-1", data);
    expect(result.days).toBe(5);
    expect(result.status).toBe("PENDING");
  });

  it("should create peer recognition", async () => {
    const data = {
      giverId: "emp-1",
      receiverId: "emp-2",
      badge: "HERO",
      message: "Great support on outage!",
    };
    const result = await service.createPeerRecognition("tenant-1", data);
    expect(result.badge).toBe("HERO");
    expect(result.points).toBe(10);
  });
});
