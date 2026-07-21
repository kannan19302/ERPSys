import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OAuthController } from "./oauth.controller";
import { OAuthService } from "./oauth.service";
import { SsoController } from "./sso.controller";
import { SsoService } from "./sso.service";
import { ProvisioningService } from "./provisioning.service";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { DemoDataService } from "./demo-data.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [
    AuthController,
    OAuthController,
    SsoController,
    OnboardingController,
  ],
  providers: [
    AuthService,
    OAuthService,
    SsoService,
    ProvisioningService,
    OnboardingService,
    DemoDataService,
  ],
  exports: [
    AuthService,
    OAuthService,
    SsoService,
    ProvisioningService,
    OnboardingService,
    DemoDataService,
  ],
})
export class AuthModule {}
