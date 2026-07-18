import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OAuthController } from "./oauth.controller";
import { OAuthService } from "./oauth.service";
import { SsoController } from "./sso.controller";
import { SsoService } from "./sso.service";

@Module({
  controllers: [AuthController, OAuthController, SsoController],
  providers: [AuthService, OAuthService, SsoService],
  exports: [AuthService, OAuthService, SsoService],
})
export class AuthModule {}
