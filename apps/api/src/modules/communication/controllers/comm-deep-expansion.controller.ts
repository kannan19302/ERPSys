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
import { Permissions } from "../../../common/decorators/permissions.decorator";

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
  @Permissions("communication.email-inbox.create")
  createEmailInbox(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createEmailInbox(tenantId, data);
  }

  @Get("email-inboxes")
  @Permissions("communication.email-inbox.read")
  getEmailInboxes(@TenantId() tenantId: string) {
    return this.commService.getEmailInboxes(tenantId);
  }

  @Post("email-inboxes/:id/messages")
  @Permissions("communication.email-inbox.create")
  receiveEmailMessage(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.receiveEmailMessage(tenantId, id, data);
  }

  // 2. Video Rooms
  @Post("video-rooms")
  @Permissions("communication.video-room.create")
  createVideoRoom(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createVideoRoom(tenantId, data);
  }

  @Get("video-rooms")
  @Permissions("communication.video-room.read")
  getVideoRooms(@TenantId() tenantId: string) {
    return this.commService.getVideoRooms(tenantId);
  }

  @Post("video-rooms/:id/join")
  @Permissions("communication.video-room.create")
  joinVideoRoom(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.joinVideoRoom(tenantId, id, data);
  }

  // 3. Wiki & KB
  @Post("wiki/spaces")
  @Permissions("communication.wiki.create")
  createWikiSpace(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createWikiSpace(tenantId, data);
  }

  @Get("wiki/spaces")
  @Permissions("communication.wiki.read")
  getWikiSpaces(@TenantId() tenantId: string) {
    return this.commService.getWikiSpaces(tenantId);
  }

  @Post("wiki/spaces/:id/pages")
  @Permissions("communication.wiki.create")
  createWikiPage(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.createWikiPage(tenantId, id, data);
  }

  // 4. Team Chat
  @Post("chat/channels")
  @Permissions("communication.chat.create")
  createChatChannel(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createChatChannel(tenantId, data);
  }

  @Get("chat/channels")
  @Permissions("communication.chat.read")
  getChatChannels(@TenantId() tenantId: string) {
    return this.commService.getChatChannels(tenantId);
  }

  // 5. Intranet Feed
  @Post("intranet/posts")
  @Permissions("communication.intranet.create")
  createIntranetPost(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createIntranetPost(tenantId, data);
  }

  @Get("intranet/posts")
  @Permissions("communication.intranet.read")
  getIntranetFeed(@TenantId() tenantId: string) {
    return this.commService.getIntranetFeed(tenantId);
  }

  @Post("intranet/posts/:id/comments")
  @Permissions("communication.intranet.create")
  addIntranetComment(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.addIntranetComment(tenantId, id, data);
  }

  // 6. Surveys
  @Post("surveys")
  @Permissions("communication.survey.create")
  createSurvey(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createSurvey(tenantId, data);
  }

  @Get("surveys")
  @Permissions("communication.survey.read")
  getSurveys(@TenantId() tenantId: string) {
    return this.commService.getSurveys(tenantId);
  }

  @Post("surveys/:id/answers")
  @Permissions("communication.survey.create")
  submitSurveyAnswer(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.submitSurveyAnswer(tenantId, id, data);
  }

  // 7. Events
  @Post("events")
  @Permissions("communication.event.create")
  createCompanyEvent(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createCompanyEvent(tenantId, data);
  }

  @Post("events/:id/rsvp")
  @Permissions("communication.event.create")
  rsvpEvent(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.commService.rsvpEvent(tenantId, id, data);
  }

  // 8. PBX Extensions & Call Logs
  @Post("phone-extensions")
  @Permissions("communication.phone-extension.create")
  createPhoneExtension(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.createPhoneExtension(tenantId, data);
  }

  @Post("phone-call-logs")
  @Permissions("communication.phone-call-log.create")
  recordPhoneCallLog(@TenantId() tenantId: string, @Body() data: any) {
    return this.commService.recordPhoneCallLog(tenantId, data);
  }
}
