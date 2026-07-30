// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ReportingBookmarksService } from "../reporting-bookmarks.service";
import { ReportingSharesService } from "../reporting-shares.service";
import { ReportingVersionsService } from "../reporting-versions.service";
import { ReportingExecutionLogsService } from "../reporting-execution-logs.service";
import { ReportingDataSourcesService } from "../reporting-data-sources.service";
import { ReportingCacheConfigService } from "../reporting-cache-config.service";
import { ReportingAlertRulesService } from "../reporting-alert-rules.service";
import { ReportingAuditLogsService } from "../reporting-audit-logs.service";
import { ReportingFilterPresetsService } from "../reporting-filter-presets.service";
import { ReportingColumnPreferencesService } from "../reporting-column-preferences.service";

describe("ReportingAdminDeepServices", () => {
  let bookmarksService: ReportingBookmarksService;
  let sharesService: ReportingSharesService;
  let versionsService: ReportingVersionsService;
  let execLogsService: ReportingExecutionLogsService;
  let dataSourcesService: ReportingDataSourcesService;
  let cacheConfigService: ReportingCacheConfigService;
  let alertRulesService: ReportingAlertRulesService;
  let auditLogsService: ReportingAuditLogsService;
  let filterPresetsService: ReportingFilterPresetsService;
  let colPrefsService: ReportingColumnPreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingBookmarksService,
        ReportingSharesService,
        ReportingVersionsService,
        ReportingExecutionLogsService,
        ReportingDataSourcesService,
        ReportingCacheConfigService,
        ReportingAlertRulesService,
        ReportingAuditLogsService,
        ReportingFilterPresetsService,
        ReportingColumnPreferencesService,
      ],
    }).compile();
    bookmarksService = module.get(ReportingBookmarksService);
    sharesService = module.get(ReportingSharesService);
    versionsService = module.get(ReportingVersionsService);
    execLogsService = module.get(ReportingExecutionLogsService);
    dataSourcesService = module.get(ReportingDataSourcesService);
    cacheConfigService = module.get(ReportingCacheConfigService);
    alertRulesService = module.get(ReportingAlertRulesService);
    auditLogsService = module.get(ReportingAuditLogsService);
    filterPresetsService = module.get(ReportingFilterPresetsService);
    colPrefsService = module.get(ReportingColumnPreferencesService);
  });

  it("should be defined", () => {
    expect(bookmarksService).toBeDefined();
    expect(sharesService).toBeDefined();
    expect(versionsService).toBeDefined();
    expect(execLogsService).toBeDefined();
    expect(dataSourcesService).toBeDefined();
    expect(cacheConfigService).toBeDefined();
    expect(alertRulesService).toBeDefined();
    expect(auditLogsService).toBeDefined();
    expect(filterPresetsService).toBeDefined();
    expect(colPrefsService).toBeDefined();
  });
});
