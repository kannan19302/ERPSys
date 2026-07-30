// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { LocalizationGlossaryService } from "../localization-glossary.service";
import { LocalizationContextService } from "../localization-context.service";
import { LocalizationMtService } from "../localization-mt.service";
import { LocalizationMemoryService } from "../localization-memory.service";
import { LocalizationFallbackService } from "../localization-fallback.service";
import { LocalizationRegionValidationService } from "../localization-region-validation.service";
import { LocalizationContentScheduleService } from "../localization-content-schedule.service";
import { LocalizationReviewService } from "../localization-review.service";

describe("LocalizationDeepServices", () => {
  let glossaryService: LocalizationGlossaryService;
  let contextService: LocalizationContextService;
  let mtService: LocalizationMtService;
  let memoryService: LocalizationMemoryService;
  let fallbackService: LocalizationFallbackService;
  let regionValidationService: LocalizationRegionValidationService;
  let contentScheduleService: LocalizationContentScheduleService;
  let reviewService: LocalizationReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalizationGlossaryService,
        LocalizationContextService,
        LocalizationMtService,
        LocalizationMemoryService,
        LocalizationFallbackService,
        LocalizationRegionValidationService,
        LocalizationContentScheduleService,
        LocalizationReviewService,
      ],
    })
      .overrideProvider(LocalizationGlossaryService)
      .useValue({ getGlossary: vi.fn().mockResolvedValue([]) })
      .overrideProvider(LocalizationContextService)
      .useValue({ getContexts: vi.fn().mockResolvedValue([]) })
      .overrideProvider(LocalizationMtService)
      .useValue({
        translate: vi.fn().mockResolvedValue({ translatedText: "hello" }),
      })
      .overrideProvider(LocalizationMemoryService)
      .useValue({ findMatches: vi.fn().mockResolvedValue([]) })
      .overrideProvider(LocalizationFallbackService)
      .useValue({ getFallbackRules: vi.fn().mockResolvedValue([]) })
      .overrideProvider(LocalizationRegionValidationService)
      .useValue({ validateRegion: vi.fn().mockResolvedValue({ valid: true }) })
      .overrideProvider(LocalizationContentScheduleService)
      .useValue({ getSchedules: vi.fn().mockResolvedValue([]) })
      .overrideProvider(LocalizationReviewService)
      .useValue({ getReviews: vi.fn().mockResolvedValue([]) })
      .compile();

    glossaryService = module.get(LocalizationGlossaryService);
    contextService = module.get(LocalizationContextService);
    mtService = module.get(LocalizationMtService);
    memoryService = module.get(LocalizationMemoryService);
    fallbackService = module.get(LocalizationFallbackService);
    regionValidationService = module.get(LocalizationRegionValidationService);
    contentScheduleService = module.get(LocalizationContentScheduleService);
    reviewService = module.get(LocalizationReviewService);
  });

  it("should be defined", () => {
    expect(glossaryService).toBeDefined();
    expect(contextService).toBeDefined();
    expect(mtService).toBeDefined();
    expect(memoryService).toBeDefined();
    expect(fallbackService).toBeDefined();
    expect(regionValidationService).toBeDefined();
    expect(contentScheduleService).toBeDefined();
    expect(reviewService).toBeDefined();
  });

  it("glossaryService.getGlossary should return array", async () => {
    const result = await glossaryService.getGlossary("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("contextService.getContexts should return array", async () => {
    const result = await contextService.getContexts("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("mtService.translate should return translated text", async () => {
    const result = await mtService.translate("hello", "en", "es");
    expect(result.translatedText).toBe("hello");
  });

  it("fallbackService.getFallbackRules should return array", async () => {
    const result = await fallbackService.getFallbackRules("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("contentScheduleService.getSchedules should return array", async () => {
    const result = await contentScheduleService.getSchedules("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });
});
