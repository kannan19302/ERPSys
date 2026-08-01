import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { prisma } from "@unerp/database";
import type { UpdatePeopleProfileInput } from "@unerp/shared";

/** Max in-DB size for the pronunciation clip (base64 data URL), matching the avatar convention. */
const MAX_AUDIO_BYTES = 400 * 1024;

export interface ProfileCard {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  employeeId: string;
  pronouns: string | null;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  overview: string | null;
  pronunciationAudioUrl: string | null;
  timezone: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string[];
  workingLocation: string | null;
  organization: { id: string; name: string; slug: string };
  presence: {
    status: string;
    visibility: string;
    statusText: string | null;
    statusEmoji: string | null;
    clearAt: string | null;
  } | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  directReportsCount: number;
  colleagueCount: number;
  isSelf: boolean;
}

@Injectable()
export class PeopleService {
  /** Generates a 6-digit employee id, retrying on the rare collision. */
  private async generateEmployeeId(tenantId: string): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = String(randomInt(100000, 1000000));
      const exists = await prisma.userProfile.findUnique({
        where: { tenantId_employeeId: { tenantId, employeeId: candidate } },
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException(
      "Could not allocate a unique employee id — try again.",
    );
  }

  /** Auto-provisions a UserProfile row on first access — every user gets one lazily, no manual setup step. */
  async getOrCreateProfile(tenantId: string, userId: string) {
    let profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      const employeeId = await this.generateEmployeeId(tenantId);
      profile = await prisma.userProfile.create({
        data: { tenantId, userId, employeeId },
      });
    }
    return profile;
  }

