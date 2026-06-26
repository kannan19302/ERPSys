import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmIntegrationsService } from './crm-integrations.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService, CrmIntegrationsService],
  exports: [CrmService, CrmIntegrationsService],
})
export class CrmModule {}
