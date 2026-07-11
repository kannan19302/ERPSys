import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const logCallSchema = z.object({
  subject: z.string().min(1).max(200),
  opportunityId: z.string().optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  durationSec: z.number().int().min(0).max(36000).optional(),
  recordingUrl: z.string().url().optional(),
  transcriptText: z.string().min(1),
});
export type LogCallInput = z.infer<typeof logCallSchema>;

const POSITIVE_WORDS = [
  'great', 'excited', 'happy', 'love', 'perfect', 'awesome', 'yes', 'agree', 'interested',
  'ready to move forward', 'sounds good', 'looking forward', 'thank you', 'appreciate',
];
const NEGATIVE_WORDS = [
  'concerned', 'worried', 'expensive', 'too much', 'not sure', 'hesitant', 'competitor',
  'cancel', 'disappointed', 'unhappy', 'frustrated', 'issue', 'problem', 'delay', 'no budget',
];
const ACTION_ITEM_PATTERNS = [
  /\b(will|going to|plan to)\s+([a-z][^.?!]{3,80})/gi,
  /\b(follow[- ]?up|next step[s]?|action item[s]?)\s*[:\-]?\s*([a-z][^.?!]{3,80})/gi,
  /\bi(?:'ll| will)\s+([a-z][^.?!]{3,80})/gi,
];

/**
 * Conversation Intelligence (Up Next item 35, benchmark: Salesforce Einstein
 * Conversation Insights, HubSpot Breeze call summaries).
 *
 * Follows the same "heuristic-simulation-of-AI" pattern already used by
 * `InvoiceCaptureService.processOcrParser` (deterministic keyword/regex
 * analysis standing in for a real NLP/LLM provider — swappable later behind
 * the same seam without changing the API contract): logs a call as a CALL
 * Activity, then derives a summary, a POSITIVE/NEUTRAL/NEGATIVE sentiment
 * score, a heuristic talk-track engagement score, and extracted action items
 * from the raw transcript text — all auto-attached to that Activity record.
 */
@Injectable()
export class CrmConversationIntelligenceService {
  async logCall(tenantId: string, orgId: string, dto: LogCallInput) {
    if (!dto.opportunityId && !dto.leadId && !dto.customerId && !dto.contactId) {
      throw new BadRequestException('A call must be linked to at least one of opportunity/lead/customer/contact');
    }

    const analysis = this.analyzeTranscript(dto.transcriptText);

    return prisma.activity.create({
      data: {
        tenantId,
        orgId,
        type: 'CALL',
        subject: dto.subject,
        description: analysis.summary,
        opportunityId: dto.opportunityId ?? null,
        leadId: dto.leadId ?? null,
        customerId: dto.customerId ?? null,
        contactId: dto.contactId ?? null,
        assignedToId: dto.assignedToId ?? null,
        completedAt: new Date(),
        callDurationSec: dto.durationSec ?? null,
        callRecordingUrl: dto.recordingUrl ?? null,
        transcriptText: dto.transcriptText,
        aiSummary: analysis.summary,
        aiSentiment: analysis.sentiment,
        aiActionItems: analysis.actionItems,
        aiTalkTrackScore: analysis.talkTrackScore,
        aiSummaryGeneratedAt: new Date(),
      },
    });
  }

  /** Re-run analysis on an existing CALL activity (e.g. transcript was edited/corrected). */
  async regenerateSummary(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({ where: { id: activityId, tenantId, type: 'CALL' } });
    if (!activity) throw new NotFoundException('Call activity not found');
    if (!activity.transcriptText) throw new BadRequestException('Activity has no transcript to analyze');

    const analysis = this.analyzeTranscript(activity.transcriptText);
    return prisma.activity.update({
      where: { id: activityId },
      data: {
        description: analysis.summary,
        aiSummary: analysis.summary,
        aiSentiment: analysis.sentiment,
        aiActionItems: analysis.actionItems,
        aiTalkTrackScore: analysis.talkTrackScore,
        aiSummaryGeneratedAt: new Date(),
      },
    });
  }

  async getCall(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({ where: { id: activityId, tenantId, type: 'CALL' } });
    if (!activity) throw new NotFoundException('Call activity not found');
    return activity;
  }

  async listCalls(
    tenantId: string,
    filters?: { opportunityId?: string; leadId?: string; customerId?: string; sentiment?: string },
  ) {
    return prisma.activity.findMany({
      where: {
        tenantId,
        type: 'CALL',
        ...(filters?.opportunityId ? { opportunityId: filters.opportunityId } : {}),
        ...(filters?.leadId ? { leadId: filters.leadId } : {}),
        ...(filters?.customerId ? { customerId: filters.customerId } : {}),
        ...(filters?.sentiment ? { aiSentiment: filters.sentiment } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Tenant-wide conversation intelligence rollup: sentiment mix, avg talk-track score, top action-item volume. */
  async getInsightsSummary(tenantId: string) {
    const calls = await prisma.activity.findMany({
      where: { tenantId, type: 'CALL', aiSummaryGeneratedAt: { not: null } },
      select: { aiSentiment: true, aiTalkTrackScore: true, aiActionItems: true },
    });

    const bySentiment: Record<string, number> = {};
    let scoreSum = 0;
    let scoreCount = 0;
    let totalActionItems = 0;
    for (const c of calls) {
      if (c.aiSentiment) bySentiment[c.aiSentiment] = (bySentiment[c.aiSentiment] ?? 0) + 1;
      if (typeof c.aiTalkTrackScore === 'number') {
        scoreSum += c.aiTalkTrackScore;
        scoreCount++;
      }
      if (Array.isArray(c.aiActionItems)) totalActionItems += c.aiActionItems.length;
    }

    return {
      totalCallsAnalyzed: calls.length,
      bySentiment,
      averageTalkTrackScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
      totalActionItemsExtracted: totalActionItems,
    };
  }

  /**
   * Deterministic transcript analysis: sentiment via keyword scoring, action
   * items via regex extraction, a talk-track "engagement" score derived from
   * transcript length + question density + positive/negative keyword balance,
   * and a summary built from the first/last substantive sentences plus the
   * extracted action items.
   */
  private analyzeTranscript(transcript: string): {
    summary: string;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    actionItems: string[];
    talkTrackScore: number;
  } {
    const lower = transcript.toLowerCase();

    let positiveHits = 0;
    for (const w of POSITIVE_WORDS) if (lower.includes(w)) positiveHits++;
    let negativeHits = 0;
    for (const w of NEGATIVE_WORDS) if (lower.includes(w)) negativeHits++;

    const sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' =
      positiveHits - negativeHits >= 2 ? 'POSITIVE' : negativeHits - positiveHits >= 2 ? 'NEGATIVE' : 'NEUTRAL';

    const actionItems = new Set<string>();
    for (const pattern of ACTION_ITEM_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(transcript)) !== null) {
        const captured = (match[2] ?? match[1] ?? '').trim();
        if (captured.length >= 4) actionItems.add(captured.replace(/\s+/g, ' ').slice(0, 140));
        if (actionItems.size >= 10) break;
      }
    }

    const sentences = transcript
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);
    const questionCount = (transcript.match(/\?/g) ?? []).length;
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    // 0-100 heuristic: baseline on sentence/word richness, +engagement for
    // questions asked (discovery), -penalty for heavy negative-keyword density.
    let talkTrackScore = Math.min(70, Math.round((wordCount / 20) + sentences.length * 2));
    talkTrackScore += Math.min(20, questionCount * 4);
    talkTrackScore -= negativeHits * 5;
    talkTrackScore += positiveHits * 3;
    talkTrackScore = Math.max(0, Math.min(100, talkTrackScore));

    const openingLine = sentences[0] ?? transcript.slice(0, 140);
    const closingLine = sentences.length > 1 ? sentences[sentences.length - 1] : '';
    const actionSummary = actionItems.size > 0 ? ` Action items: ${Array.from(actionItems).slice(0, 3).join('; ')}.` : '';
    const summary =
      `${sentiment === 'POSITIVE' ? 'Positive' : sentiment === 'NEGATIVE' ? 'At-risk' : 'Neutral'} call. ` +
      `${openingLine}${closingLine ? ` ... ${closingLine}` : ''}${actionSummary}`.trim();

    return { summary, sentiment, actionItems: Array.from(actionItems), talkTrackScore };
  }
}
