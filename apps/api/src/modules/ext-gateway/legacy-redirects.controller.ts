import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Compatibility shim for the healthcare split: external integrations that
 * still call /api/v1/healthcare/* get a 308 to the extension-gateway route.
 * Remove one release after the unierp-app-healthcare cutover.
 */
@ApiTags('legacy-redirects')
@Controller('healthcare')
export class LegacyHealthcareRedirectController {
  @ApiOperation({ summary: 'Redirect legacy healthcare API paths to /ext/healthcare' })
  @All(['*path', ''])
  redirect(@Req() req: Request, @Res() res: Response) {
    res.redirect(308, req.originalUrl.replace('/api/v1/healthcare', '/api/v1/ext/healthcare'));
  }
}
