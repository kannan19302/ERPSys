import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "../storage.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    storageFolder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    storedFile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    storageFileVersion: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    storageShareLink: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    storageQuota: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    generatedDocument: { findMany: vi.fn(), create: vi.fn() },
  },
}));

describe("StorageService", () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    vi.clearAllMocks();
  });

  it("should get folders", async () => {
    const mockFolders = [
      { id: "1", name: "Test", path: "/Test", tenantId: "t1" },
    ];
    (prisma.storageFolder.findMany as any).mockResolvedValue(mockFolders);
    const result = await service.getFolders("t1");
    expect(result).toEqual(mockFolders);
    expect(prisma.storageFolder.findMany).toHaveBeenCalledWith({
      where: { tenantId: "t1", parentId: null },
      orderBy: { name: "asc" },
    });
  });

  it("should create a folder", async () => {
    const mockFolder = {
      id: "1",
      name: "NewFolder",
      path: "/NewFolder",
      tenantId: "t1",
    };
    (prisma.storageFolder.create as any).mockResolvedValue(mockFolder);
    (prisma.storageQuota.findUnique as any).mockResolvedValue(null);
    (prisma.storageQuota.create as any).mockResolvedValue({});
    (prisma.storageQuota.update as any).mockResolvedValue({});
    const result = await service.createFolder(
      "t1",
      { name: "NewFolder" },
      "u1",
    );
    expect(result).toEqual(mockFolder);
  });

  it("should throw on delete non-empty folder", async () => {
    (prisma.storageFolder.findFirst as any).mockResolvedValue({
      id: "1",
      tenantId: "t1",
    });
    (prisma.storedFile.count as any).mockResolvedValue(1);
    await expect(service.deleteFolder("t1", "1")).rejects.toThrow(
      "Folder is not empty",
    );
  });

  it("should register a file", async () => {
    const mockFile = { id: "1", name: "test.pdf", size: 1000, tenantId: "t1" };
    (prisma.storedFile.create as any).mockResolvedValue(mockFile);
    (prisma.storageQuota.findUnique as any).mockResolvedValue(null);
    (prisma.storageQuota.create as any).mockResolvedValue({});
    (prisma.storageQuota.update as any).mockResolvedValue({});
    const result = await service.registerFile(
      "t1",
      {
        name: "test.pdf",
        bucket: "b1",
        fileKey: "k1",
        size: 1000,
        mimeType: "application/pdf",
      },
      "u1",
    );
    expect(result).toEqual(mockFile);
  });

  it("should create share link", async () => {
    (prisma.storedFile.findFirst as any).mockResolvedValue({
      id: "f1",
      name: "test.pdf",
      tenantId: "t1",
    });
    const mockLink = {
      id: "l1",
      token: "abc123",
      tenantId: "t1",
      fileId: "f1",
    };
    (prisma.storageShareLink.create as any).mockResolvedValue(mockLink);
    const result = await service.createShareLink(
      "t1",
      { fileId: "f1", permission: "VIEW" },
      "u1",
    );
    expect(result).toEqual(mockLink);
  });
});
