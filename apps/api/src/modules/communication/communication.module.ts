import { CommunicationDeepController } from "./controllers/communication-deep-suite.controller";
import { Module } from "@nestjs/common";
import { CommunicationController } from "./communication.controller";
import { CommunicationService } from "./communication.service";
import { CommunicationAdminService } from "./communication-admin.service";
import { CommunicationBotsService } from "./communication-bots.service";
import { CommunicationExpansionController } from "./communication-expansion.controller";
import { CommunicationExpansionService } from "./communication-expansion.service";
import { CommunicationSettingsController } from "./settings.controller";
import { KnowledgeBaseController } from "./controllers/knowledge-base.controller";
import { HelpdeskController } from "./controllers/helpdesk.controller";
import { OmnichannelController } from "./controllers/omnichannel.controller";
import { VideoDeepController } from "./controllers/video-deep.controller";
import { VoipController } from "./controllers/voip.controller";
import { SearchController } from "./controllers/search.controller";
import { RealTimeCollabController } from "./controllers/real-time-collab.controller";
import { SurveyController } from "./controllers/survey.controller";
import { CommunicationKnowledgeService } from "./services/communication-knowledge.service";
import { CommunicationHelpdeskService } from "./services/communication-helpdesk.service";
import { CommunicationOmnichannelService } from "./services/communication-omnichannel.service";
import { CommunicationVideoService } from "./services/communication-video.service";
import { CommunicationVoipService } from "./services/communication-voip.service";
import { CommunicationSearchService } from "./services/communication-search.service";
import { CommunicationRealTimeCollabService } from "./services/communication-real-time-collab.service";
import { CommunicationSurveyService } from "./services/communication-survey.service";
import { DocumentStorageClientModule } from "../../common/integrations/document-storage-client.module";
import { RealtimeClientModule } from "../../common/integrations/realtime-client.module";
import { AppSettingsService } from "../../common/settings/settings.service";

import { CommDeepExpansionController } from "./controllers/comm-deep-expansion.controller";
import { CommDeepExpansionService } from "./services/comm-deep-expansion.service";
import { CommunicationEnterpriseModule } from "./communication-enterprise.module";
import { CommunicationEnterpriseController } from "./communication-enterprise.controller";
import { CommunicationEnterpriseService } from "./communication-enterprise.service";

@Module({
  imports: [DocumentStorageClientModule, RealtimeClientModule, CommunicationEnterpriseModule],
  controllers: [
    CommunicationDeepController,
    CommDeepExpansionController,
    CommunicationController,
    CommunicationExpansionController,
    CommunicationSettingsController,
    KnowledgeBaseController,
    HelpdeskController,
    OmnichannelController,
    VideoDeepController,
    VoipController,
    SearchController,
    RealTimeCollabController,
    SurveyController,
    CommunicationEnterpriseController,
  ],
  providers: [
    CommunicationDeepController,
    CommDeepExpansionService,
    CommDeepExpansionService,
    CommunicationService,
    CommunicationAdminService,
    CommunicationBotsService,
    CommunicationExpansionService,
    CommunicationKnowledgeService,
    CommunicationHelpdeskService,
    CommunicationOmnichannelService,
    CommunicationVideoService,
    CommunicationVoipService,
    CommunicationSearchService,
    CommunicationRealTimeCollabService,
    CommunicationSurveyService,
    AppSettingsService,
    CommunicationEnterpriseService,
    CommunicationEnterpriseController,
  ],
  exports: [
    CommDeepExpansionService,
    CommunicationService,
    CommunicationAdminService,
    CommunicationBotsService,
    CommunicationExpansionService,
    CommunicationKnowledgeService,
    CommunicationHelpdeskService,
    CommunicationOmnichannelService,
    CommunicationVideoService,
    CommunicationVoipService,
    CommunicationSearchService,
    CommunicationRealTimeCollabService,
    CommunicationSurveyService,
    CommunicationEnterpriseService,
  ],
})
export class CommunicationModule {}
