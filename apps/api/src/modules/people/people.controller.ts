import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  updatePeopleProfileSchema,
  uploadPronunciationSchema,
  type UpdatePeopleProfileInput,
  type UploadPronunciationInput,
} from "@unerp/shared";
import { PeopleService } from "./people.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string };
}

/**
 * Directory / org-chart profile endpoints powering the header hover card and
 * the full /profile page. Gated on the existing `auth.read`/`auth.update`
 * permissions rather than a new namespace — this is fundamentally an
 * extension of a user's own identity, and every authenticated role already
 * has those.
 */
@ApiTags("people")
@ApiBearerAuth()
@Controller("people")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @ApiOperation({ summary: "Get my full profile (for the /profile page)" })
  @Permissions("auth.read")
  @Get("me")
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    return this.peopleService.getMyFullProfile(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Update my directory profile fields" })
  @Permissions("auth.update")
  @Patch("me")
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(updatePeopleProfileSchema) dto: UpdatePeopleProfileInput,
  ) {
    return this.peopleService.updateMyProfile(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({ summary: "Upload a short pronunciation clip for my name" })
  @Permissions("auth.update")
  @Post("me/pronunciation")
  async uploadPronunciation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(uploadPronunciationSchema) dto: UploadPronunciationInput,
  ) {
    return this.peopleService.uploadPronunciation(
      req.user.tenantId,
      req.user.userId,
      dto.audioDataUrl,
    );
  }

  @ApiOperation({ summary: "Remove my pronunciation clip" })
  @Permissions("auth.update")
  @Delete("me/pronunciation")
  async removePronunciation(@Req() req: AuthenticatedRequest) {
    return this.peopleService.removePronunciation(req.user.userId);
  }

  @ApiOperation({ summary: "Export everything stored about my profile" })
  @Permissions("auth.read")
  @Get("me/export")
  async exportMyData(@Req() req: AuthenticatedRequest) {
    return this.peopleService.exportMyData(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: "My direct reports" })
  @Permissions("auth.read")
  @Get("me/reports")
  async myReports(@Req() req: AuthenticatedRequest) {
    return this.peopleService.listDirectReports(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "My same-department colleagues" })
  @Permissions("auth.read")
  @Get("me/colleagues")
  async myColleagues(@Req() req: AuthenticatedRequest) {
    return this.peopleService.listColleagues(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Search the org directory (name/email)" })
  @Permissions("auth.read")
  @Get("directory")
  async directory(@Req() req: AuthenticatedRequest, @Query("q") q?: string) {
    return this.peopleService.searchDirectory(req.user.tenantId, q ?? "");
  }

  @ApiOperation({ summary: "Get a user's Teams-style hover profile card" })
  @Permissions("auth.read")
  @Get(":userId/card")
  async profileCard(
    @Req() req: AuthenticatedRequest,
    @Param("userId") userId: string,
  ) {
    return this.peopleService.getProfileCard(
      req.user.tenantId,
      req.user.userId,
      userId,
    );
  }

  @ApiOperation({
    summary: "Org chart centered on a user (manager + direct reports)",
  })
  @Permissions("auth.read")
  @Get(":userId/org-chart")
  async orgChart(
    @Req() req: AuthenticatedRequest,
    @Param("userId") userId: string,
  ) {
    return this.peopleService.getOrgChartNode(req.user.tenantId, userId);
  }
}
