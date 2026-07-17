import { Controller, Post, Get, Patch, Body, UseGuards, Req, Res, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerSchema, loginSchema, RegisterInput, LoginInput, forgotPasswordSchema, resetPasswordSchema, ForgotPasswordInput, ResetPasswordInput, mfaLoginSchema, MfaLoginInput } from '@unerp/shared';
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
    sid?: string;
    userId: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

/** Pulls IP / user-agent off the request for the active-sessions record. */
function sessionContext(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
    userAgent: (req.headers['user-agent'] as string) || null,
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @ZodBody(z.any()) body: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validationPipe = new ZodValidationPipe(loginSchema);
    const loginData = validationPipe.transform(body, { type: 'body', metatype: Object }) as LoginInput;

    const result = await this.authService.login({
      ...loginData,
      tenantSlug: body.tenantSlug as string | undefined,
    }, sessionContext(req));

    // Only a completed login carries a session token; an MFA challenge does not.
    if ('token' in result) {
      res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    }

    return result;
  }

  @ApiOperation({ summary: 'Logout' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    // Revoke the server-side session so the token is dead even if it is replayed.
    if (req.user?.sid) {
      await this.authService.revokeSessionById(req.user.sid);
    }
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

  @ApiOperation({ summary: 'List tenants this account can sign in to' })
  @Permissions('auth.read')
  @Get('tenants')
  @UseGuards(JwtAuthGuard, RbacGuard)
  async listTenants(@Req() req: AuthenticatedRequest) {
    return this.authService.listUserTenants(req.user.userId);
  }

  @ApiOperation({ summary: 'Switch the active tenant (re-issues the session)' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async switchTenant(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ tenantSlug: z.string().min(1).max(100) })) body: { tenantSlug: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchTenant(
      req.user.userId,
      req.user.sid,
      body.tenantSlug,
      sessionContext(req),
    );
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }

  @ApiOperation({ summary: 'Request password reset' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Login demo user (non-production only)' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login-demo')
  @HttpCode(HttpStatus.OK)
  async loginDemo(
    @Body() body: { role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'VIEWER' },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
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

  @ApiOperation({ summary: 'Verify MFA and Login' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('mfa/verify-login')
  @HttpCode(HttpStatus.OK)
  async verifyMfaLogin(
    @Body(new ZodValidationPipe(mfaLoginSchema)) body: MfaLoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMfaLogin(body.challengeToken, body.code, sessionContext(req));
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }
}
