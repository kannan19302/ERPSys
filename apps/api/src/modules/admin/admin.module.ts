import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { ActivityFeedController } from './activity-feed.controller';
import { ActivityFeedService } from './activity-feed.service';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  controllers: [AdminController, SuperAdminController, SecurityController, ActivityFeedController, ImportExportController, GdprController, AnnouncementsController],
  providers: [AdminService, SuperAdminService, SecurityService, ActivityFeedService, ImportExportService, GdprService, AnnouncementsService],
  exports: [AdminService, SuperAdminService, SecurityService, ActivityFeedService, ImportExportService, GdprService, AnnouncementsService],
})
export class AdminModule {}
