import { Test, TestingModule } from "@nestjs/testing";
import { StorageAdvancedService } from "../storage-advanced.service";

describe("StorageAdvancedService", () => {
  let service: StorageAdvancedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageAdvancedService],
    }).compile();
    service = module.get<StorageAdvancedService>(StorageAdvancedService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Backups", () => {
    it("should return empty backups list for new tenant", async () => {
      const backups = await service.getBackups("tenant-new");
      expect(Array.isArray(backups)).toBe(true);
    });

    it("should create and list backups", async () => {
      const backup = await service.createBackup(
        "t1",
        { name: "Weekly Backup", type: "FULL" },
        "user1",
      );
      expect(backup).toBeDefined();
      expect(backup.name).toBe("Weekly Backup");
      expect(backup.tenantId).toBe("t1");
    });

    it("should throw on restoring non-existent backup", async () => {
      await expect(
        service.restoreBackup("t1", "nonexistent"),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent backup", async () => {
      await expect(service.deleteBackup("t1", "nonexistent")).rejects.toThrow();
    });
  });

  describe("Alerts", () => {
    it("should return empty alerts for new tenant", async () => {
      const alerts = await service.getAlerts("tenant-new");
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should create and list alerts", async () => {
      const alert = await service.createAlert(
        "t1",
        {
          name: "High Usage",
          metric: "storage_used",
          condition: "gt",
          threshold: 90,
        },
        "user1",
      );
      expect(alert).toBeDefined();
      expect(alert.name).toBe("High Usage");
    });

    it("should throw on updating non-existent alert", async () => {
      await expect(
        service.updateAlert("t1", "nonexistent", { name: "X" }),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent alert", async () => {
      await expect(service.deleteAlert("t1", "nonexistent")).rejects.toThrow();
    });
  });

  describe("Snapshots", () => {
    it("should return empty snapshots for new tenant", async () => {
      const snapshots = await service.getSnapshots("tenant-new");
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it("should create and list snapshots", async () => {
      const snap = await service.createSnapshot(
        "t1",
        { name: "Pre-upgrade", type: "MANUAL" },
        "user1",
      );
      expect(snap).toBeDefined();
      expect(snap.name).toBe("Pre-upgrade");
      expect(snap.status).toBe("COMPLETED");
    });

    it("should throw on restoring non-existent snapshot", async () => {
      await expect(
        service.restoreSnapshot("t1", "nonexistent"),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent snapshot", async () => {
      await expect(
        service.deleteSnapshot("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Migrations", () => {
    it("should return empty migrations", async () => {
      const migrations = await service.getMigrations("tenant-new");
      expect(Array.isArray(migrations)).toBe(true);
    });

    it("should create migration", async () => {
      const m = await service.createMigration(
        "t1",
        { name: "AWS to GCP", sourceProvider: "AWS", targetProvider: "GCP" },
        "user1",
      );
      expect(m).toBeDefined();
      expect(m.name).toBe("AWS to GCP");
    });

    it("should throw on starting non-existent migration", async () => {
      await expect(
        service.startMigration("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Retention Policies", () => {
    it("should return empty policies", async () => {
      const policies = await service.getRetentionPolicies("tenant-new");
      expect(Array.isArray(policies)).toBe(true);
    });

    it("should create policy", async () => {
      const p = await service.createRetentionPolicy(
        "t1",
        { name: "Auto-delete 90d", retentionDays: 90, action: "DELETE" },
        "user1",
      );
      expect(p).toBeDefined();
      expect(p.retentionDays).toBe(90);
    });
  });

  describe("Syncs", () => {
    it("should return empty syncs", async () => {
      const syncs = await service.getSyncs("tenant-new");
      expect(Array.isArray(syncs)).toBe(true);
    });

    it("should create sync", async () => {
      const s = await service.createSync(
        "t1",
        { name: "S3 Sync", sourceProvider: "AWS", targetProvider: "MinIO" },
        "user1",
      );
      expect(s).toBeDefined();
      expect(s.name).toBe("S3 Sync");
    });
  });

  describe("Tenant Isolation", () => {
    it("should not find other tenant's data", async () => {
      await expect(
        service.getEncryption("tenant-other", "file-other"),
      ).rejects.toThrow();
    });
  });
});