  /**
   * Builds the compact hover-card payload for `targetUserId` as seen by
   * `viewerUserId`. Presence honors the same EVERYONE/ORG_ONLY/NOBODY
   * visibility rule the Connect module already enforces — a profile card
   * must not leak more than the status dot already would.
   */
  async getProfileCard(
    tenantId: string,
    viewerUserId: string,
    targetUserId: string,
  ): Promise<ProfileCard> {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      include: { tenant: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const profile = await this.getOrCreateProfile(tenantId, targetUserId);

    const [department, manager, directReportsCount, presenceRow] =
      await Promise.all([
        profile.departmentId
          ? prisma.department.findUnique({
              where: { id: profile.departmentId },
              select: { id: true, name: true },
            })
          : Promise.resolve(null),
        profile.managerId
          ? prisma.user.findUnique({
              where: { id: profile.managerId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            })
          : Promise.resolve(null),
        prisma.userProfile.count({
          where: { tenantId, managerId: targetUserId },
        }),
        prisma.userPresence.findUnique({
          where: { tenantId_userId: { tenantId, userId: targetUserId } },
        }),
      ]);

    const colleagueCount = profile.departmentId
      ? await prisma.userProfile.count({
          where: {
            tenantId,
            departmentId: profile.departmentId,
            userId: { not: targetUserId },
          },
        })
      : 0;

    const isSelf = viewerUserId === targetUserId;
    let presence: ProfileCard["presence"] = null;
    if (presenceRow) {
      // The viewer is always same-tenant here (every query above is scoped
      // by the caller's own RLS session), so ORG_ONLY is always satisfied —
      // only NOBODY hides the status from a non-self viewer.
      const visible =
        isSelf ||
        presenceRow.visibility === "EVERYONE" ||
        presenceRow.visibility === "ORG_ONLY";
      if (visible) {
        presence = {
          status: presenceRow.presence,
          visibility: presenceRow.visibility,
          statusText: presenceRow.statusText,
          statusEmoji: presenceRow.statusEmoji,
          clearAt: presenceRow.clearAt
            ? presenceRow.clearAt.toISOString()
            : null,
        };
      }
    }

    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      employeeId: profile.employeeId,
      pronouns: profile.pronouns,
      jobTitle: profile.jobTitle,
      department: department ?? null,
      overview: profile.overview,
      pronunciationAudioUrl: profile.pronunciationAudioUrl,
      timezone: profile.timezone,
      workingHoursStart: profile.workingHoursStart,
      workingHoursEnd: profile.workingHoursEnd,
      workingDays: Array.isArray(profile.workingDays)
        ? (profile.workingDays as string[])
        : [],
      workingLocation: profile.workingLocation,
      organization: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
      presence,
      manager: manager ?? null,
      directReportsCount,
      colleagueCount,
      isSelf,
    };
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    dto: UpdatePeopleProfileInput,
  ) {
    await this.getOrCreateProfile(tenantId, userId);

    if (dto.managerId) {
      if (dto.managerId === userId) {
        throw new BadRequestException("You cannot be your own manager.");
      }
      const managerExists = await prisma.user.findFirst({
        where: { id: dto.managerId, tenantId },
      });
      if (!managerExists)
        throw new BadRequestException(
          "Manager not found in this organization.",
        );
      // Prevent a reporting-line cycle (A manages B manages A, or deeper).
      let cursor: string | null = dto.managerId;
      const seen = new Set<string>([userId]);
      for (let i = 0; i < 20 && cursor; i++) {
        if (seen.has(cursor)) {
          throw new BadRequestException(
            "That would create a circular reporting line.",
          );
        }
        seen.add(cursor);
        const cursorProfile: { managerId: string | null } | null =
          await prisma.userProfile.findUnique({
            where: { userId: cursor },
            select: { managerId: true },
          });
        cursor = cursorProfile?.managerId ?? null;
      }
    }
    if (dto.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: dto.departmentId, tenantId },
      });
      if (!dept) throw new BadRequestException("Department not found.");
    }

    return prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.pronouns !== undefined ? { pronouns: dto.pronouns } : {}),
        ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
        ...(dto.departmentId !== undefined
          ? { departmentId: dto.departmentId }
          : {}),
        ...(dto.managerId !== undefined ? { managerId: dto.managerId } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.workingHoursStart !== undefined
          ? { workingHoursStart: dto.workingHoursStart }
          : {}),
        ...(dto.workingHoursEnd !== undefined
          ? { workingHoursEnd: dto.workingHoursEnd }
          : {}),
        ...(dto.workingDays !== undefined
          ? { workingDays: dto.workingDays }
          : {}),
        ...(dto.workingLocation !== undefined
          ? { workingLocation: dto.workingLocation }
          : {}),
        ...(dto.overview !== undefined ? { overview: dto.overview } : {}),
      },
    });
  }

  async uploadPronunciation(
    tenantId: string,
    userId: string,
    audioDataUrl: string,
  ) {
    // data URLs are ~4/3 the binary size; this bounds the actual clip length.
    if (audioDataUrl.length > (MAX_AUDIO_BYTES * 4) / 3) {
      throw new BadRequestException(
        "Recording is too long — keep it under a few seconds.",
      );
    }
    await this.getOrCreateProfile(tenantId, userId);
    return prisma.userProfile.update({
      where: { userId },
      data: { pronunciationAudioUrl: audioDataUrl },
    });
  }

  async removePronunciation(userId: string) {
    return prisma.userProfile.update({
      where: { userId },
      data: { pronunciationAudioUrl: null },
    });
  }

  /** Direct reports of `userId` — for the profile page's "Reports to me" list. */
  async listDirectReports(tenantId: string, userId: string) {
    const rows = await prisma.userProfile.findMany({
      where: { tenantId, managerId: userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { user: { firstName: "asc" } },
    });
    return rows.map((r) => ({
      ...r.user,
      jobTitle: r.jobTitle,
      employeeId: r.employeeId,
    }));
  }

  /** Same-department colleagues, excluding the user themself. */
  async listColleagues(tenantId: string, userId: string) {
    const profile = await this.getOrCreateProfile(tenantId, userId);
    if (!profile.departmentId) return [];
    const rows = await prisma.userProfile.findMany({
      where: {
        tenantId,
        departmentId: profile.departmentId,
        userId: { not: userId },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { user: { firstName: "asc" } },
    });
    return rows.map((r) => ({
      ...r.user,
      jobTitle: r.jobTitle,
      employeeId: r.employeeId,
    }));
  }

  /**
   * Org chart centered on `userId`: manager, self, and direct reports — the
   * "one level up, one level down" slice Teams-style cards show, expandable
   * client-side by re-calling this for any node clicked on.
   */
  async getOrgChartNode(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const profile = await this.getOrCreateProfile(tenantId, userId);

    const [manager, reports, presenceRows] = await Promise.all([
      profile.managerId
        ? prisma.user.findUnique({
            where: { id: profile.managerId },
            select: { id: true, firstName: true, lastName: true, avatar: true },
          })
        : Promise.resolve(null),
      prisma.userProfile.findMany({
        where: { tenantId, managerId: userId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { user: { firstName: "asc" } },
      }),
      prisma.userPresence.findMany({ where: { tenantId } }),
    ]);

    const presenceByUser = new Map(
      presenceRows.map((p) => [p.userId, p.presence]),
    );

    return {
      self: {
        ...user,
        jobTitle: profile.jobTitle,
        presence: presenceByUser.get(user.id) ?? null,
      },
      manager: manager
        ? { ...manager, presence: presenceByUser.get(manager.id) ?? null }
        : null,
      directReports: reports.map((r) => ({
        ...r.user,
        jobTitle: r.jobTitle,
        presence: presenceByUser.get(r.user.id) ?? null,
      })),
    };
  }

  /** Searchable org directory — name/email/job title, for the manager picker and a browsable directory. */
  async searchDirectory(tenantId: string, query: string, limit = 25) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        OR: query
          ? [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ]
          : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
      take: limit,
      orderBy: { firstName: "asc" },
    });
    if (users.length === 0) return [];
    const profiles = await prisma.userProfile.findMany({
      where: { tenantId, userId: { in: users.map((u) => u.id) } },
      select: { userId: true, jobTitle: true, employeeId: true },
    });
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
    return users.map((u) => ({
      ...u,
      jobTitle: profileByUser.get(u.id)?.jobTitle ?? null,
      employeeId: profileByUser.get(u.id)?.employeeId ?? null,
    }));
  }

  /** Full profile-page payload for the signed-in user, including editable fields as-is. */
  /**
   * Full profile-page payload for the signed-in user. Includes the basic
   * User identity fields (name/email/avatar) and tenant name inline so the
   * profile page needs exactly one request instead of stitching this
   * together with a separate /auth/me call.
   */
  async getMyFullProfile(tenantId: string, userId: string) {
    const profile = await this.getOrCreateProfile(tenantId, userId);
    const [user, department, manager, directReports, colleagues] =
      await Promise.all([
        prisma.user.findFirst({
          where: { id: userId, tenantId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        }),
        profile.departmentId
          ? prisma.department.findUnique({
              where: { id: profile.departmentId },
              select: { id: true, name: true },
            })
          : Promise.resolve(null),
        profile.managerId
          ? prisma.user.findUnique({
              where: { id: profile.managerId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            })
          : Promise.resolve(null),
        this.listDirectReports(tenantId, userId),
        this.listColleagues(tenantId, userId),
      ]);
    if (!user) throw new NotFoundException("User not found");
    return {
      ...profile,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      organization: user.tenant,
      department,
      manager,
      directReports,
      colleagues,
    };
  }

  /** Exports everything this profile-card feature stores about the caller — GDPR-style self-service export. */
  async exportMyData(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    const profile = await this.getMyFullProfile(tenantId, userId);
    const loginHistory = await prisma.loginHistory.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return {
      user,
      profile,
      loginHistory,
      exportedAt: new Date().toISOString(),
    };
  }
}
