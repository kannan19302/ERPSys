import {
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { BrandingService } from "./branding.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateBrandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  companyName: z.string().max(255).optional(),
  tagline: z.string().max(500).optional(),
  faviconUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  customCss: z.string().optional(),
  customDomain: z.string().optional(),
  hideBranding: z.boolean().optional(),
  emailHeaderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  emailFooterHtml: z.string().optional(),
});

@ApiTags("saas-branding")
@ApiBearerAuth()
@Controller("saas/branding")
@UseGuards(JwtAuthGuard, RbacGuard)
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @ApiOperation({ summary: "Get branding" })
  @Permissions("saas.branding.read")
  @Get()
  async getBranding(@Req() req: AuthReq) {
    return this.brandingService.getBranding(req.user.tenantId);
  }

  @ApiOperation({ summary: "Update branding" })
  @Permissions("saas.branding.update")
  @Put()
  async updateBranding(@Req() req: AuthReq, @ZodBody(updateBrandingSchema) body: z.infer<typeof updateBrandingSchema>) {
    return this.brandingService.updateBranding(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Upload logo" })
  @Permissions("saas.branding.update")
  @ApiConsumes("multipart/form-data")
  @Post("logo")
  @UseInterceptors(FileInterceptor("file"))
  async uploadLogo(@Req() req: AuthReq, @UploadedFile() file: Express.Multer.File) {
    return this.brandingService.uploadLogo(req.user.tenantId, file);
  }

  @ApiOperation({ summary: "Upload favicon" })
  @Permissions("saas.branding.update")
  @ApiConsumes("multipart/form-data")
  @Post("favicon")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFavicon(@Req() req: AuthReq, @UploadedFile() file: Express.Multer.File) {
    return this.brandingService.uploadFavicon(req.user.tenantId, file);
  }

  @ApiOperation({ summary: "Preview branding" })
  @Permissions("saas.branding.read")
  @Get("preview")
  async previewBranding(@Req() req: AuthReq) {
    return this.brandingService.previewBranding(req.user.tenantId);
  }

  @ApiOperation({ summary: "Reset branding to defaults" })
  @Permissions("saas.branding.update")
  @Post("reset")
  async resetBranding(@Req() req: AuthReq) {
    return this.brandingService.resetBranding(req.user.tenantId);
  }
}
