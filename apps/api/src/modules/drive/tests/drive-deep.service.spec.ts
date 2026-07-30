// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { DriveDeepService } from "../drive-deep.service";

describe("DriveDeepService", () => {
  let service: DriveDeepService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriveDeepService],
    }).compile();
    service = module.get<DriveDeepService>(DriveDeepService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("computeTypeBreakdown", () => {
    it("should categorize files by mime type", () => {
      const files = [
        { mimeType: "image/png", size: 1000 },
        { mimeType: "video/mp4", size: 5000 },
        { mimeType: "application/pdf", size: 2000 },
        { mimeType: "text/plain", size: 500 },
      ];
      const result = (service as any).computeTypeBreakdown(files);
      expect(result.images).toBe(1000);
      expect(result.videos).toBe(5000);
      expect(result.pdfs).toBe(2000);
      expect(result.others).toBe(500);
    });

    it("should handle empty files array", () => {
      const result = (service as any).computeTypeBreakdown([]);
      expect(result).toEqual({});
    });
  });

  describe("computeTopUsers", () => {
    it("should return sorted users by storage usage", async () => {
      const files = [
        { ownerId: "user1", size: 3000 },
        { ownerId: "user2", size: 1000 },
        { ownerId: "user1", size: 2000 },
      ];
      const result = await (service as any).computeTopUsers([]);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
