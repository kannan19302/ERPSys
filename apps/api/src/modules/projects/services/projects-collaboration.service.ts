// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  PostDiscussionDto,
  ReplyToDiscussionDto,
  CreateDocumentReviewDto,
  CreateWikiPageDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsCollaborationService {
  async getDiscussions(tenantId: string, projectId: string) {
    return prisma.projectDiscussion.findMany({
      where: { tenantId, projectId },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }

  async postDiscussion(
    tenantId: string,
    dto: PostDiscussionDto,
    authorId: string,
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const discussion = await prisma.projectDiscussion.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        title: dto.title,
        content: dto.content,
        authorId,
        tags: dto.tags || null,
      },
    });
    await prisma.projectFeedEvent.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        userId: authorId,
        eventType: "DISCUSSION",
        title: `New discussion: ${dto.title}`,
        description: dto.content.substring(0, 200),
        metadata: { discussionId: discussion.id },
      },
    });
    return discussion;
  }

  async replyToDiscussion(
    tenantId: string,
    discussionId: string,
    dto: ReplyToDiscussionDto,
    authorId: string,
  ) {
    const discussion = await prisma.projectDiscussion.findFirst({
      where: { id: discussionId, tenantId },
    });
    if (!discussion) throw new NotFoundException("Discussion not found");
    const reply = await prisma.discussionReply.create({
      data: {
        tenantId,
        discussionId,
        content: dto.content,
        authorId,
        parentReplyId: dto.parentReplyId || null,
      },
    });
    await prisma.projectFeedEvent.create({
      data: {
        tenantId,
        projectId: discussion.projectId,
        userId: authorId,
        eventType: "COMMENT",
        title: `Reply on: ${discussion.title}`,
        description: dto.content.substring(0, 200),
        metadata: { discussionId: discussion.id, replyId: reply.id },
      },
    });
    return reply;
  }

  async markAsSolution(tenantId: string, replyId: string) {
    const reply = await prisma.discussionReply.findFirst({
      where: { id: replyId, tenantId },
    });
    if (!reply) throw new NotFoundException("Reply not found");
    await prisma.discussionReply.updateMany({
      where: { discussionId: reply.discussionId },
      data: { isSolution: false },
    });
    return prisma.discussionReply.update({
      where: { id: replyId },
      data: { isSolution: true },
    });
  }

  async togglePinDiscussion(tenantId: string, discussionId: string) {
    const discussion = await prisma.projectDiscussion.findFirst({
      where: { id: discussionId, tenantId },
    });
    if (!discussion) throw new NotFoundException("Discussion not found");
    return prisma.projectDiscussion.update({
      where: { id: discussionId },
      data: { isPinned: !discussion.isPinned },
    });
  }

  async createDocumentReview(tenantId: string, dto: CreateDocumentReviewDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.documentReview.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        documentId: dto.documentId || null,
        title: dto.title,
        description: dto.description || null,
        reviewerId: dto.reviewerId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async updateDocumentReview(
    tenantId: string,
    reviewId: string,
    dto: { status?: string; comments?: string },
  ) {
    const review = await prisma.documentReview.findFirst({
      where: { id: reviewId, tenantId },
    });
    if (!review) throw new NotFoundException("Document review not found");
    return prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        status: dto.status !== undefined ? dto.status : undefined,
        comments: dto.comments !== undefined ? dto.comments : undefined,
      },
    });
  }

  async getDocumentReviews(tenantId: string, projectId: string) {
    return prisma.documentReview.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProjectFeed(tenantId: string, projectId: string) {
    return prisma.projectFeedEvent.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getWikiPage(tenantId: string, projectId: string, slug: string) {
    const page = await prisma.projectWikiPage.findFirst({
      where: { tenantId, projectId, slug },
    });
    if (!page) throw new NotFoundException("Wiki page not found");
    return page;
  }

  async createWikiPage(
    tenantId: string,
    dto: CreateWikiPageDto,
    authorId: string,
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const page = await prisma.projectWikiPage.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        authorId,
      },
    });
    await prisma.projectFeedEvent.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        userId: authorId,
        eventType: "WIKI_UPDATE",
        title: `Wiki page created: ${dto.title}`,
        description: null,
        metadata: { wikiPageId: page.id, slug: dto.slug },
      },
    });
    return page;
  }

  async updateWikiPage(
    tenantId: string,
    wikiPageId: string,
    dto: { title?: string; content?: string },
    authorId: string,
  ) {
    const page = await prisma.projectWikiPage.findFirst({
      where: { id: wikiPageId, tenantId },
    });
    if (!page) throw new NotFoundException("Wiki page not found");
    return prisma.projectWikiPage.update({
      where: { id: wikiPageId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        version: { increment: 1 },
        ...(authorId ? { authorId } : {}),
      },
    });
  }

  async getCollaborationDashboard(tenantId: string, projectId: string) {
    const discussionsCount = await prisma.projectDiscussion.count({
      where: { tenantId, projectId },
    });
    const openReviews = await prisma.documentReview.count({
      where: { tenantId, projectId, status: { in: ["PENDING", "IN_REVIEW"] } },
    });
    const wikiPages = await prisma.projectWikiPage.count({
      where: { tenantId, projectId },
    });
    const feedEvents = await prisma.projectFeedEvent.count({
      where: { tenantId, projectId },
    });
    return {
      projectId,
      totalDiscussions: discussionsCount,
      openReviews,
      wikiPages,
      totalFeedEvents: feedEvents,
    };
  }
}
