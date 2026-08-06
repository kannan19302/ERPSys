import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationEnterpriseService {
  async getUnifiedInbox(
    tenantId: string,
    userId: string,
    filters: {
      types?: string[];
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const types = filters.types || [
      "MESSAGE",
      "MENTION",
      "TASK",
      "NOTIFICATION",
    ];
    const results: Record<string, any> = {};
    if (types.includes("MESSAGE") || types.includes("MENTION")) {
      const messageWhere: any = {
        tenantId,
        OR: [{ senderId: { not: userId } }],
      };
      if (filters.status === "UNREAD") {
        messageWhere.readReceipts = { none: { userId } };
      }
      const messages = await prisma.chatMessage.findMany({
        where: { tenantId, room: { members: { some: { userId } } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          reactions: true,
          room: { select: { name: true } },
          readReceipts: true,
        },
      });
      results.messages = messages.map((m) => ({
        id: m.id,
        type: m.senderId === userId ? "SENT" : "MESSAGE",
        content: m.content,
        senderId: m.senderId,
        roomName: m.room?.name || null,
        createdAt: m.createdAt,
        isRead: m.readReceipts?.some((r: any) => r.userId === userId) ?? false,
      }));
    }
    if (types.includes("TASK")) {
      const tasks = await prisma.task.findMany({
        where: { tenantId, assignedToId: userId, status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
        take: limit,
      });
      results.tasks = tasks.map((t) => ({
        id: t.id,
        type: "TASK",
        title: t.name,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
    }
    if (types.includes("NOTIFICATION")) {
      const announcements = await prisma.announcement.findMany({
        where: { tenantId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: limit,
      });
      results.notifications = announcements.map((a) => ({
        id: a.id,
        type: "ANNOUNCEMENT",
        title: a.title,
        content: a.content,
        priority: a.priority,
        publishedAt: a.publishedAt,
      }));
    }
    if (types.includes("CHANNEL")) {
      const channels = await prisma.chatChannel.findMany({
        where: { tenantId, isArchived: false },
        take: limit,
      });
      results.channels = channels.map((c) => ({
        id: c.id,
        type: "CHANNEL",
        name: c.name,
        slug: c.slug,
        memberCount: c.memberCount,
      }));
    }
    return {
      userId,
      filters,
      totalItems: Object.values(results).reduce(
        (s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0),
        0,
      ),
      ...results,
    };
  }

  async getMessageAnalytics(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const rooms = await prisma.chatRoom.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      include: {
        messages: {
          where: { createdAt: { gte: startDate } },
          include: { reactions: true },
        },
        members: true,
      },
    });
    const totalMessages = rooms.reduce((s, r) => s + r.messages.length, 0);
    const totalReactions = rooms.reduce(
      (s, r) => s + r.messages.reduce((s2, m) => s2 + m.reactions.length, 0),
      0,
    );
    const busiestRoom = rooms.reduce(
      (best, r) =>
        r.messages.length > (best?.messages.length || 0) ? r : best,
      rooms[0],
    );
    const uniqueSenders = new Set<string>();
    for (const r of rooms) {
      for (const m of r.messages) uniqueSenders.add(m.senderId);
    }
    const totalMembers = rooms.reduce((s, r) => s + r.members.length, 0);
    const avgMessagesPerRoom =
      rooms.length > 0 ? Number((totalMessages / rooms.length).toFixed(1)) : 0;
    const messagesByType: Record<string, number> = {};
    for (const r of rooms) {
      for (const m of r.messages) {
        messagesByType[m.contentType] =
          (messagesByType[m.contentType] || 0) + 1;
      }
    }
    const messagesByRoom = rooms.map((r) => ({
      roomId: r.id,
      roomName: r.name,
      messageCount: r.messages.length,
      reactionCount: r.messages.reduce((s, m) => s + m.reactions.length, 0),
      memberCount: r.members.length,
      lastActivity: r.updatedAt,
    }));
    return {
      dateRange,
      period: { start: startDate, end: now },
      summary: {
        totalMessages,
        totalRooms: rooms.length,
        totalMembers,
        totalReactions,
        uniqueActiveUsers: uniqueSenders.size,
        avgMessagesPerRoom,
        busiestRoom: busiestRoom
          ? {
              id: busiestRoom.id,
              name: busiestRoom.name,
              count: busiestRoom.messages.length,
            }
          : null,
      },
      messagesByType,
      rooms: messagesByRoom.sort((a, b) => b.messageCount - a.messageCount),
      dailyTrend: this.buildDailyTrend(rooms),
    };
  }

  private buildDailyTrend(rooms: any[]) {
    const trend: Record<string, number> = {};
    for (const r of rooms) {
      for (const m of r.messages) {
        const day = m.createdAt.toISOString().split("T")[0];
        trend[day] = (trend[day] || 0) + 1;
      }
    }
    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  async getFileSharingAnalytics(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const files = await prisma.communicationFileShare.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
    });
    const totalFiles = files.length;
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const avgSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;
    const byType: Record<string, { count: number; totalSize: number }> = {};
    for (const f of files) {
      const mimeGroup = f.mimeType.split("/")[0] || "other";
      if (!byType[mimeGroup]) byType[mimeGroup] = { count: 0, totalSize: 0 };
      byType[mimeGroup].count++;
      byType[mimeGroup].totalSize += f.size;
    }
    const uniqueUploaders = new Set(files.map((f) => f.uploadedBy)).size;
    const topFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
    const fileSizeBuckets = {
      small: files.filter((f) => f.size < 100 * 1024).length,
      medium: files.filter(
        (f) => f.size >= 100 * 1024 && f.size < 5 * 1024 * 1024,
      ).length,
      large: files.filter(
        (f) => f.size >= 5 * 1024 * 1024 && f.size < 50 * 1024 * 1024,
      ).length,
      xlarge: files.filter((f) => f.size >= 50 * 1024 * 1024).length,
    };
    return {
      dateRange,
      period: { start: startDate, end: now },
      summary: {
        totalFiles,
        totalSizeBytes: totalSize,
        totalSizeMB: Number((totalSize / (1024 * 1024)).toFixed(2)),
        avgFileSizeKB: Math.round(avgSize / 1024),
        uniqueUploaders,
      },
      byFileType: Object.entries(byType).map(([type, data]) => ({
        type,
        count: data.count,
        totalSizeMB: Number((data.totalSize / (1024 * 1024)).toFixed(2)),
        pct:
          totalFiles > 0
            ? Number(((data.count / totalFiles) * 100).toFixed(1))
            : 0,
      })),
      sizeDistribution: fileSizeBuckets,
      topFiles: topFiles.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.mimeType,
        sizeMB: Number((f.size / (1024 * 1024)).toFixed(2)),
        uploadedBy: f.uploadedBy,
        uploadedAt: f.createdAt,
      })),
      uploadTrend: this.buildDailyFileTrend(files),
    };
  }

  private buildDailyFileTrend(files: any[]) {
    const trend: Record<string, number> = {};
    for (const f of files) {
      const day = f.createdAt.toISOString().split("T")[0];
      trend[day] = (trend[day] || 0) + 1;
    }
    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  async getCollaborationInsights(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const rooms = await prisma.chatRoom.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      include: {
        members: true,
        messages: {
          where: { createdAt: { gte: startDate } },
          select: { id: true, senderId: true },
        },
      },
    });
    const channels = await prisma.chatChannel.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      include: { chatMembers: true },
    });
    const totalRooms = rooms.length + channels.length;
    const totalMembers =
      rooms.reduce((s, r) => s + r.members.length, 0) +
      channels.reduce((s, c) => s + c.chatMembers.length, 0);
    const memberOverlap: Record<string, Set<string>> = {};
    for (const r of rooms) {
      for (const m of r.members) {
        if (!memberOverlap[m.userId]) memberOverlap[m.userId] = new Set();
        memberOverlap[m.userId]!.add(r.id);
      }
    }
    for (const c of channels) {
      for (const m of c.chatMembers) {
        if (!memberOverlap[m.userId]) memberOverlap[m.userId] = new Set();
        memberOverlap[m.userId]!.add(c.id);
      }
    }
    const crossTeamConnections = Object.values(memberOverlap).filter(
      (s) => s.size > 3,
    ).length;
    const siloedUsers = Object.entries(memberOverlap)
      .filter(([, spaces]) => spaces.size <= 1)
      .map(([userId]) => userId);
    const totalMessages = rooms.reduce((s, r) => s + r.messages.length, 0);
    const messagesPerMember =
      totalMembers > 0 ? Number((totalMessages / totalMembers).toFixed(1)) : 0;
    const activeMembers = [
      ...new Set(rooms.flatMap((r) => r.messages.map((m) => m.senderId))),
    ].length;
    return {
      dateRange,
      period: { start: startDate, end: now },
      network: {
        totalSpaces: totalRooms,
        totalMembers,
        avgMembersPerSpace:
          totalRooms > 0 ? Number((totalMembers / totalRooms).toFixed(1)) : 0,
        crossTeamConnections,
        siloedUsers: siloedUsers.length,
      },
      engagement: {
        totalMessages,
        messagesPerMember,
        activeMembers,
        engagementRate:
          totalMembers > 0
            ? Number(((activeMembers / totalMembers) * 100).toFixed(1))
            : 0,
      },
      siloAnalysis: {
        hasSilos: siloedUsers.length > 0,
        siloCount: siloedUsers.length,
        recommendation:
          siloedUsers.length > 0
            ? "Encourage cross-team collaboration through shared channels and projects"
            : "Good cross-team collaboration detected",
      },
    };
  }

  async getMeetingEffectiveness(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const videoCalls = await prisma.videoCallRoom.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      include: { participants: true },
    });
    const events = await prisma.companyEvent.findMany({
      where: { tenantId, startDate: { gte: startDate } },
      include: { rsvps: true },
    });
    const totalMeetings = videoCalls.length + events.length;
    const totalDurationMin = videoCalls
      .filter((v) => v.startedAt && v.endedAt)
      .reduce((s, v) => {
        return (
          s +
          Math.round((v.endedAt!.getTime() - v.startedAt!.getTime()) / 60000)
        );
      }, 0);
    const avgDuration =
      videoCalls.filter((v) => v.startedAt && v.endedAt).length > 0
        ? Math.round(
            totalDurationMin /
              videoCalls.filter((v) => v.startedAt && v.endedAt).length,
          )
        : 0;
    const totalAttendees =
      videoCalls.reduce((s, v) => s + v.participants.length, 0) +
      events.reduce(
        (s, e) => s + e.rsvps.filter((r) => r.status === "ACCEPTED").length,
        0,
      );
    const totalRsvps = events.reduce((s, e) => s + e.rsvps.length, 0);
    const avgAttendees =
      totalMeetings > 0 ? Math.round(totalAttendees / totalMeetings) : 0;
    const attendanceRate =
      totalRsvps > 0
        ? Number(
            (
              (events.reduce(
                (s, e) =>
                  s + e.rsvps.filter((r) => r.status === "ACCEPTED").length,
                0,
              ) /
                totalRsvps) *
              100
            ).toFixed(1),
          )
        : 0;
    const decisions = videoCalls.length;
    return {
      dateRange,
      period: { start: startDate, end: now },
      summary: {
        totalMeetings,
        totalVideoCalls: videoCalls.length,
        totalEvents: events.length,
        totalDurationMinutes: totalDurationMin,
        avgDurationMinutes: avgDuration,
        totalAttendees,
        avgAttendeesPerMeeting: avgAttendees,
        attendanceRate,
      },
      videoCallMetrics: {
        total: videoCalls.length,
        byType: this.groupBy(videoCalls, "type"),
        avgParticipants:
          videoCalls.length > 0
            ? Number(
                (
                  videoCalls.reduce((s, v) => s + v.participants.length, 0) /
                  videoCalls.length
                ).toFixed(1),
              )
            : 0,
        durationTrend: videoCalls
          .filter((v) => v.startedAt && v.endedAt)
          .map((v) => ({
            id: v.id,
            name: v.name,
            durationMin: Math.round(
              (v.endedAt!.getTime() - v.startedAt!.getTime()) / 60000,
            ),
            participantCount: v.participants.length,
            date: v.startedAt,
          })),
      },
      eventMetrics: {
        total: events.length,
        averageRsvps:
          events.length > 0
            ? Number((totalRsvps / events.length).toFixed(1))
            : 0,
        attendanceRate,
      },
      effectivenessScore: Math.round(
        (avgAttendees > 2 ? 30 : 10) +
          (attendanceRate > 70 ? 30 : 10) +
          (avgDuration < 60 ? 20 : 10) +
          (decisions > 0 ? 20 : 0),
      ),
    };
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc: Record<string, number>, item: any) => {
      const val = item[key] || "UNKNOWN";
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }

  async getSearchAcrossCommunication(tenantId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return { query, totalResults: 0, results: [] };
    }
    const searchTerm = query.trim();
    const messages = await prisma.chatMessage.findMany({
      where: {
        tenantId,
        content: { contains: searchTerm, mode: "insensitive" },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { room: { select: { name: true } } },
    });
    const files = await prisma.communicationFileShare.findMany({
      where: {
        tenantId,
        name: { contains: searchTerm, mode: "insensitive" },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const channels = await prisma.chatChannel.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 50,
    });
    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 50,
    });
    const results = [
      ...messages.map((m) => ({
        type: "MESSAGE" as const,
        id: m.id,
        title: m.content.substring(0, 100),
        subtitle: `in ${m.room?.name ?? "a room"}`,
        date: m.createdAt,
        url: `/communication/rooms/${m.roomId}`,
      })),
      ...files.map((f) => ({
        type: "FILE" as const,
        id: f.id,
        title: f.name,
        subtitle: `${f.mimeType} - ${Math.round(f.size / 1024)} KB`,
        date: f.createdAt,
        url: `/communication/files/${f.id}`,
      })),
      ...channels.map((c) => ({
        type: "CHANNEL" as const,
        id: c.id,
        title: c.name,
        subtitle: c.slug,
        date: c.createdAt,
        url: `/communication/channels/${c.id}`,
      })),
      ...announcements.map((a) => ({
        type: "ANNOUNCEMENT" as const,
        id: a.id,
        title: a.title,
        subtitle: a.content.substring(0, 100),
        date: a.createdAt,
        url: `/communication/announcements/${a.id}`,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
    return {
      query: searchTerm,
      totalResults: results.length,
      breakdown: {
        messages: messages.length,
        files: files.length,
        channels: channels.length,
        announcements: announcements.length,
      },
      results,
    };
  }

  async getBotAnalytics(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const bots = await prisma.chatbotDefinition.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      include: {
        botConversations: {
          where: { startedAt: { gte: startDate } },
        },
        botIntents: true,
      },
    });
    const totalConversations = bots.reduce(
      (s, b) => s + b.botConversations.length,
      0,
    );
    const totalResolved = bots.reduce(
      (s, b) => s + b.botConversations.filter((c) => c.resolved).length,
      0,
    );
    const totalHandoffs = bots.reduce(
      (s, b) => s + b.botConversations.filter((c) => c.handedOff).length,
      0,
    );
    const totalIntents = bots.reduce((s, b) => s + b.botIntents.length, 0);
    const avgSatisfaction = (() => {
      const allScores = bots.flatMap((b) =>
        b.botConversations
          .map((c) => c.satisfaction)
          .filter((s): s is number => s !== null),
      );
      return allScores.length > 0
        ? Number(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(
              2,
            ),
          )
        : 0;
    })();
    const resolutionRate =
      totalConversations > 0
        ? Number(((totalResolved / totalConversations) * 100).toFixed(1))
        : 0;
    const automationSavings = totalResolved * 15;
    return {
      dateRange,
      period: { start: startDate, end: now },
      summary: {
        totalBots: bots.length,
        totalConversations,
        totalResolved,
        totalHandoffs,
        resolutionRate,
        avgSatisfaction,
        automationSavingsMinutes: automationSavings,
        automationSavingsHours: Number((automationSavings / 60).toFixed(1)),
      },
      bots: bots.map((b) => ({
        id: b.id,
        name: b.name,
        isActive: b.isActive,
        conversations: b.botConversations.length,
        resolved: b.botConversations.filter((c) => c.resolved).length,
        handoffs: b.botConversations.filter((c) => c.handedOff).length,
        intents: b.botIntents.length,
        avgSatisfaction: (() => {
          const scores = b.botConversations
            .map((c) => c.satisfaction)
            .filter((s): s is number => s !== null);
          return scores.length > 0
            ? Number(
                (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
              )
            : 0;
        })(),
      })),
      topIntents: [
        ...bots.flatMap((b) =>
          b.botIntents.map((i) => ({ botName: b.name, intentName: i.name })),
        ),
      ].slice(0, 20),
    };
  }

  async getComplianceMonitoring(tenantId: string, dateRange: string) {
    const now = new Date();
    let startDate: Date;
    if (dateRange === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const policies = await prisma.commRetentionPolicy.findMany({
      where: { tenantId, isActive: true },
    });
    const legalHolds = await prisma.legalHold.findMany({
      where: { tenantId, status: "ACTIVE", startDate: { lte: now } },
    });
    const messages = await prisma.chatMessage.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      take: 1000,
    });
    const files = await prisma.communicationFileShare.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
    });
    const retentionCompliance =
      policies.length > 0
        ? policies.map((p) => {
            const oldMessages = messages.filter((m) => {
              const ageDays =
                (now.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return ageDays > p.retentionDays;
            });
            return {
              policyId: p.id,
              policyName: p.name,
              retentionDays: p.retentionDays,
              scope: p.scope,
              expiredMessages: oldMessages.length,
              compliant: oldMessages.length === 0,
            };
          })
        : [];
    return {
      dateRange,
      period: { start: startDate, end: now },
      summary: {
        totalPolicies: policies.length,
        activeLegalHolds: legalHolds.length,
        messagesInPeriod: messages.length,
        filesInPeriod: files.length,
        retentionCompliant: retentionCompliance.every((r) => r.compliant),
        violations: retentionCompliance.filter((r) => !r.compliant).length,
      },
      retentionPolicies: retentionCompliance,
      legalHolds: legalHolds.map((lh) => ({
        id: lh.id,
        name: lh.name,
        matter: lh.matter,
        startDate: lh.startDate,
        endDate: lh.endDate,
        custodians: lh.custodians,
      })),
      eDiscovery: {
        totalMessagesAvailable: messages.length,
        totalFilesAvailable: files.length,
        dateRange: { start: startDate, end: now },
        exportFormats: ["PDF", "CSV", "JSON", "PST"],
      },
    };
  }

  async getCollaborationDashboardKpis(tenantId: string) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    const rooms = await prisma.chatRoom.findMany({ where: { tenantId } });
    const recentMessages = await prisma.chatMessage.findMany({
      where: { tenantId, createdAt: { gte: monthStart } },
    });
    const channels = await prisma.chatChannel.findMany({ where: { tenantId } });
    const recentFiles = await prisma.communicationFileShare.findMany({
      where: { tenantId, createdAt: { gte: monthStart } },
    });
    const recentCalls = await prisma.videoCallRoom.findMany({
      where: { tenantId, createdAt: { gte: monthStart } },
    });
    const bots = await prisma.chatbotDefinition.findMany({
      where: { tenantId, isActive: true },
    });
    const totalMessages = recentMessages.length;
    const uniqueSenders = new Set(recentMessages.map((m) => m.senderId)).size;
    const memberCount = await prisma.chatRoomMember.count({
      where: { tenantId },
    });
    const totalFileSize = recentFiles.reduce((s, f) => s + f.size, 0);
    const avgMessagesPerDay =
      30 > 0 ? Number((totalMessages / 30).toFixed(1)) : 0;
    return {
      totalRooms: rooms.length,
      totalChannels: channels.length,
      totalMessages: totalMessages,
      activeUsers: uniqueSenders,
      totalMembers: memberCount,
      totalFilesShared: recentFiles.length,
      totalFileSizeMB: Number((totalFileSize / (1024 * 1024)).toFixed(2)),
      totalMeetings: recentCalls.length,
      activeBots: bots.length,
      engagement: {
        avgMessagesPerDay,
        messagesPerUser:
          uniqueSenders > 0
            ? Number((totalMessages / uniqueSenders).toFixed(1))
            : 0,
      },
      summary: [
        { label: "Messages", value: totalMessages, icon: "message" },
        { label: "Active Users", value: uniqueSenders, icon: "users" },
        { label: "Files Shared", value: recentFiles.length, icon: "file" },
        { label: "Meetings", value: recentCalls.length, icon: "video" },
      ],
    };
  }
}
