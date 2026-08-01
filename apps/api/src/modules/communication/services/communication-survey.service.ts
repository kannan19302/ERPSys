import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CommunicationSurveyService {
  async getSurveys(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      surveyType?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.surveyType) where.surveyType = params.surveyType;
    const [data, total] = await Promise.all([
      prisma.commSurvey.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { questions: true, responses: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.commSurvey.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getSurvey(tenantId: string, id: string) {
    const survey = await prisma.commSurvey.findFirst({
      where: { id, tenantId },
      include: {
        questions: { orderBy: { sortOrder: "asc" } },
        responses: { include: { answers: true } },
      },
    });
    if (!survey) throw new NotFoundException("Survey not found");
    return survey;
  }

  async createSurvey(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      description?: string;
      surveyType?: string;
      settings?: any;
    },
  ) {
    return prisma.commSurvey.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        surveyType: dto.surveyType || "FEEDBACK",
        settings: dto.settings || {},
        createdBy: userId,
      },
    });
  }

  async updateSurvey(
    tenantId: string,
    id: string,
    dto: {
      title?: string;
      description?: string;
      status?: string;
      settings?: any;
    },
  ) {
    const existing = await prisma.commSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Survey not found");
    const data: any = { ...dto };
    if (dto.status === "PUBLISHED") data.publishedAt = new Date();
    if (dto.status === "CLOSED") data.closedAt = new Date();
    return prisma.commSurvey.update({ where: { id }, data });
  }

  async publishSurvey(tenantId: string, id: string) {
    const existing = await prisma.commSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Survey not found");
    const questionCount = await prisma.commSurveyQuestion.count({
      where: { surveyId: id },
    });
    if (questionCount === 0)
      throw new BadRequestException("Survey must have at least one question");
    return prisma.commSurvey.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  async deleteSurvey(tenantId: string, id: string) {
    const existing = await prisma.commSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Survey not found");
    return prisma.commSurvey.delete({ where: { id } });
  }

  async addQuestion(
    tenantId: string,
    surveyId: string,
    dto: {
      type: string;
      title: string;
      description?: string;
      required?: boolean;
      options?: any;
      validation?: any;
      sortOrder?: number;
    },
  ) {
    const existing = await prisma.commSurvey.findFirst({
      where: { id: surveyId, tenantId },
    });
    if (!existing) throw new NotFoundException("Survey not found");
    return prisma.commSurveyQuestion.create({
      data: {
        tenantId,
        surveyId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        required: dto.required || false,
        options: dto.options || [],
        validation: dto.validation || {},
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateQuestion(
    tenantId: string,
    id: string,
    dto: {
      type?: string;
      title?: string;
      description?: string;
      required?: boolean;
      options?: any;
      sortOrder?: number;
    },
  ) {
    const existing = await prisma.commSurveyQuestion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Question not found");
    return prisma.commSurveyQuestion.update({ where: { id }, data: dto });
  }

  async deleteQuestion(tenantId: string, id: string) {
    const existing = await prisma.commSurveyQuestion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Question not found");
    return prisma.commSurveyQuestion.delete({ where: { id } });
  }

  async collectResponse(
    tenantId: string,
    surveyId: string,
    dto: {
      respondentId?: string;
      respondentEmail?: string;
      answers: { questionId: string; value: any }[];
    },
  ) {
    const survey = await prisma.commSurvey.findFirst({
      where: { id: surveyId, tenantId },
    });
    if (!survey) throw new NotFoundException("Survey not found");
    if (survey.status !== "PUBLISHED")
      throw new BadRequestException("Survey is not published");
    if (
      survey.settings &&
      (survey.settings as any).expiryDate &&
      new Date((survey.settings as any).expiryDate) < new Date()
    ) {
      throw new BadRequestException("Survey has expired");
    }
    const response = await prisma.commSurveyResponse.create({
      data: {
        tenantId,
        surveyId,
        respondentId: dto.respondentId,
        respondentEmail: dto.respondentEmail,
      },
    });
    for (const ans of dto.answers) {
      await prisma.commSurveyAnswer.create({
        data: {
          tenantId,
          responseId: response.id,
          questionId: ans.questionId,
          value: ans.value,
        },
      });
    }
    await prisma.commSurvey.update({
      where: { id: surveyId },
      data: { responseCount: { increment: 1 } },
    });
    return response;
  }

  async analyzeResults(tenantId: string, surveyId: string) {
    const survey = await prisma.commSurvey.findFirst({
      where: { id: surveyId, tenantId },
      include: {
        questions: { orderBy: { sortOrder: "asc" } },
        responses: { include: { answers: true } },
      },
    });
    if (!survey) throw new NotFoundException("Survey not found");
    const analysis: any = {
      totalResponses: survey.responses.length,
      questions: [],
    };
    for (const q of survey.questions) {
      const answers = survey.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === q.id),
      );
      const counts: Record<string, number> = {};
      let sum = 0;
      let numericCount = 0;
      for (const a of answers) {
        const val =
          typeof a.value === "object"
            ? JSON.stringify(a.value)
            : String(a.value);
        counts[val] = (counts[val] || 0) + 1;
        const num = Number(a.value);
        if (!isNaN(num)) {
          sum += num;
          numericCount++;
        }
      }
      analysis.questions.push({
        questionId: q.id,
        title: q.title,
        type: q.type,
        totalAnswers: answers.length,
        distribution: counts,
        average: numericCount > 0 ? sum / numericCount : null,
      });
    }
    return analysis;
  }

  async getSurveyDashboard(tenantId: string) {
    const [
      totalSurveys,
      publishedCount,
      draftCount,
      totalResponses,
      surveysByType,
    ] = await Promise.all([
      prisma.commSurvey.count({ where: { tenantId } }),
      prisma.commSurvey.count({ where: { tenantId, status: "PUBLISHED" } }),
      prisma.commSurvey.count({ where: { tenantId, status: "DRAFT" } }),
      prisma.commSurveyResponse.count({ where: { tenantId } }),
      prisma.commSurvey.groupBy({
        by: ["surveyType"],
        where: { tenantId },
        _count: true,
      }),
    ]);
    return {
      totalSurveys,
      publishedCount,
      draftCount,
      totalResponses,
      surveysByType,
    };
  }

  async getSurveyTemplates(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return prisma.commSurveyTemplate.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async createSurveyTemplate(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      description?: string;
      category?: string;
      questions: any;
      settings?: any;
    },
  ) {
    return prisma.commSurveyTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        category: dto.category || "GENERAL",
        questions: dto.questions,
        settings: dto.settings || {},
        createdBy: userId,
      },
    });
  }

  async deleteSurveyTemplate(tenantId: string, id: string) {
    const existing = await prisma.commSurveyTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Template not found");
    return prisma.commSurveyTemplate.delete({ where: { id } });
  }
}
