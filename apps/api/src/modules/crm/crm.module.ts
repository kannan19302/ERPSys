import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmIntegrationsService } from './crm-integrations.service';
import { CrmCustomersService } from './crm-customers.service';
import { CrmContactsService } from './crm-contacts.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService, CrmIntegrationsService, CrmCustomersService, CrmContactsService],
  exports: [CrmService, CrmIntegrationsService, CrmCustomersService, CrmContactsService],
})
export class CrmModule {}
