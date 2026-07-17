import { Global, Module } from '@nestjs/common';
import { ChangeHistoryService } from './services/change-history.service';
import { ChangeHistoryController } from './controllers/change-history.controller';
import { ExportService } from './services/export.service';
import { AppLogger } from './services/logger.service';
import { CacheService } from './services/cache.service';
import { I18nService } from './services/i18n.service';

@Global()
@Module({
  controllers: [ChangeHistoryController],
  providers: [ChangeHistoryService, ExportService, AppLogger, CacheService, I18nService],
  exports: [ChangeHistoryService, ExportService, AppLogger, CacheService, I18nService],
})
export class CommonModule {}
