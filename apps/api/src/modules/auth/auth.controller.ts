import { Controller, Post, Get, Patch, Body, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerSchema, loginSchema, RegisterInput, LoginInput, forgotPasswordSchema, resetPasswordSchema, ForgotPasswordInput, ResetPasswordInput } from '@unerp/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

const AUTH_COOKIE = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 day, matches JWT expiry
};

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register' })
  @Permissions('auth.create')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login' })
  @Permissions('auth.create')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @ZodBody(z.any()) body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validationPipe = new ZodValidationPipe(loginSchema);
    const loginData = validationPipe.transform(body, { type: 'body', metatype: Object }) as LoginInput;

    const result = await this.authService.login({
      ...loginData,
      tenantSlug: body.tenantSlug as string | undefined,
    });

    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);

    return result;
  }

  @ApiOperation({ summary: 'Logout' })
  @Permissions('auth.create')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    return { message: 'Logged out' };
  }

  @ApiOperation({ summary: 'Get profile' })
  @Permissions('auth.read')
  @Get('me')
  @UseGuards(JwtAuthGuard, RbacGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: 'Update profile' })
  @Permissions('auth.update')
  @Patch('me')
  @UseGuards(JwtAuthGuard, RbacGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: Record<string, unknown>,
  ) {
    const validationPipe = new ZodValidationPipe(
      require('@unerp/shared').updateProfileSchema,
    );
    const dto = validationPipe.transform(body, { type: 'body', metatype: Object });
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Login demo user' })
  @Post('login-demo')
  @HttpCode(HttpStatus.OK)
  async loginDemo(
    @Body() body: { role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'VIEWER' },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginDemo(body.role);
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }

  @ApiOperation({ summary: 'Setup TOTP MFA' })
  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setupMfa(@Req() req: AuthenticatedRequest) {
    return this.authService.generateMfaSecret(req.user.userId);
  }

  @ApiOperation({ summary: 'Verify and enable/disable TOTP MFA' })
  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Req() req: AuthenticatedRequest,
    @Body() body: { code: string; enable: boolean },
  ) {
    return this.authService.verifyMfaAndEnable(req.user.userId, body.code, body.enable);
  }

  @ApiOperation({ summary: 'Generate Passkey Registration Options' })
  @Post('passkey/register-options')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPasskeyRegisterOptions(@Req() req: AuthenticatedRequest) {
    return this.authService.generatePasskeyRegisterOptions(req.user.userId);
  }

  @ApiOperation({ summary: 'Register Passkey Credential' })
  @Post('passkey/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async registerPasskey(
    @Req() req: AuthenticatedRequest,
    @Body() body: { credentialID: string; publicKey: string },
  ) {
    return this.authService.verifyPasskeyRegister(req.user.userId, body);
  }

  @ApiOperation({ summary: 'Login with Passkey' })
  @Post('passkey/login')
  @HttpCode(HttpStatus.OK)
  async loginPasskey(
    @Body() body: { credentialID: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyPasskeyLogin(body.credentialID);
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }

  @ApiOperation({ summary: 'Verify MFA and Login' })
  @Post('mfa/verify-login')
  @HttpCode(HttpStatus.OK)
  async verifyMfaLogin(
    @Body() body: { userId: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMfaLogin(body.userId, body.code);
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }
}
