import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    userPresence: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    loginHistory: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { PeopleService } from "../people.service";

describe("PeopleService", () => {
  let service: PeopleService;

  beforeEach(() => {
    service = new PeopleService();
    vi.clearAllMocks();
  });

  describe("getOrCreateProfile", () => {
    it("auto-provisions a profile with a 6-digit employee id on first access", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce(null); // getOrCreateProfile lookup
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce(null); // employeeId collision check
      vi.mocked(prisma.userProfile.create).mockResolvedValue({
        id: "p1",
        tenantId: "t1",
        userId: "u1",
        employeeId: "123456",
      } as never);

      const profile = await service.getOrCreateProfile("t1", "u1");
      expect(profile.employeeId).toMatch(/^\d{6}$/);
      expect(prisma.userProfile.create).toHaveBeenCalledTimes(1);
    });

    it("returns the existing profile without creating a new one", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce({
        id: "p1",
        userId: "u1",
        employeeId: "111222",
      } as never);

      const profile = await service.getOrCreateProfile("t1", "u1");
      expect(profile.employeeId).toBe("111222");
      expect(prisma.userProfile.create).not.toHaveBeenCalled();
    });
  });

  describe("updateMyProfile — manager assignment", () => {
    it("rejects setting yourself as your own manager", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "p1",
        userId: "u1",
        employeeId: "111222",
      } as never);

      await expect(
        service.updateMyProfile("t1", "u1", { managerId: "u1" }),
      ).rejects.toThrow("cannot be your own manager");
    });

    it("rejects a manager that does not exist in the tenant", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "p1",
        userId: "u1",
        employeeId: "111222",
      } as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(
        service.updateMyProfile("t1", "u1", { managerId: "ghost" }),
      ).rejects.toThrow("Manager not found");
    });

    it("rejects a manager assignment that would create a reporting cycle", async () => {
      // u1 -> getOrCreateProfile (self)
      vi.mocked(prisma.userProfile.findUnique).mockImplementation(
        (args: any) => {
          const where = args.where;
          if (where.userId === "u1") {
            return Promise.resolve({
              id: "p1",
              userId: "u1",
              employeeId: "111222",
            } as never);
          }
          // u2's manager is u1 -> cycle: u1 wants u2 as manager, but u2 already reports to u1
          if (where.userId === "u2") {
            return Promise.resolve({ managerId: "u1" } as never);
          }
          return Promise.resolve(null);
        },
      );
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "u2" } as never);

      await expect(
        service.updateMyProfile("t1", "u1", { managerId: "u2" }),
      ).rejects.toThrow("circular reporting line");
    });

    it("accepts a valid manager assignment with no cycle", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockImplementation(
        (args: any) => {
          const where = args.where;
          if (where.userId === "u1") {
            return Promise.resolve({
              id: "p1",
              userId: "u1",
              employeeId: "111222",
            } as never);
          }
          if (where.userId === "u2") {
            return Promise.resolve({ managerId: null } as never);
          }
          return Promise.resolve(null);
        },
      );
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "u2" } as never);
      vi.mocked(prisma.userProfile.update).mockResolvedValue({
        id: "p1",
        managerId: "u2",
      } as never);

      const result = await service.updateMyProfile("t1", "u1", {
        managerId: "u2",
      });
      expect(result.managerId).toBe("u2");
    });
  });

  describe("uploadPronunciation", () => {
    it("rejects a recording that is too long", async () => {
      const oversized = "data:audio/webm;base64," + "A".repeat(600_000);
      await expect(
        service.uploadPronunciation("t1", "u1", oversized),
      ).rejects.toThrow("too long");
    });
  });
});
