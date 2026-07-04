import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const createDuplicateRuleSchema = z.object({
  name: z.string().min(1),
  entity: z.enum(['LEAD', 'CONTACT', 'ACCOUNT']),
  matchFields: z.array(z.string()).min(1),
  threshold: z.number().int().min(1).max(100).default(100),
  action: z.enum(['BLOCK', 'WARN', 'MERGE']).default('WARN'),
  active: z.boolean().optional(),
});
export const updateDuplicateRuleSchema = createDuplicateRuleSchema.partial();
export const mergePairSchema = z.object({
  winnerId: z.string(),
  loserIds: z.array(z.string()).min(1),
  fieldChoices: z.record(z.string(), z.string()).optional(),
});
export type CreateDuplicateRuleInput = z.infer<typeof createDuplicateRuleSchema>;
export type UpdateDuplicateRuleInput = z.infer<typeof updateDuplicateRuleSchema>;
export type MergePairInput = z.infer<typeof mergePairSchema>;

type Entity = 'LEAD' | 'CONTACT' | 'ACCOUNT';
type EntityParam = 'leads' | 'contacts' | 'customers' | 'accounts';

const toEntity = (e: EntityParam): Entity =>
  e === 'leads' ? 'LEAD' : e === 'contacts' ? 'CONTACT' : 'ACCOUNT';

const normalize = (v: unknown): string =>
  v == null ? '' : String(v).trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Duplicate detection: exact-normalized-string equality on configured
 * matchFields for LEAD/CONTACT/ACCOUNT (Customer). Basic merge = copy source
 * fields to target where target is null, then delete source.
 */
@Injectable()
export class CrmDuplicatesService {
  // ── Rule CRUD ─────────────────────────────────────

