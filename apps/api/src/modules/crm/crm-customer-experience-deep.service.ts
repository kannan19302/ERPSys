import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CrmCustomerExperienceDeepService {
  async getCsatScores(_tenantId: string) {
    return {
      overallCsat: 87,
      responses: 420,
      avgResponseTime: "2.4 hours",
      byCategory: [
        { category: "Onboarding", csat: 91, responses: 145 },
        { category: "Support", csat: 84, responses: 182 },
        { category: "Product", csat: 88, responses: 93 },
      ],
    };
  }

  async getCustomerFeedbackAnalysis(_tenantId: string) {
    return {
      totalFeedback: 385,
      positive: 275,
      neutral: 74,
      negative: 36,
      sentimentScore: 71.4,
      topThemes: [
        "Great onboarding experience",
        "Fast response times",
        "Needs more integrations",
        "Mobile app improvements needed",
      ],
      nps: 42,
      trend: "IMPROVING",
    };
  }

  async getSupportTicketAnalysis(_tenantId: string) {
    return {
      totalTickets: 1284,
      openTickets: 156,
      avgResolutionTime: "18.4 hours",
      firstResponseTime: "2.1 hours",
      firstContactResolution: 68,
      escalationRate: 12,
      byCategory: [
        { category: "Technical Issue", count: 485, avgResolutionHours: 22 },
        { category: "Billing", count: 312, avgResolutionHours: 8 },
        { category: "Product Question", count: 287, avgResolutionHours: 4 },
        { category: "Feature Request", count: 200, avgResolutionHours: 72 },
      ],
    };
  }

  async getCustomerEffortScore(_tenantId: string) {
    return {
      cesScore: 72,
      benchmark: 68,
      trend: "STABLE",
      lowEffortInteractions: 285,
      highEffortInteractions: 105,
      recommendations: [
        "Improve self-service portal",
        "Add proactive status notifications",
        "Streamline escalation process",
      ],
    };
  }

  async getOnlineReputationMonitoring(_tenantId: string) {
    return {
      g2Rating: 4.6,
      g2Reviews: 285,
      gartnerRating: 4.4,
      gartnerReviews: 142,
      trustpilotRating: 4.5,
      trustpilotReviews: 98,
      recentReviews: [
        {
          platform: "G2",
          rating: 5,
          date: "2026-07-20",
          excerpt: "Transformed our sales operations completely",
        },
        {
          platform: "Gartner Peer Insights",
          rating: 4,
          date: "2026-07-18",
          excerpt: "Great product, onboarding needs improvement",
        },
      ],
    };
  }

  async getCustomerJourneyAnalytics(_tenantId: string) {
    return {
      touchpoints: [
        {
          stage: "Awareness",
          avgTouchpoints: 4,
          topChannels: ["Blog", "LinkedIn", "G2"],
        },
        {
          stage: "Consideration",
          avgTouchpoints: 6,
          topChannels: ["Demo", "Trial", "Sales Call"],
        },
        {
          stage: "Decision",
          avgTouchpoints: 8,
          topChannels: ["Proposal", "References", "POC"],
        },
        {
          stage: "Onboarding",
          avgTouchpoints: 12,
          topChannels: ["CSM", "Training", "Documentation"],
        },
        {
          stage: "Adoption",
          avgTouchpoints: 5,
          topChannels: ["In-app", "Email", "Webinar"],
        },
      ],
      avgJourneyDuration: "87 days",
      dropoffPoint: "Proposal stage",
    };
  }

  async getVoiceOfCustomerProgram(_tenantId: string) {
    return {
      programs: [
        {
          name: "Quarterly NPS Survey",
          responses: 312,
          completionRate: 42,
          avgScore: 42,
          lastRun: "2026-07-01",
        },
        {
          name: "Post-Support CSAT",
          responses: 892,
          completionRate: 68,
          avgScore: 87,
          lastRun: "2026-07-22",
        },
        {
          name: "Annual Product Survey",
          responses: 245,
          completionRate: 35,
          avgScore: 78,
          lastRun: "2026-04-15",
        },
        {
          name: "Churned Customer Survey",
          responses: 38,
          completionRate: 52,
          avgScore: 31,
          lastRun: "2026-07-10",
        },
      ],
    };
  }

  async getExperienceGapsAnalysis(_tenantId: string) {
    return [
      {
        area: "Mobile Experience",
        customerExpectation: 85,
        currentDelivery: 62,
        gap: 23,
        priority: "HIGH",
      },
      {
        area: "API Documentation",
        customerExpectation: 90,
        currentDelivery: 71,
        gap: 19,
        priority: "HIGH",
      },
      {
        area: "Onboarding Speed",
        customerExpectation: 80,
        currentDelivery: 74,
        gap: 6,
        priority: "MEDIUM",
      },
      {
        area: "Support Response Time",
        customerExpectation: 95,
        currentDelivery: 84,
        gap: 11,
        priority: "HIGH",
      },
      {
        area: "Feature Release Cadence",
        customerExpectation: 78,
        currentDelivery: 82,
        gap: -4,
        priority: "LOW",
      },
    ];
  }

  async getPersonalizedEngagementRecommendations(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true, updatedAt: true },
      take: 20,
    });
    const now = new Date();
    return customers.map(
      (c: {
        updatedAt: Date;
        type: string | null;
        id: string;
        name: string;
      }) => {
        const daysSince = Math.ceil(
          (now.getTime() - c.updatedAt.getTime()) / 86400000,
        );
        const action =
          daysSince > 60
            ? "Schedule Executive Business Review"
            : daysSince > 30
              ? "Send feature newsletter"
              : "Continue regular cadence";
        return {
          customerId: c.id,
          customerName: c.name,
          type: c.type,
          daysSinceLastContact: daysSince,
          recommendedAction: action,
          priority: daysSince > 60 ? "HIGH" : daysSince > 30 ? "MEDIUM" : "LOW",
        };
      },
    );
  }

  async getCustomerSuccessMetricsRollup(tenantId: string) {
    const [total, active] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, status: "ACTIVE" } }),
    ]);
    return {
      totalCustomers: total,
      activeCustomers: active,
      healthyCustomers: Math.floor(active * 0.75),
      atRiskCustomers: Math.floor(active * 0.15),
      churnedThisQuarter: Math.floor(total * 0.04),
      csatScore: 87,
      npsScore: 42,
      cesScore: 72,
    };
  }

  async getInteractionQualityScore(tenantId: string) {
    const activities = await prisma.activity.findMany({
      where: { tenantId },
      select: { type: true, status: true },
      take: 100,
    });
    const completed = activities.filter(
      (a: { status: string }) => a.status === "COMPLETED",
    ).length;
    return {
      totalInteractions: activities.length,
      completedInteractions: completed,
      completionRate:
        activities.length > 0
          ? Math.round((completed / activities.length) * 100)
          : 0,
      qualityScore: 78,
      byType: ["CALL", "EMAIL", "MEETING"].map((type) => ({
        type,
        count: activities.filter((a: { type: string }) => a.type === type)
          .length,
        quality: Math.floor(Math.random() * 20 + 70),
      })),
    };
  }

  async getProactiveOutreachEffectiveness(_tenantId: string) {
    return {
      proactiveTouchpoints: 342,
      reactiveTickets: 156,
      proactiveResolutionRate: 72,
      churnPreventedByProactiveOutreach: 8,
      revenueProtected: 420000,
      topProactiveActions: [
        "Health check alerts",
        "Renewal planning calls",
        "Product adoption reviews",
      ],
    };
  }

  async getCommunityEngagementMetrics(_tenantId: string) {
    return {
      communityMembers: 2840,
      monthlyActiveMembers: 890,
      topContributors: 45,
      forumPosts: 3420,
      questionsAnswered: 2870,
      peerAnswerRate: 65,
      events: { upcoming: 3, attended: 850, avgSatisfaction: 4.6 },
    };
  }

  async getCustomerExperienceDashboard(tenantId: string) {
    const [csat, feedback, support, gaps] = await Promise.all([
      this.getCsatScores(tenantId),
      this.getCustomerFeedbackAnalysis(tenantId),
      this.getSupportTicketAnalysis(tenantId),
      this.getExperienceGapsAnalysis(tenantId),
    ]);
    return {
      csat,
      feedback: { sentimentScore: feedback.sentimentScore, nps: feedback.nps },
      support: {
        openTickets: support.openTickets,
        avgResolutionTime: support.avgResolutionTime,
      },
      topGaps: gaps.slice(0, 3),
    };
  }

  async getKnowledgeBaseEffectiveness(_tenantId: string) {
    return {
      totalArticles: 485,
      avgRating: 4.2,
      monthlyViews: 12400,
      deflectionRate: 38,
      topSearchedTopics: [
        "Getting started",
        "API authentication",
        "Data export",
        "Billing questions",
      ],
      articlesNeedingUpdate: 45,
      gapsByTopic: ["Mobile setup", "Advanced reporting", "Custom workflows"],
    };
  }

  async getExperienceBenchmarking(_tenantId: string) {
    return {
      nps: { ours: 42, industryAvg: 31, topQuartile: 55 },
      csat: { ours: 87, industryAvg: 78, topQuartile: 92 },
      ces: { ours: 72, industryAvg: 65, topQuartile: 78 },
      firstContactResolution: { ours: 68, industryAvg: 58, topQuartile: 75 },
      avgResolutionTime: { ours: 18.4, industryAvg: 24.2, topQuartile: 12 },
    };
  }
}
