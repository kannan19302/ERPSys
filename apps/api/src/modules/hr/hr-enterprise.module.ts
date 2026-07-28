import { Module } from '@nestjs/common';
import { HrEnterpriseService } from './hr-enterprise.service';
import { HrEnterpriseController } from './hr-enterprise.controller';

@Module({
  controllers: [HrEnterpriseController],
  providers: [HrEnterpriseService],
  exports: [HrEnterpriseService],
})
export class HrEnterpriseModule {}
