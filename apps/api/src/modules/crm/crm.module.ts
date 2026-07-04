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
import { CrmCasesService } from './crm-cases.service';
import { CrmLeadScoringService } from './crm-lead-scoring.service';
import { CrmLeadScoringController } from './crm-lead-scoring.controller';
import { CrmDuplicatesService } from './crm-duplicates.service';
import { CrmDuplicatesController } from './crm-duplicates.controller';
import { CrmPipelineStagesService } from './crm-pipeline-stages.service';
import { CrmPipelineStagesController } from './crm-pipeline-stages.controller';
import { CrmSegmentsService } from './crm-segments.service';
import { CrmSegmentsController } from './crm-segments.controller';
import { CrmSlaService } from './crm-sla.service';
import { CrmSlaController } from './crm-sla.controller';
import { CrmIntelligenceService } from './crm-intelligence.service';
import { CrmIntelligenceController } from './crm-intelligence.controller';
import { CrmContractsService } from './crm-contracts.service';
import { CrmContractsController } from './crm-contracts.controller';
import { CrmMailboxService } from './crm-mailbox.service';
import { CrmMailboxController } from './crm-mailbox.controller';

const CRM_SERVICES = [
  CrmService,
  CrmIntelligenceService,
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
  CrmCasesService,
  CrmLeadScoringService,
  CrmDuplicatesService,
  CrmPipelineStagesService,
  CrmSegmentsService,
  CrmSlaService,
  CrmContractsService,
  CrmMailboxService,
];

@Module({
  controllers: [
    CrmController,
    CrmIntelligenceController,
    CrmLeadScoringController,
    CrmDuplicatesController,
    CrmPipelineStagesController,
    CrmSegmentsController,
    CrmSlaController,
    CrmContractsController,
    CrmMailboxController,
  ],
  providers: CRM_SERVICES,
  exports: CRM_SERVICES,
})
export class CrmModule { }
