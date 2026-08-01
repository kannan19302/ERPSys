import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ReportingVersionsService } from "../reporting-versions.service";
import { ReportingSharesService } from "../reporting-shares.service";
import { ReportingBookmarksService } from "../reporting-bookmarks.service";
import { ReportingFilterPresetsService } from "../reporting-filter-presets.service";
import { ReportingAuditLogsService } from "../reporting-audit-logs.service";
import { ReportingAlertRulesService } from "../reporting-alert-rules.service";
import { ReportingColumnPreferencesService } from "../reporting-column-preferences.service";
import { ReportingCacheConfigService } from "../reporting-cache-config.service";
import { ReportingExecutionLogsService } from "../reporting-execution-logs.service";

describe("ReportingDeepServices", () => {
  let versionsService: ReportingVersionsService;
  let sharesService: ReportingSharesService;
  let bookmarksService: ReportingBookmarksService;
  let filterPresetsService: ReportingFilterPresetsService;
  let auditLogsService: ReportingAuditLogsService;
  let alertRulesService: ReportingAlertRulesService;
  let columnPrefsService: ReportingColumnPreferencesService;
  let cacheConfigService: ReportingCacheConfigService;
  let executionLogsService: ReportingExecutionLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingVersionsService,
        ReportingSharesService,
        ReportingBookmarksService,
        ReportingFilterPresetsService,
        ReportingAuditLogsService,
        ReportingAlertRulesService,
        ReportingColumnPreferencesService,
        ReportingCacheConfigService,
        ReportingExecutionLogsService,
      ],
    })
      .overrideProvider(ReportingVersionsService)
      .useValue({ getVersions: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingSharesService)
      .useValue({ getShares: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingBookmarksService)
      .useValue({ getBookmarks: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingFilterPresetsService)
      .useValue({ getPresets: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingAuditLogsService)
      .useValue({ getLogs: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingAlertRulesService)
      .useValue({ getRules: vi.fn().mockResolvedValue([]) })
      .overrideProvider(ReportingColumnPreferencesService)
      .useValue({ getPreferences: vi.fn().mockResolvedValue({}) })
      .overrideProvider(ReportingCacheConfigService)
      .useValue({ getConfig: vi.fn().mockResolvedValue({}) })
      .overrideProvider(ReportingExecutionLogsService)
      .useValue({ getLogs: vi.fn().mockResolvedValue([]) })
      .compile();

    versionsService = module.get(ReportingVersionsService);
    sharesService = module.get(ReportingSharesService);
    bookmarksService = module.get(ReportingBookmarksService);
    filterPresetsService = module.get(ReportingFilterPresetsService);
    auditLogsService = module.get(ReportingAuditLogsService);
    alertRulesService = module.get(ReportingAlertRulesService);
    columnPrefsService = module.get(ReportingColumnPreferencesService);
    cacheConfigService = module.get(ReportingCacheConfigService);
    executionLogsService = module.get(ReportingExecutionLogsService);
  });

  it("should be defined", () => {
    expect(versionsService).toBeDefined();
    expect(sharesService).toBeDefined();
    expect(bookmarksService).toBeDefined();
    expect(filterPresetsService).toBeDefined();
    expect(auditLogsService).toBeDefined();
    expect(alertRulesService).toBeDefined();
    expect(columnPrefsService).toBeDefined();
    expect(cacheConfigService).toBeDefined();
    expect(executionLogsService).toBeDefined();
  });

  it("versionsService.getVersions should return array", async () => {
    const result = await versionsService.getVersions("tenant-1", "report-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("sharesService.getShares should return array", async () => {
    const result = await sharesService.getShares("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("bookmarksService.getBookmarks should return array", async () => {
    const result = await bookmarksService.getBookmarks("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("alertRulesService.getRules should return array", async () => {
    const result = await alertRulesService.getRules("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("executionLogsService.getLogs should return array", async () => {
    const result = await executionLogsService.getLogs("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });
});