  async listRules(tenantId: string) {
    return prisma.duplicateRule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getRule(tenantId: string, id: string) {
    const rule = await prisma.duplicateRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Duplicate rule not found');
    return rule;
  }

  async createRule(tenantId: string, dto: CreateDuplicateRuleInput) {
    return prisma.duplicateRule.create({
      data: {
        tenantId,
        name: dto.name,
        entity: dto.entity,
        matchFields: dto.matchFields,
        threshold: dto.threshold ?? 100,
        action: dto.action ?? 'WARN',
        active: dto.active ?? true,
      },
    });
  }

  async updateRule(tenantId: string, id: string, dto: UpdateDuplicateRuleInput) {
    await this.getRule(tenantId, id);
    return prisma.duplicateRule.update({
      where: { id },
      data: {
        ...dto,
        matchFields: dto.matchFields as unknown as never,
      },
    });
  }

  async deleteRule(tenantId: string, id: string) {
    await this.getRule(tenantId, id);
    return prisma.duplicateRule.delete({ where: { id } });
  }

  // ── Detection ─────────────────────────────────────

  private async fetchEntity(tenantId: string, entity: Entity, id: string): Promise<Record<string, unknown> | null> {
    if (entity === 'LEAD') return prisma.lead.findFirst({ where: { id, tenantId, deletedAt: null } }) as Promise<Record<string, unknown> | null>;
    if (entity === 'CONTACT') return prisma.contact.findFirst({ where: { id, tenantId } }) as Promise<Record<string, unknown> | null>;
    return prisma.customer.findFirst({ where: { id, tenantId } }) as Promise<Record<string, unknown> | null>;
  }

  private async fetchAll(tenantId: string, entity: Entity): Promise<Array<Record<string, unknown>>> {
    if (entity === 'LEAD') return prisma.lead.findMany({ where: { tenantId, deletedAt: null } }) as unknown as Promise<Array<Record<string, unknown>>>;
    if (entity === 'CONTACT') return prisma.contact.findMany({ where: { tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>;
    return prisma.customer.findMany({ where: { tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>;
  }

  async findDuplicates(tenantId: string, entityParam: EntityParam, recordId: string) {
    const entity = toEntity(entityParam);
    const rules = await prisma.duplicateRule.findMany({ where: { tenantId, entity, active: true } });
    if (rules.length === 0) return { record: null, matches: [] };

    const record = await this.fetchEntity(tenantId, entity, recordId);
    if (!record) throw new NotFoundException(`${entity} not found`);

    const all = await this.fetchAll(tenantId, entity);
    const matches: Array<{ id: string; ruleId: string; ruleName: string }> = [];

    for (const rule of rules) {
      const fields = (rule.matchFields as unknown as string[]) || [];
      for (const other of all) {
        if (other.id === record.id) continue;
        const allEqual = fields.every((f) => {
          const a = normalize(record[f]);
          const b = normalize(other[f]);
          return a !== '' && a === b;
        });
        if (allEqual) matches.push({ id: String(other.id), ruleId: rule.id, ruleName: rule.name });
      }
    }
    return { record: { id: record.id }, matches };
  }

  async scanEntity(tenantId: string, entityParam: EntityParam) {
    const entity = toEntity(entityParam);
    const rules = await prisma.duplicateRule.findMany({ where: { tenantId, entity, active: true } });
    if (rules.length === 0) return [];

    const all = await this.fetchAll(tenantId, entity);
    const byId = new Map(all.map((r) => [String(r.id), r]));
    const groups: Array<{ key: string; score: number; records: Array<Record<string, unknown>> }> = [];

    for (const rule of rules) {
      const fields = (rule.matchFields as unknown as string[]) || [];
      const buckets = new Map<string, string[]>();
      for (const rec of all) {
        const key = fields.map((f) => normalize(rec[f])).join('||');
        if (fields.some((f) => normalize(rec[f]) === '')) continue;
        const arr = buckets.get(key) ?? [];
        arr.push(String(rec.id));
        buckets.set(key, arr);
      }
      for (const [key, ids] of buckets.entries()) {
        if (ids.length > 1) {
          groups.push({
            key: `${rule.id}:${key}`,
            score: (rule.threshold ?? 100) / 100,
            records: ids.map((id) => byId.get(id)).filter((r): r is Record<string, unknown> => !!r),
          });
        }
      }
    }
    return groups;
  }

  // ── Merge ────────────────────────────────────────
  // dto: { winnerId, loserIds, fieldChoices? } — fieldChoices maps field -> id of the
  // record whose value should win (defaults to the winner's own value).

  private async mergeGeneric(
    _tenantId: string,
    dto: MergePairInput,
    fetchAllForIds: (ids: string[]) => Promise<Array<Record<string, unknown>>>,
    applyPatch: (winnerId: string, patch: Record<string, unknown>) => Promise<unknown>,
    removeLosers: (loserIds: string[]) => Promise<unknown>,
  ) {
    if (dto.loserIds.includes(dto.winnerId)) throw new BadRequestException('winnerId cannot be in loserIds');
    const ids = [dto.winnerId, ...dto.loserIds];
    const records = await fetchAllForIds(ids);
    const byId = new Map(records.map((r) => [String(r.id), r]));
    const winner = byId.get(dto.winnerId);
    if (!winner || dto.loserIds.some((id) => !byId.has(id))) throw new NotFoundException('One or more records not found');

    const patch: Record<string, unknown> = {};
    for (const [field, chosenId] of Object.entries(dto.fieldChoices ?? {})) {
      if (chosenId === dto.winnerId) continue;
      const chosen = byId.get(chosenId);
      if (chosen && chosen[field] != null) patch[field] = chosen[field];
    }
    if (Object.keys(patch).length > 0) await applyPatch(dto.winnerId, patch);
    await removeLosers(dto.loserIds);
    return { merged: true, winnerId: dto.winnerId, loserIds: dto.loserIds };
  }

  async mergeLeads(tenantId: string, dto: MergePairInput) {
    return this.mergeGeneric(
      tenantId,
      dto,
      (ids) => prisma.lead.findMany({ where: { id: { in: ids }, tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>,
      (winnerId, patch) => prisma.lead.update({ where: { id: winnerId }, data: patch }),
      (loserIds) => prisma.lead.updateMany({ where: { id: { in: loserIds }, tenantId }, data: { deletedAt: new Date() } }),
    );
  }

  async mergeContacts(tenantId: string, dto: MergePairInput) {
    return this.mergeGeneric(
      tenantId,
      dto,
      (ids) => prisma.contact.findMany({ where: { id: { in: ids }, tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>,
      (winnerId, patch) => prisma.contact.update({ where: { id: winnerId }, data: patch }),
      (loserIds) => prisma.contact.deleteMany({ where: { id: { in: loserIds }, tenantId } }),
    );
  }

  async mergeAccounts(tenantId: string, dto: MergePairInput) {
    return this.mergeGeneric(
      tenantId,
      dto,
      (ids) => prisma.customer.findMany({ where: { id: { in: ids }, tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>,
      (winnerId, patch) => prisma.customer.update({ where: { id: winnerId }, data: patch }),
      (loserIds) => prisma.customer.deleteMany({ where: { id: { in: loserIds }, tenantId } }),
    );
  }
}
