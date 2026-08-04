import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommunicationSurveyService } from "../services/communication-survey.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    commSurvey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    commSurveyQuestion: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    commSurveyResponse: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    commSurveyAnswer: { create: vi.fn() },
    commSurveyTemplate: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("CommunicationSurveyService", () => {
  let svc: CommunicationSurveyService;

  beforeEach(() => {
    svc = new CommunicationSurveyService();
    vi.clearAllMocks();
  });

  it("returns paginated surveys", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findMany).mockResolvedValue([
      { id: "s1", _count: { questions: 3, responses: 5 } },
    ] as never);
    vi.mocked(prisma.commSurvey.count).mockResolvedValue(1);
    const res = await svc.getSurveys("t1", { page: 1, limit: 20 });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("throws on missing survey", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue(null as never);
    await expect(svc.getSurvey("t1", "bad")).rejects.toThrow(
      "Survey not found",
    );
  });

  it("creates a survey", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.create).mockResolvedValue({
      id: "s1",
      title: "Feedback",
    } as never);
    const res = await svc.createSurvey("t1", "u1", {
      title: "Feedback",
      surveyType: "NPS",
    });
    expect(res.title).toBe("Feedback");
  });

  it("publishes a survey", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue({
      id: "s1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.commSurvey.update).mockResolvedValue({
      id: "s1",
      status: "PUBLISHED",
    } as never);
    const res = await svc.publishSurvey("t1", "s1");
    expect(res.status).toBe("PUBLISHED");
  });

  it("deletes a survey", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue({
      id: "s1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.commSurvey.delete).mockResolvedValue({} as never);
    await svc.deleteSurvey("t1", "s1");
    expect(prisma.commSurvey.delete).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
  });

  it("adds a question to a survey", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue({
      id: "s1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.commSurveyQuestion.count).mockResolvedValue(0);
    vi.mocked(prisma.commSurveyQuestion.create).mockResolvedValue({
      id: "q1",
      text: "Rate us",
      sortOrder: 1,
    } as never);
    const res = await svc.addQuestion("t1", "s1", {
      text: "Rate us",
      type: "RATING",
    });
    expect(res.sortOrder).toBe(1);
  });

  it("collects a survey response", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue({
      id: "s1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.commSurveyResponse.create).mockResolvedValue({
      id: "r1",
      respondentId: "u1",
    } as never);
    vi.mocked(prisma.commSurveyAnswer.create).mockResolvedValue({} as never);
    const res = await svc.collectResponse("t1", "s1", {
      respondentId: "u1",
      answers: [{ questionId: "q1", value: "5" }],
    });
    expect(res.respondentId).toBe("u1");
    expect(prisma.commSurveyAnswer.create).toHaveBeenCalled();
  });

  it("analyzes survey results", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurvey.findFirst).mockResolvedValue({
      id: "s1",
      tenantId: "t1",
      title: "NPS",
      questions: [{ id: "q1", text: "Score", type: "RATING" }],
      responses: [],
    } as never);
    vi.mocked(prisma.commSurveyAnswer.findMany).mockResolvedValue([
      { value: "5" },
      { value: "4" },
    ] as never);
    const res = await svc.analyzeResults("t1", "s1");
    expect(res.totalResponses).toBe(0);
    expect(res.questionBreakdown).toBeDefined();
  });

  it("returns survey templates", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurveyTemplate.findMany).mockResolvedValue([
      { id: "t1", title: "NPS Template" },
    ] as never);
    const res = await svc.getSurveyTemplates("t1");
    expect(res).toHaveLength(1);
  });

  it("creates a survey template", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.commSurveyTemplate.create).mockResolvedValue({
      id: "t1",
      title: "Feedback",
    } as never);
    const res = await svc.createSurveyTemplate("t1", "u1", {
      title: "Feedback",
    });
    expect(res.title).toBe("Feedback");
  });
});
