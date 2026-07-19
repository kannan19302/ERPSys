import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingService } from "../onboarding.service";
import { DemoDataService } from "../demo-data.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// Mock the database client
vi.mock("@unerp/database", () => {
  const mockTenantUpdate = vi.fn();
  const mockTenantFindUnique = vi.fn();
  const mockOrgFindFirst = vi.fn();
  const mockCustomerCreate = vi.fn();
  const mockVendorCreate = vi.fn();
  const mockProductCreate = vi.fn();

  return {
    prisma: {
      tenant: {
        findUnique: mockTenantFindUnique,
        update: mockTenantUpdate,
      },
      organization: {
        findFirst: mockOrgFindFirst,
      },
      customer: {
        create: mockCustomerCreate,
      },
      vendor: {
        create: mockVendorCreate,
      },
      product: {
        create: mockProductCreate,
      },
      $transaction: vi.fn(async (cb) => {
        const tx = {
          $executeRaw: vi.fn().mockResolvedValue(1),
          customer: {
            create: mockCustomerCreate,
          },
          vendor: {
            create: mockVendorCreate,
          },
          product: {
            create: mockProductCreate,
          },
          tenant: {
            update: mockTenantUpdate,
          },
        };
        return cb(tx);
      }),
    },
  };
});

// Helper to access mock functions
import { prisma } from "@unerp/database";
const tenantMocks = prisma.tenant as any;
const orgMocks = prisma.organization as any;

describe("OnboardingService", () => {
  let service: OnboardingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OnboardingService();
  });

  describe("getOnboardingState", () => {
    it("should throw NotFoundException if tenant does not exist", async () => {
      tenantMocks.findUnique.mockResolvedValue(null);
      await expect(service.getOnboardingState("t-none")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should initialize default onboarding checklist if none exists", async () => {
      tenantMocks.findUnique.mockResolvedValue({
        id: "t1",
        settings: {},
      });
      tenantMocks.update.mockResolvedValue({
        id: "t1",
        settings: {
          onboardingChecklist: {
            profile: false,
            logo: false,
            invite: false,
            app: false,
            plan: false,
            dashboard: false,
          },
        },
      });

      const res = await service.getOnboardingState("t1");
      expect(res.profile).toBe(false);
      expect(tenantMocks.update).toHaveBeenCalled();
    });

    it("should return existing checklist if already present in settings", async () => {
      tenantMocks.findUnique.mockResolvedValue({
        id: "t1",
        settings: {
          onboardingChecklist: {
            profile: true,
            logo: false,
            invite: false,
            app: false,
            plan: false,
            dashboard: false,
          },
        },
      });

      const res = await service.getOnboardingState("t1");
      expect(res.profile).toBe(true);
      expect(tenantMocks.update).not.toHaveBeenCalled();
    });
  });

  describe("completeStep", () => {
    it("should throw BadRequestException if step key is invalid", async () => {
      await expect(service.completeStep("t1", "invalid-key")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should mark the specified step as true in the checklist", async () => {
      tenantMocks.findUnique.mockResolvedValue({
        id: "t1",
        settings: {
          onboardingChecklist: {
            profile: false,
            logo: false,
            invite: false,
            app: false,
            plan: false,
            dashboard: false,
          },
        },
      });

      await service.completeStep("t1", "profile");
      expect(tenantMocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t1" },
          data: {
            settings: expect.objectContaining({
              onboardingChecklist: expect.objectContaining({
                profile: true,
              }),
            }),
          },
        }),
      );
    });
  });
});

describe("DemoDataService", () => {
  let service: DemoDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DemoDataService();
  });

  it("should seed sandbox records based on the industry selection", async () => {
    tenantMocks.findUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: false,
      settings: {
        industry: "healthcare",
      },
    });

    orgMocks.findFirst.mockResolvedValue({
      id: "o1",
    });

    const res = await service.seedDemoData("t1");
    expect(res.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tenantMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({
          demoDataLoaded: true,
        }),
      }),
    );
  });

  it("should throw BadRequestException if demo data has already been loaded", async () => {
    tenantMocks.findUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: true,
      settings: {},
    });

    await expect(service.seedDemoData("t1")).rejects.toThrow(
      BadRequestException,
    );
  });
});
