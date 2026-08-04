import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { CommDeepExpansionService } from "../services/comm-deep-expansion.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { CurrentTenant } from "../../../common/decorators/current-tenant.decorator";

// `TenantId` used to be `Headers("x-tenant-id")` — the tenant was whatever the
// caller claimed. It is now the session's tenant; the parameter sites below are
// unchanged because the alias is what moved.
const TenantId = CurrentTenant;

@Controller("communication/deep-expansion")
// These routes were reachable with no authentication at all, and took the
// tenant from a client-supplied `x-tenant-id` header — so any anonymous caller
// could read or write any tenant's data by naming it. The services behind them
// are real (letters of credit, production orders, project financials), not
// stubs. JwtAuthGuard now establishes the caller and `TenantId` resolves from
// the authenticated session instead of the request header.
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommDeepExpansionController {
  constructor(private readonly commService: CommDeepExpansionService) {}

  // 1. Email Inboxes
  @Post("email-inboxes")
  createEmailInbox(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createEmailInbox(tenantId, data);
  }

  @Get("email-inboxes")
  getEmailInboxes(@TenantId() tenantId: string) {
    return this.commService.getEmailInboxes(tenantId);
  }

  @Post("email-inboxes/:id/messages")
  receiveEmailMessage(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.receiveEmailMessage(tenantId, id, data);
  }

  // 2. Video Rooms
  @Post("video-rooms")
  createVideoRoom(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createVideoRoom(tenantId, data);
  }

  @Get("video-rooms")
  getVideoRooms(@TenantId() tenantId: string) {
    return this.commService.getVideoRooms(tenantId);
  }

  @Post("video-rooms/:id/join")
  joinVideoRoom(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.joinVideoRoom(tenantId, id, data);
  }

  // 3. Wiki & KB
  @Post("wiki/spaces")
  createWikiSpace(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createWikiSpace(tenantId, data);
  }

  @Get("wiki/spaces")
  getWikiSpaces(@TenantId() tenantId: string) {
    return this.commService.getWikiSpaces(tenantId);
  }

  @Post("wiki/spaces/:id/pages")
  createWikiPage(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.createWikiPage(tenantId, id, data);
  }

  // 4. Team Chat
  @Post("chat/channels")
  createChatChannel(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createChatChannel(tenantId, data);
  }

  @Get("chat/channels")
  getChatChannels(@TenantId() tenantId: string) {
    return this.commService.getChatChannels(tenantId);
  }

  // 5. Intranet Feed
  @Post("intranet/posts")
  createIntranetPost(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createIntranetPost(tenantId, data);
  }

  @Get("intranet/posts")
  getIntranetFeed(@TenantId() tenantId: string) {
    return this.commService.getIntranetFeed(tenantId);
  }

  @Post("intranet/posts/:id/comments")
  addIntranetComment(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.addIntranetComment(tenantId, id, data);
  }

  // 6. Surveys
  @Post("surveys")
  createSurvey(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createSurvey(tenantId, data);
  }

  @Get("surveys")
  getSurveys(@TenantId() tenantId: string) {
    return this.commService.getSurveys(tenantId);
  }

  @Post("surveys/:id/answers")
  submitSurveyAnswer(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.submitSurveyAnswer(tenantId, id, data);
  }

  // 7. Events
  @Post("events")
  createCompanyEvent(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createCompanyEvent(tenantId, data);
  }

  @Post("events/:id/rsvp")
  rsvpEvent(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.rsvpEvent(tenantId, id, data);
  }

  // 8. PBX Extensions & Call Logs
  @Post("phone-extensions")
  createPhoneExtension(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createPhoneExtension(tenantId, data);
  }

  @Post("phone-call-logs")
  recordPhoneCallLog(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.recordPhoneCallLog(tenantId, data);
  }
}
