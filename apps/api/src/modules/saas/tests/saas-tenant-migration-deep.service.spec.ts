// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SaasTenantMigrationDeepService } from "../saas-tenant-migration-deep.service";

describe("SaasTenantMigrationDeepService", () => {
  let service: SaasTenantMigrationDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasTenantMigrationDeepService],
    }).compile();

    service = module.get<SaasTenantMigrationDeepService>(
      SaasTenantMigrationDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("startMigration", () => {
    it("should initiate cluster migration job", async () => {
      const res = await service.startMigration("t1", {
        sourceCluster: "c1",
        targetCluster: "c2",
      });
      expect(res.status).toBe("IN_PROGRESS");
      expect(res.sourceCluster).toBe("c1");
    });
  });
});
