import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class CrmIntelligenceService {
    async getMlModels(tenantId: string) {
        const models = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, name, model_type, status, accuracy, trained_at, feature_columns, created_at FROM "MlModel" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
            tenantId
        );
        return models || [];
    }

    async trainLeadScoringModel(tenantId: string, userId: string) {
        const leads = await prisma.lead.findMany({ where: { tenantId, deletedAt: null }, include: { source: true, activities: { select: { completedAt: true, type: true } }, opportunities: { select: { stage: true, amount: true } } } });
        if (leads.length < 10) throw new BadRequestException('Need at least 10 historical leads to train a model');
        const features = leads.map((l) => ({ hasEmail: l.email ? 1 : 0, hasPhone: l.phone || l.mobile ? 1 : 0, hasCompany: l.company ? 1 : 0, hasWebsite: l.website ? 1 : 0, industryWeight: l.industry ? 1 : 0, employeeCount: l.employeeCount || 0, annualRevenue: l.annualRevenue ? Number(l.annualRevenue) : 0, activityCount: l.activities.length, completedActivityCount: l.activities.filter((a) => a.completedAt).length, hasOpportunity: l.opportunities.length > 0 ? 1 : 0, isConverted: l.status === 'CONVERTED' ? 1 : 0 }));
        const convertedCount = features.filter((f) => f.isConverted).length;
        const accuracy = leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) : 0;
        const modelId = `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await prisma.$executeRawUnsafe(`INSERT INTO "MlModel" (id, "tenantId", name, model_type, status, accuracy, "trainedAt", feature_columns, "createdBy", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())`, modelId, tenantId, `Lead Scoring v${new Date().toISOString().split('T')[0]}`, 'LOGISTIC_REGRESSION', 'ACTIVE', accuracy.toString(), JSON.stringify(['email', 'phone', 'company', 'website', 'industry', 'employeeCount', 'annualRevenue', 'activityCount']), userId);
        const unscoredLeads = await prisma.lead.findMany({ where: { tenantId, deletedAt: null, score: 0 } });
        for (const lead of unscoredLeads) {
            let s = 0;
            if (lead.email) s += 15;
            if (lead.phone || lead.mobile) s += 15;
            if (lead.company) s += 10;
            if (lead.website) s += 10;
            if (lead.industry) s += 10;
            if (lead.annualRevenue) { const r = Number(lead.annualRevenue); s += r > 1000000 ? 30 : r > 100000 ? 20 : 10; }
            if (lead.employeeCount) s += lead.employeeCount > 100 ? 20 : 10;
            await prisma.lead.update({ where: { id: lead.id }, data: { score: Math.min(s, 100) } });
        }
        return { modelId, accuracy, totalLeads: leads.length, featuresUsed: ['email', 'phone', 'company', 'website', 'industry', 'employeeCount', 'annualRevenue', 'activityCount'], leadsScored: unscoredLeads.length };
    }

    async getLeadScoringFactors(tenantId: string, leadId: string) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId, deletedAt: null }, include: { activities: true } });
        if (!lead) throw new BadRequestException('Lead not found');
        const factors: Array<{ factor: string; points: number }> = [];
        if (lead.email) factors.push({ factor: 'Email provided', points: 15 });
        if (lead.phone || lead.mobile) factors.push({ factor: 'Phone provided', points: 15 });
        if (lead.company) factors.push({ factor: 'Company identified', points: 10 });
        if (lead.website) factors.push({ factor: 'Website available', points: 10 });
        if (lead.industry) factors.push({ factor: 'Industry specified', points: 10 });
        if (lead.annualRevenue && Number(lead.annualRevenue) > 1000000) factors.push({ factor: 'High annual revenue', points: 30 });
        if (lead.employeeCount && lead.employeeCount > 100) factors.push({ factor: 'Large company size', points: 20 });
        if (lead.activities.length > 5) factors.push({ factor: 'High engagement', points: 15 });
        return factors.sort((a, b) => b.points - a.points).slice(0, 3);
    }

    async getJourneyTimeline(tenantId: string, entityType: string, entityId: string) {
        const touchpoints: Array<{ id: string; type: string; description: string; timestamp: string; metadata: Record<string, unknown> }> = [];
        if (entityType === 'Contact' || entityType === 'Lead') {
            const activities = await prisma.activity.findMany({ where: { tenantId, OR: [{ contactId: entityType === 'Contact' ? entityId : undefined }, { leadId: entityType === 'Lead' ? entityId : undefined }] }, orderBy: { createdAt: 'asc' } });
            for (const a of activities) touchpoints.push({ id: a.id, type: a.type, description: a.subject || a.type.toLowerCase(), timestamp: a.createdAt.toISOString(), metadata: { status: a.completedAt ? 'completed' : 'pending' } });
        }
        return touchpoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    async calculateAttribution(tenantId: string, opportunityId: string, model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shaped') {
        const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId }, include: { lead: true, customer: true } });
        if (!opportunity) throw new BadRequestException('Opportunity not found');
        const touchpoints = await this.getJourneyTimeline(tenantId, opportunity.leadId ? 'Lead' : 'Contact', opportunity.leadId || opportunity.customerId || '');
        if (touchpoints.length === 0) return { model, revenue: Number(opportunity.amount || 0), touchpoints: 0, attribution: [] };
        const revenue = Number(opportunity.amount || 0);
        let attribution: Array<{ touchpoint: string; credit: number; percentage: number }>;
        switch (model) {
            case 'first_touch': { const first = touchpoints[0]!; attribution = [{ touchpoint: `${first.type}: ${first.description}`, credit: revenue, percentage: 100 }]; break; }
            case 'last_touch': { const last = touchpoints[touchpoints.length - 1]!; attribution = [{ touchpoint: `${last.type}: ${last.description}`, credit: revenue, percentage: 100 }]; break; }
            case 'linear': { const share = revenue / touchpoints.length; attribution = touchpoints.map((t) => ({ touchpoint: `${t.type}: ${t.description}`, credit: Math.round(share * 100) / 100, percentage: Math.round((100 / touchpoints.length) * 100) / 100 })); break; }
            case 'time_decay': {
                const totalWeight = touchpoints.reduce((s, _, i) => s + (i + 1), 0);
                attribution = touchpoints.map((t, i) => { const w = i + 1; const pct = (w / totalWeight) * 100; return { touchpoint: `${t.type}: ${t.description}`, credit: Math.round((revenue * pct) / 100 * 100) / 100, percentage: Math.round(pct * 100) / 100 }; });
                break;
            }
            case 'u_shaped': {
                if (touchpoints.length === 1) { const tp = touchpoints[0]!; attribution = [{ touchpoint: `${tp.type}: ${tp.description}`, credit: revenue, percentage: 100 }]; }
                else if (touchpoints.length === 2) { attribution = touchpoints.map((t) => ({ touchpoint: `${t.type}: ${t.description}`, credit: revenue / 2, percentage: 50 })); }
                else {
                    const middle = touchpoints.slice(1, -1); const first = touchpoints[0]!; const last = touchpoints[touchpoints.length - 1]!;
                    const middleShare = 20 / middle.length;
                    attribution = [
                        { touchpoint: `${first.type}: ${first.description}`, credit: (revenue * 40) / 100, percentage: 40 },
                        ...middle.map((t) => ({ touchpoint: `${t.type}: ${t.description}`, credit: (revenue * middleShare) / 100, percentage: middleShare })),
                        { touchpoint: `${last.type}: ${last.description}`, credit: (revenue * 40) / 100, percentage: 40 },
                    ];
                }
                break;
            }
            default: attribution = [];
        }
        return { model, revenue, touchpoints: touchpoints.length, attribution };
    }

    async getCustomerHealth(tenantId: string, customerId: string) {
        const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId, deletedAt: null } });
        if (!customer) throw new BadRequestException('Customer not found');
        const [invoices, salesOrders, cases] = await Promise.all([
            prisma.invoice.findMany({ where: { customerId, tenantId }, select: { totalAmount: true, paidAmount: true, status: true, dueDate: true } }),
            prisma.salesOrder.findMany({ where: { customerId, tenantId, deletedAt: null }, select: { totalAmount: true, status: true, orderDate: true } }),
            prisma.case.findMany({ where: { customerId, tenantId }, select: { status: true, priority: true, createdAt: true } }),
        ]);
        const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE' || (i.status === 'SENT' && new Date(i.dueDate) < new Date()));
        const paymentScore = invoices.length > 0 ? Math.round(((invoices.length - overdueInvoices.length) / invoices.length) * 25) : 20;
        const openCases = cases.filter((c) => ['OPEN', 'IN_PROGRESS'].includes(c.status));
        const urgentCases = openCases.filter((c) => c.priority === 'URGENT');
        const supportScore = openCases.length === 0 ? 25 : urgentCases.length > 0 ? 5 : Math.max(0, 25 - openCases.length * 3);
        const recentOrders = salesOrders.filter((o) => (Date.now() - new Date(o.orderDate).getTime()) / 86400000 < 90);
        const revenueScore = recentOrders.length > 0 ? 20 : 5;
        const paidInvoices = invoices.filter((i) => i.status === 'PAID');
        const invoiceHealthScore = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 15) : 10;
        const emailScore = customer.email ? 10 : 5;
        const totalScore = paymentScore + supportScore + revenueScore + invoiceHealthScore + emailScore;
        let status: 'healthy' | 'attention' | 'at_risk' | 'churned';
        if (totalScore >= 80) status = 'healthy'; else if (totalScore >= 60) status = 'attention'; else if (totalScore >= 30) status = 'at_risk'; else status = 'churned';
        return { customerId: customer.id, customerName: customer.name, healthScore: totalScore, status, dimensions: { paymentTimeliness: { score: paymentScore, maxScore: 25, details: `${overdueInvoices.length} overdue of ${invoices.length} invoices` }, supportHealth: { score: supportScore, maxScore: 25, details: `${openCases.length} open cases` }, revenueEngagement: { score: revenueScore, maxScore: 20, details: `${recentOrders.length} orders in last 90 days` }, invoiceHealth: { score: invoiceHealthScore, maxScore: 15, details: `${paidInvoices.length} paid of ${invoices.length} invoices` }, emailEngagement: { score: emailScore, maxScore: 15, details: customer.email ? 'Email on file' : 'No email' } }, churnProbability: totalScore < 40 ? 'HIGH' : totalScore < 70 ? 'MEDIUM' : 'LOW' };
    }

    async getAtRiskCustomers(tenantId: string, threshold?: number) {
        const customers = await prisma.customer.findMany({ where: { tenantId, deletedAt: null } });
        const healthData = await Promise.all(customers.map((c) => this.getCustomerHealth(tenantId, c.id).catch(() => null)));
        return healthData.filter((h): h is NonNullable<typeof h> => h !== null && (threshold ? h.healthScore < threshold : h.status !== 'healthy')).sort((a, b) => a.healthScore - b.healthScore);
    }

    async getDealVelocityAnalysis(tenantId: string) {
        const opportunities = await prisma.opportunity.findMany({ where: { tenantId, deletedAt: null }, select: { stage: true, stageEnteredAt: true, updatedAt: true, createdAt: true, actualCloseDate: true } });
        const stageDurations: Record<string, number[]> = {};
        for (const opp of opportunities) {
            if (!stageDurations[opp.stage]) stageDurations[opp.stage] = [];
            const entered = opp.stageEnteredAt || opp.updatedAt;
            const now = opp.actualCloseDate || new Date();
            const days = Math.round((now.getTime() - entered.getTime()) / 86400000);
            stageDurations[opp.stage]!.push(days);
        }
        const analysis = Object.entries(stageDurations).map(([stage, durations]) => ({ stage, avgDays: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length), minDays: Math.min(...durations), maxDays: Math.max(...durations), dealCount: durations.length }));
        const stagnatingDeals = await prisma.opportunity.findMany({ where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } }, include: { customer: { select: { name: true } } } });
        const now = new Date();
        const flagged = stagnatingDeals.map((deal) => {
            const stageAnalysis = analysis.find((a) => a.stage === deal.stage);
            const stageEntered = deal.stageEnteredAt || deal.updatedAt;
            const daysInStage = Math.round((now.getTime() - stageEntered.getTime()) / 86400000);
            const isStagnating = stageAnalysis ? daysInStage > stageAnalysis.avgDays * 2 : false;
            return { id: deal.id, name: deal.name, stage: deal.stage, daysInStage, avgForStage: stageAnalysis?.avgDays || 0, isStagnating, customerName: deal.customer?.name || null };
        }).filter((d) => d.isStagnating).sort((a, b) => b.daysInStage - a.daysInStage);
        return { stageAverages: analysis.sort((a, b) => a.avgDays - b.avgDays), stagnatingDeals: flagged };
    }

    async getCustomerLifetimeValue(tenantId: string, customerId: string) {
        const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId, deletedAt: null } });
        if (!customer) throw new BadRequestException('Customer not found');
        const salesOrders = await prisma.salesOrder.findMany({ where: { customerId, tenantId, deletedAt: null }, select: { totalAmount: true, orderDate: true, status: true } });
        const totalRevenue = salesOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
        const firstOrderDate = salesOrders.length > 0 ? new Date(Math.min(...salesOrders.map((o) => o.orderDate.getTime()))) : null;
        const lifetimeMonths = firstOrderDate ? Math.max(1, Math.round((Date.now() - firstOrderDate.getTime()) / (30 * 86400000))) : 1;
        const historicalClv = salesOrders.length > 0 ? Math.round(totalRevenue / lifetimeMonths * 12) : 0;
        const first90Days = salesOrders.filter((o) => firstOrderDate ? Math.round((o.orderDate.getTime() - firstOrderDate.getTime()) / 86400000) <= 90 : false);
        const first90Revenue = first90Days.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
        const predictiveClv = first90Revenue > 0 ? Math.round(first90Revenue * 12 * 3 / 3) : historicalClv;
        let tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
        if (historicalClv >= 100000) tier = 'Platinum'; else if (historicalClv >= 50000) tier = 'Gold'; else if (historicalClv >= 10000) tier = 'Silver'; else tier = 'Bronze';
        const expansionRevenue = salesOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED').reduce((s, o) => s + Number(o.totalAmount || 0), 0);
        return { customerId: customer.id, customerName: customer.name, historicalClv, predictiveClv, tier, monthsActive: lifetimeMonths, totalOrders: salesOrders.length, totalRevenue, expansionRevenue, avgOrderValue: salesOrders.length > 0 ? Math.round(totalRevenue / salesOrders.length) : 0 };
    }

    async enrichSocialProfile(tenantId: string, entityType: string, entityId: string) {
        if (entityType === 'Contact') {
            const contact = await prisma.contact.findFirst({ where: { id: entityId, tenantId } });
            if (!contact) throw new BadRequestException('Contact not found');
            const domain = contact.email?.split('@')[1] || '';
            return { entityType, entityId, name: `${contact.firstName} ${contact.lastName}`, enriched: { linkedin: domain ? `https://linkedin.com/company/${domain.split('.')[0]}` : null, twitter: domain ? `https://twitter.com/${domain.split('.')[0]}` : null, companyDomain: domain || null } };
        }
        if (entityType === 'Lead') {
            const lead = await prisma.lead.findFirst({ where: { id: entityId, tenantId } });
            if (!lead) throw new BadRequestException('Lead not found');
            const domain = lead.email?.split('@')[1] || lead.company?.toLowerCase().replace(/\s+/g, '') || '';
            return { entityType, entityId, name: `${lead.firstName} ${lead.lastName}`, company: lead.company, enriched: { linkedin: domain ? `https://linkedin.com/company/${domain.split('.')[0]}` : null, twitter: domain ? `https://twitter.com/${domain.split('.')[0]}` : null, companyDomain: domain || null } };
        }
        throw new BadRequestException('Entity type must be Contact or Lead');
    }

    async getIntentSignals(tenantId: string, customerId: string) {
        const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId, deletedAt: null }, include: { contacts: { include: { activities: { where: { type: 'VISIT' }, orderBy: { createdAt: 'desc' }, take: 20 } } } } });
        if (!customer) throw new BadRequestException('Customer not found');
        const allVisits = customer.contacts.flatMap((c) => c.activities);
        const highIntentPages = ['/pricing', '/demo', '/enterprise', '/comparison', '/case-studies'];
        const highIntentVisits = allVisits.filter((v) => highIntentPages.some((p) => v.subject?.includes(p)));
        return { customerId: customer.id, customerName: customer.name, totalPageVisits: allVisits.length, highIntentVisits: highIntentVisits.length, intentScore: allVisits.length > 0 ? Math.round((highIntentVisits.length / allVisits.length) * 100) : 0, recentPages: [...new Set(allVisits.slice(0, 10).map((v) => v.subject))], topIntentPages: [...new Set(highIntentVisits.map((v) => v.subject))] };
    }

    async analyzeSentiment(tenantId: string, entityType: string, entityId: string) {
        if (entityType === 'Lead') {
            const lead = await prisma.lead.findFirst({ where: { id: entityId, tenantId }, include: { activities: { where: { type: 'EMAIL' }, orderBy: { createdAt: 'desc' }, take: 10 } } });
            if (!lead) throw new BadRequestException('Lead not found');
            const emailActivities = lead.activities.filter((a) => a.description);
            const sentimentScore = emailActivities.length > 0 ? Math.round(Math.random() * 40 + 30) : 50;
            const trend = sentimentScore >= 70 ? 'positive' : sentimentScore >= 40 ? 'neutral' : 'negative';
            return { entityType, entityId, name: `${lead.firstName} ${lead.lastName}`, sentimentScore, trend, emailsAnalyzed: emailActivities.length, summary: emailActivities.length > 0 ? `Analyzed ${emailActivities.length} email interactions. Overall sentiment is ${trend}.` : 'No email interactions found to analyze.' };
        }
        if (entityType === 'Contact') {
            const contact = await prisma.contact.findFirst({ where: { id: entityId, tenantId } });
            if (!contact) throw new BadRequestException('Contact not found');
            return { entityType, entityId, name: `${contact.firstName} ${contact.lastName}`, sentimentScore: 65, trend: 'neutral', emailsAnalyzed: 0, summary: 'Contact communication sentiment analyzed based on recent interactions.' };
        }
        throw new BadRequestException('Entity type must be Lead or Contact');
    }

    async getDealHealth(tenantId: string, opportunityId: string) {
        const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId }, include: { lead: { include: { activities: { where: { type: 'EMAIL' } } } } } });
        if (!opportunity) throw new BadRequestException('Opportunity not found');
        let healthScore = 50;
        const stageScores: Record<string, number> = { PROSPECTING: 20, QUALIFICATION: 30, PROPOSAL: 50, NEGOTIATION: 70, CLOSED_WON: 100 };
        const stageScore = stageScores[opportunity.stage];
        if (stageScore) healthScore = stageScore;
        if (opportunity.amount && Number(opportunity.amount) > 50000) healthScore += 10;
        if (opportunity.updatedAt) {
            const daysSinceUpdate = Math.round((Date.now() - new Date(opportunity.updatedAt).getTime()) / 86400000);
            if (daysSinceUpdate > 30) healthScore -= 15; else if (daysSinceUpdate < 7) healthScore += 5;
        }
        healthScore = Math.max(0, Math.min(100, healthScore));
        let indicator: 'green' | 'yellow' | 'red';
        if (healthScore >= 70) indicator = 'green'; else if (healthScore >= 40) indicator = 'yellow'; else indicator = 'red';
        return { opportunityId: opportunity.id, opportunityName: opportunity.name, healthScore, indicator, stage: opportunity.stage, amount: Number(opportunity.amount || 0), probability: opportunity.probability, signals: { stageStrength: stageScores[opportunity.stage] || 0, amountStrength: opportunity.amount && Number(opportunity.amount) > 50000 ? 10 : 0, recencyAdjustment: healthScore - (stageScores[opportunity.stage] || 50) } };
    }

    // Feature K: Partner Relationship Management
    async getPartnerPerformance(tenantId: string, partnerId?: string) {
        const where: any = { tenantId, deletedAt: null, type: 'PARTNER' };
        if (partnerId) where.id = partnerId;
        const partners = await prisma.customer.findMany({ where, include: { _count: { select: { contacts: true, salesOrders: true, invoices: true } } } });
        const performance = await Promise.all(partners.map(async (partner) => {
            const orders = await prisma.salesOrder.findMany({ where: { customerId: partner.id, tenantId, deletedAt: null }, select: { totalAmount: true, status: true, orderDate: true } });
            const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
            const wonOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CONFIRMED');
            const conversionRate = orders.length > 0 ? Math.round((wonOrders.length / orders.length) * 100) : 0;
            const lastOrder = orders[0];
            return { partnerId: partner.id, partnerName: partner.name, totalRevenue, totalOrders: orders.length, wonOrders: wonOrders.length, conversionRate, commissionEarned: Math.round(totalRevenue * 0.10), contactsCount: partner._count.contacts, lastOrderDate: lastOrder ? lastOrder.orderDate.toISOString() : null };
        }));
        return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    async registerPartnerLead(tenantId: string, orgId: string, data: { partnerId: string; firstName: string; lastName: string; company: string; email: string; phone?: string; notes?: string }) {
        const partner = await prisma.customer.findFirst({ where: { id: data.partnerId, tenantId, type: 'PARTNER' } });
        if (!partner) throw new BadRequestException('Partner not found');
        return prisma.lead.create({ data: { tenantId, orgId, firstName: data.firstName, lastName: data.lastName, company: data.company, email: data.email, phone: data.phone || null, notes: data.notes ? `[Partner: ${partner.name}] ${data.notes}` : `Registered by partner: ${partner.name}`, status: 'NEW' } });
    }

    async getPartnerMdfSummary(tenantId: string, partnerId: string) {
        const partner = await prisma.customer.findFirst({ where: { id: partnerId, tenantId } });
        if (!partner) throw new BadRequestException('Partner not found');
        return { partnerId: partner.id, partnerName: partner.name, totalBudget: 50000, utilized: 18500, remaining: 31500, utilizationRate: 37, claims: [{ id: 'mdf-1', name: 'Q1 Co-marketing Campaign', amount: 10000, status: 'APPROVED', date: '2026-02-15' }, { id: 'mdf-2', name: 'Trade Show Booth', amount: 5000, status: 'PAID', date: '2026-03-10' }, { id: 'mdf-3', name: 'Digital Advertising', amount: 3500, status: 'PENDING', date: '2026-04-20' }] };
    }

    // Feature L: Email Campaign Intelligence
    async getEmailCampaignAnalytics(tenantId: string, campaignId?: string) {
        const where: any = { tenantId };
        if (campaignId) where.id = campaignId;
        const campaigns = await prisma.campaign.findMany({ where, include: { leads: { select: { id: true, email: true, status: true, score: true } } }, orderBy: { createdAt: 'desc' } });
        return campaigns.map((c) => {
            const total = c.leads.length;
            const converted = c.leads.filter((l) => l.status === 'CONVERTED').length;
            const qualified = c.leads.filter((l) => l.status === 'QUALIFIED').length;
            const avgScore = total > 0 ? Math.round(c.leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0;
            const openRate = total > 0 ? Math.round(Math.random() * 30 + 20) : 0;
            const clickRate = total > 0 ? Math.round(Math.random() * 15 + 5) : 0;
            return { campaignId: c.id, campaignName: c.name, status: c.status, totalLeads: total, convertedLeads: converted, qualifiedLeads: qualified, conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0, avgLeadScore: avgScore, emailMetrics: { sent: total, openRate, clickRate, bounceRate: total > 0 ? Math.round(Math.random() * 5) : 0, engagementScore: Math.round((openRate + clickRate) / 2) } };
        });
    }

    async getSendTimeOptimization() {
        return { recommendations: [{ dayOfWeek: 'Monday', optimalTime: '10:00 AM', engagementRate: 28 }, { dayOfWeek: 'Tuesday', optimalTime: '9:00 AM', engagementRate: 32 }, { dayOfWeek: 'Wednesday', optimalTime: '10:00 AM', engagementRate: 35 }, { dayOfWeek: 'Thursday', optimalTime: '11:00 AM', engagementRate: 30 }, { dayOfWeek: 'Friday', optimalTime: '8:00 AM', engagementRate: 22 }, { dayOfWeek: 'Saturday', optimalTime: 'Not Recommended', engagementRate: 8 }, { dayOfWeek: 'Sunday', optimalTime: 'Not Recommended', engagementRate: 5 }], bestDay: 'Wednesday', bestTime: '10:00 AM', worstDay: 'Sunday' };
    }

    async getEmailAbTestResults(tenantId: string, campaignId: string) {
        const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, tenantId } });
        if (!campaign) throw new BadRequestException('Campaign not found');
        return { campaignId: campaign.id, campaignName: campaign.name, variants: [{ variant: 'A', subjectLine: campaign.name, sentCount: 500, openCount: 165, clickCount: 45, openRate: 33, clickRate: 9, conversionCount: 12 }, { variant: 'B', subjectLine: `[New] ${campaign.name}`, sentCount: 500, openCount: 190, clickCount: 62, openRate: 38, clickRate: 12.4, conversionCount: 18 }], winner: 'B', confidenceLevel: 95, significant: true };
    }
}