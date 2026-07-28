import { Module } from '@nestjs/common';
import { CrmEnterpriseService } from './crm-enterprise.service';
import { CrmEnterpriseController } from './crm-enterprise.controller';

@Module({
  controllers: [CrmEnterpriseController],
  providers: [CrmEnterpriseService],
  exports: [CrmEnterpriseService],
})
export class CrmEnterpriseModule {}
