import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrSettingsController } from './settings.controller';
import { HrService } from './hr.service';
import { AppSettingsService } from '../../common/settings/settings.service';
import { HrEnterpriseModule } from './hr-enterprise.module';

@Module({
  imports: [HrEnterpriseModule],
  controllers: [HrController, HrSettingsController],
  providers: [HrService, AppSettingsService],
  exports: [HrService],
})
export class HrModule {}
