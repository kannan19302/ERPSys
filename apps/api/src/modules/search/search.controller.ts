import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

const querySchema = z.string().trim().min(2).max(100);

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @ApiOperation({ summary: 'Global tenant-scoped entity search (RBAC-filtered per entity)' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('global')
  async global(@Req() req: AuthenticatedRequest, @Query('q') q: string) {
    const parsed = querySchema.safeParse(q ?? '');
    // Short/invalid queries return an empty result set rather than erroring —
    // the palette calls this on every keystroke.
    if (!parsed.success) return { data: [] };
    const data = await this.service.globalSearch(req.user.tenantId, req.user.userId, parsed.data);
    return { data };
  }
}
