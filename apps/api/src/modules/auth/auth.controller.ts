import { Controller, Post, Get, Patch, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '@unerp/shared';

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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: Record<string, unknown>,
  ) {
    const validationPipe = new ZodValidationPipe(loginSchema);
    const loginData = validationPipe.transform(body, { type: 'body', metatype: Object }) as LoginInput;
    
    return this.authService.login({
      ...loginData,
      tenantSlug: body.tenantSlug as string | undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const validationPipe = new ZodValidationPipe(
      require('@unerp/shared').updateProfileSchema,
    );
    const dto = validationPipe.transform(body, { type: 'body', metatype: Object });
    return this.authService.updateProfile(req.user.userId, dto);
  }
}
