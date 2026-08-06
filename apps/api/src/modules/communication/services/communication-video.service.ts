import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationVideoService {
  async getMeetings(
    tenantId: string,
    params: { page?: number; limit?: number; active?: boolean },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.active !== undefined) where.active = params.active;
    const [data, total] = await Promise.all([
      prisma.connectMeeting.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { participants: true, recordings: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.connectMeeting.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getMeeting(tenantId: string, id: string) {
    const meeting = await prisma.connectMeeting.findFirst({
      where: { id, tenantId },
      include: {
        participants: true,
        recordings: true,
        summaries: true,
        chatMessages: { take: 50, orderBy: { createdAt: "desc" } },
      },
    });
    if (!meeting) throw new NotFoundException("Meeting not found");
    return meeting;
  }

  async createMeetingWithSettings(
    tenantId: string,
    userId: string,
    dto: { title: string; channelId?: string; lobby?: boolean },
  ) {
    const code = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`;
    const meeting = await prisma.connectMeeting.create({
      data: {
        tenantId,
        channelId: dto.channelId,
        code,
        title: dto.title,
        hostId: userId,
        lobby: dto.lobby || false,
      },
    });

    // Enrol the host. Without this the creator is not a participant of their own
    // meeting, so participant counts are short by one and any check of the form
    // "is this user in the meeting?" rejects the host — including the lobby
    // admission flow, which is exactly who needs to bypass it.
    // MeetingParticipant has no `role` column; the host is identified by
    // ConnectMeeting.hostId, so enrolling the row is all that is needed.
    await prisma.meetingParticipant.create({
      data: { tenantId, meetingId: meeting.id, userId },
    });

    return meeting;
  }

  async endMeeting(tenantId: string, id: string) {
    const existing = await prisma.connectMeeting.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Meeting not found");
    return prisma.connectMeeting.update({
      where: { id },
      data: { active: false, endedAt: new Date() },
    });
  }

  async getMeetingRecordings(tenantId: string, meetingId: string) {
    return prisma.meetingRecording.findMany({
      where: { tenantId, meetingId },
      orderBy: { startedAt: "desc" },
    });
  }

  async getRecording(tenantId: string, id: string) {
    const recording = await prisma.meetingRecording.findFirst({
      where: { id, tenantId },
    });
    if (!recording) throw new NotFoundException("Recording not found");
    return recording;
  }

  async createBreakoutRoom(
    tenantId: string,
    meetingId: string,
    userId: string,
    dto: { name: string; participantIds?: string[] },
  ) {
    const existing = await prisma.connectMeeting.findFirst({
      where: { id: meetingId, tenantId },
    });
    if (!existing) throw new NotFoundException("Meeting not found");
    return prisma.breakoutRoom.create({
      data: {
        tenantId,
        meetingId,
        name: dto.name,
        hostId: userId,
        participantIds: dto.participantIds || [],
      },
    });
  }

  async getBreakoutRooms(tenantId: string, meetingId: string) {
    return prisma.breakoutRoom.findMany({
      where: { tenantId, meetingId, isActive: true },
    });
  }

  async endBreakoutRoom(tenantId: string, id: string) {
    const existing = await prisma.breakoutRoom.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Breakout room not found");
    return prisma.breakoutRoom.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
    });
  }

  async getMeetingAnalytics(tenantId: string, meetingId: string) {
    const analytics = await prisma.meetingAnalytics.findUnique({
      where: { tenantId_meetingId: { tenantId, meetingId } },
    });
    if (!analytics) throw new NotFoundException("Meeting analytics not found");
    return analytics;
  }

  async getVideoDashboard(tenantId: string) {
    const [
      activeMeetings,
      totalMeetings,
      totalParticipants,
      totalRecordings,
      meetingsToday,
    ] = await Promise.all([
      prisma.connectMeeting.count({ where: { tenantId, active: true } }),
      prisma.connectMeeting.count({ where: { tenantId } }),
      prisma.meetingParticipant.count({ where: { tenantId } }),
      prisma.meetingRecording.count({ where: { tenantId } }),
      prisma.connectMeeting.count({
        where: {
          tenantId,
          startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    return {
      activeMeetings,
      totalMeetings,
      totalParticipants,
      totalRecordings,
      meetingsToday,
    };
  }
}
