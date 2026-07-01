import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmIntegrationsService } from './crm-integrations.service';
import { CrmCustomersService } from './crm-customers.service';
import { CrmContactsService } from './crm-contacts.service';
import { CrmLeadsService } from './crm-leads.service';
import { CrmDealsService } from './crm-deals.service';
import { CrmActivitiesService } from './crm-activities.service';
import { CrmMarketingService } from './crm-marketing.service';
import { CrmSalesOpsService } from './crm-salesops.service';
import { CrmConfigService } from './crm-config.service';
import { CrmCollaborationService } from './crm-collaboration.service';
import { CrmDashboardsService } from './crm-dashboards.service';

const CRM_SERVICES = [
  CrmService,
  CrmIntegrationsService,
  CrmCustomersService,
  CrmContactsService,
  CrmLeadsService,
  CrmDealsService,
  CrmActivitiesService,
  CrmMarketingService,
  CrmSalesOpsService,
  CrmConfigService,
  CrmCollaborationService,
  CrmDashboardsService,
];

@Module({
  controllers: [CrmController],
  providers: CRM_SERVICES,
  exports: CRM_SERVICES,
})
export class CrmModule {}
