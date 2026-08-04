import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommDeepExpansionService {
  private get prisma() {
    return prisma as any;
  }

  // 1. Email Inboxes & Message Processing
  async createEmailInbox(tenantId: string, data: any) {
    return this.prisma.emailInbox.create({
      data: { ...data, tenantId },
      include: { emailRules: true },
    });
  }

  async getEmailInboxes(tenantId: string) {
    return this.prisma.emailInbox.findMany({
      where: { tenantId },
      include: { emails: { take: 20, orderBy: { createdAt: "desc" } } },
    });
  }

  async receiveEmailMessage(tenantId: string, inboxId: string, data: any) {
    return this.prisma.emailMessage.create({
      data: { ...data, inboxId, tenantId },
    });
  }

  // 2. Video Rooms & Conferences
  async createVideoRoom(tenantId: string, data: any) {
    const roomCode =
      data.roomCode || `room-${Math.random().toString(36).substring(2, 9)}`;
    return this.prisma.videoRoom.create({
      data: { ...data, roomCode, tenantId },
      include: { participants: true },
    });
  }

  async getVideoRooms(tenantId: string) {
    return this.prisma.videoRoom.findMany({
      where: { tenantId },
      include: { participants: true, videoRecordings: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async joinVideoRoom(tenantId: string, roomId: string, data: any) {
    return this.prisma.videoRoomParticipant.create({
      data: { ...data, roomId, tenantId, joinedAt: new Date() },
    });
  }

  // 3. Wiki & Knowledge Base Spaces
  async createWikiSpace(tenantId: string, data: any) {
    return this.prisma.wikiSpace.create({
      data: { ...data, tenantId },
      include: { wikiPages: true },
    });
  }

  async createWikiPage(tenantId: string, spaceId: string, data: any) {
    const page = await this.prisma.wikiPage.create({
      data: { ...data, spaceId, tenantId },
    });

    // Create initial version record
    await this.prisma.wikiPageVersion.create({
      data: {
        tenantId,
        pageId: page.id,
        version: 1,
        title: page.title,
        content: page.content,
        editedBy: data.authorId,
        changeSummary: "Initial version",
      },
    });

    return page;
  }

  async getWikiSpaces(tenantId: string) {
    return this.prisma.wikiSpace.findMany({
      where: { tenantId },
      include: {
        wikiPages: {
          select: { id: true, title: true, slug: true, isPublished: true },
        },
      },
    });
  }

  // 4. Team Chat Channels & Members
  async createChatChannel(tenantId: string, data: any) {
    return this.prisma.chatChannel.create({
      data: { ...data, tenantId },
      include: { chatMembers: true },
    });
  }

  async getChatChannels(tenantId: string) {
    return this.prisma.chatChannel.findMany({
      where: { tenantId },
      include: { chatMembers: true },
    });
  }

  // 5. Social Intranet & Posts
  async createIntranetPost(tenantId: string, data: any) {
    return this.prisma.intranetPost.create({
      data: { ...data, tenantId },
      include: { intranetComments: true, intranetReactions: true },
    });
  }

  async getIntranetFeed(tenantId: string) {
    return this.prisma.intranetPost.findMany({
      where: { tenantId },
      include: { intranetComments: true, intranetReactions: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async addIntranetComment(tenantId: string, postId: string, data: any) {
    const comment = await this.prisma.intranetComment.create({
      data: { ...data, postId, tenantId },
    });
    await this.prisma.intranetPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });
    return comment;
  }

  // 6. Surveys (Communication Surveys)
  async createSurvey(tenantId: string, data: any) {
    return this.prisma.internalSurvey.create({
      data: { ...data, tenantId },
      include: { surveyAnswers: true },
    });
  }

  async getSurveys(tenantId: string) {
    return this.prisma.internalSurvey.findMany({
      where: { tenantId },
      include: { surveyAnswers: true },
    });
  }

  async submitSurveyAnswer(tenantId: string, surveyId: string, data: any) {
    const answer = await this.prisma.internalSurveyAnswer.create({
      data: { ...data, surveyId, tenantId },
    });
    await this.prisma.internalSurvey.update({
      where: { id: surveyId },
      data: { responseCount: { increment: 1 } },
    });
    return answer;
  }

  // 7. Company Events & RSVPs
  async createCompanyEvent(tenantId: string, data: any) {
    return this.prisma.companyEvent.create({
      data: { ...data, tenantId },
      include: { rsvps: true },
    });
  }

  async rsvpEvent(tenantId: string, eventId: string, data: any) {
    return this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId: data.userId } },
      create: { ...data, eventId, tenantId },
      update: { status: data.status, notes: data.notes },
    });
  }

  // 8. PBX Phone Extensions & Call Logs
  async createPhoneExtension(tenantId: string, data: any) {
    return this.prisma.phoneExtension.create({
      data: { ...data, tenantId },
    });
  }

  async recordPhoneCallLog(tenantId: string, data: any) {
    return this.prisma.phoneCallLog.create({
      data: { ...data, tenantId },
    });
  }
}
