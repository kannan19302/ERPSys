import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { REFERENCE_DATA } from './reference-data';

const APP = 'healthcare';

/**
 * "Smart" clinical + revenue-cycle services for the Healthcare marketplace app. All
 * operate on the tenant's provisioned Healthcare custom records (rule-based logic,
 * computed live). Workflows that would require external networks (Surescripts, EDI,
 * HL7, PACS) are represented as records/worklists; the FHIR endpoints expose read-only
 * projections. Separate from the legacy Prisma-backed HealthcareService.
 */
@Injectable()
export class HealthcareSmartService {
  /** Fetch the data JSON of all records for a healthcare schema (clean slug). */
  private async records(tenantId: string, cleanSlug: string): Promise<any[]> {
    const schema = await prisma.schemaRegistry.findUnique({ where: { tenantId_slug: { tenantId, slug: `${APP}_${cleanSlug}` } }, select: { id: true } });
    if (!schema) return [];
    const rows = await prisma.customRecord.findMany({ where: { tenantId, schemaId: schema.id }, select: { id: true, data: true, createdAt: true } });
    return rows.map((r) => ({ _id: r.id, _createdAt: r.createdAt, ...((r.data || {}) as any) }));
  }

  // ── Eligibility (270/271-shaped) ──
  async eligibilityCheck(tenantId: string, body: { patient_mrn: string }) {
    const coverages = await this.records(tenantId, 'coverage');
    const cov = coverages.find((c) => c.patient_mrn === body.patient_mrn && c.active !== false);
    if (!cov) return { patient_mrn: body.patient_mrn, eligible: false, message: 'No active coverage on file' };
    return {
      patient_mrn: body.patient_mrn, eligible: true, payer: cov.payer, member_id: cov.member_id,
      plan: { group: cov.group_no, copay: Number(cov.copay) || 0, deductible: Number(cov.deductible) || 0 },
      checkedAt: new Date().toISOString(),
    };
  }

  // ── Claim scrubber (rule-based edits) ──
  async claimsScrub(tenantId: string, body: { patient_mrn?: string; payer?: string; icd10_code?: string; cpt_code?: string; amount?: number }) {
    const edits: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    if (!body.icd10_code) edits.push({ code: 'DX_MISSING', severity: 'error', message: 'Diagnosis (ICD-10) is required' });
    else if (!REFERENCE_DATA.icd10.some((d) => d.code === body.icd10_code)) edits.push({ code: 'DX_UNKNOWN', severity: 'warning', message: `ICD-10 ${body.icd10_code} not in reference set` });
    if (!body.cpt_code) edits.push({ code: 'CPT_MISSING', severity: 'error', message: 'Procedure (CPT) is required' });
    else if (!REFERENCE_DATA.cpt.some((c) => c.code === body.cpt_code)) edits.push({ code: 'CPT_UNKNOWN', severity: 'warning', message: `CPT ${body.cpt_code} not in reference set` });
    if (!body.payer) edits.push({ code: 'PAYER_MISSING', severity: 'error', message: 'Payer is required' });
    if (body.amount != null && Number(body.amount) <= 0) edits.push({ code: 'AMT_INVALID', severity: 'error', message: 'Charge amount must be greater than zero' });
    if (body.patient_mrn) {
      const elig = await this.eligibilityCheck(tenantId, { patient_mrn: body.patient_mrn });
      if (!elig.eligible) edits.push({ code: 'NO_COVERAGE', severity: 'warning', message: 'No active coverage found for patient' });
    }
    const clean = edits.filter((e) => e.severity === 'error').length === 0;
    return { clean, edits, scrubbedAt: new Date().toISOString() };
  }

  // ── Drug interaction check ──
  async rxInteractions(tenantId: string, body: { patient_mrn?: string; meds?: string[] }) {
    let meds = (body.meds || []).filter(Boolean);
    if (body.patient_mrn) {
      const active = (await this.records(tenantId, 'medication')).filter((m) => m.patient_mrn === body.patient_mrn && m.status !== 'Stopped').map((m) => m.drug);
      meds = Array.from(new Set([...meds, ...active]));
    }
    const hits: any[] = [];
    for (let i = 0; i < meds.length; i++) {
      for (let j = i + 1; j < meds.length; j++) {
        const pair = REFERENCE_DATA.drugInteractions.find(
          (d) => (d.a === meds[i] && d.b === meds[j]) || (d.a === meds[j] && d.b === meds[i]),
        );
        if (pair) hits.push({ drugs: [meds[i], meds[j]], severity: pair.severity, note: pair.note });
      }
    }
    return { meds, interactions: hits, hasMajor: hits.some((h) => h.severity === 'Major') };
  }

  // ── Clinical Decision Support ──
  async cdsEvaluate(tenantId: string, body: { patient_mrn: string; order_drug?: string }) {
    const alerts: { type: string; severity: string; message: string }[] = [];
    const allergies = (await this.records(tenantId, 'allergy')).filter((a) => a.patient_mrn === body.patient_mrn);
    const problems = (await this.records(tenantId, 'problem')).filter((p) => p.patient_mrn === body.patient_mrn);
    const labs = (await this.records(tenantId, 'lab-result')).filter((l) => l.patient_mrn === body.patient_mrn);

    if (body.order_drug) {
      if (allergies.some((a) => (a.allergen || '').toLowerCase() === body.order_drug!.toLowerCase()))
        alerts.push({ type: 'allergy', severity: 'high', message: `Patient is allergic to ${body.order_drug}` });
      const rx = await this.rxInteractions(tenantId, { patient_mrn: body.patient_mrn, meds: [body.order_drug] });
      for (const h of rx.interactions) alerts.push({ type: 'interaction', severity: h.severity === 'Major' ? 'high' : 'moderate', message: `${h.drugs.join(' + ')}: ${h.note}` });
    }
    if (labs.some((l) => l.flag === 'Critical')) alerts.push({ type: 'lab', severity: 'high', message: 'Patient has an unaddressed critical lab result' });
    if (problems.some((p) => /diabetes/i.test(p.description || '')) && !labs.some((l) => /a1c/i.test(l.test_name || '')))
      alerts.push({ type: 'care-gap', severity: 'low', message: 'Diabetic patient with no recent HbA1c' });

    return { patient_mrn: body.patient_mrn, alerts, count: alerts.length };
  }

  // ── Quality measures (HEDIS/MIPS-style, computed) ──
  async qualityMeasures(tenantId: string) {
    const patients = await this.records(tenantId, 'patient');
    const problems = await this.records(tenantId, 'problem');
    const labs = await this.records(tenantId, 'lab-result');
    const immun = await this.records(tenantId, 'immunization-record');

    const diabetics = problems.filter((p) => /diabetes/i.test(p.description || '')).map((p) => p.patient_mrn);
    const diabeticsWithA1c = new Set(labs.filter((l) => /a1c/i.test(l.test_name || '')).map((l) => l.patient_mrn));
    const a1cControlled = labs.filter((l) => /a1c/i.test(l.test_name || '') && Number(l.value) <= 9).length;

    const measure = (num: number, den: number) => ({ numerator: num, denominator: den, rate: den ? Math.round((num / den) * 100) : 0 });
    return {
      measures: [
        { id: 'CDC-A1C-TEST', title: 'Diabetics with HbA1c tested', ...measure(diabetics.filter((m) => diabeticsWithA1c.has(m)).length, diabetics.length) },
        { id: 'CDC-A1C-CONTROL', title: 'Diabetics with HbA1c <= 9%', ...measure(a1cControlled, diabetics.length) },
        { id: 'IMM-FLU', title: 'Patients with influenza immunization', ...measure(new Set(immun.filter((i) => /influenza/i.test(i.vaccine || '')).map((i) => i.patient_mrn)).size, patients.length) },
      ],
      computedAt: new Date().toISOString(),
    };
  }

  // ── FHIR R4-shaped read projections ──
  async fhirPatient(tenantId: string, mrn?: string) {
    let patients = await this.records(tenantId, 'patient');
    if (mrn) patients = patients.filter((p) => p.mrn === mrn);
    return {
      resourceType: 'Bundle', type: 'searchset', total: patients.length,
      entry: patients.map((p) => ({
        resource: {
          resourceType: 'Patient', id: p.mrn,
          identifier: [{ system: 'urn:mrn', value: p.mrn }],
          name: [{ family: p.last_name, given: [p.first_name] }],
          gender: (p.sex || '').toLowerCase() || 'unknown',
          birthDate: p.date_of_birth || undefined,
          telecom: p.phone ? [{ system: 'phone', value: p.phone }] : undefined,
        },
      })),
    };
  }

  async fhirObservation(tenantId: string, mrn?: string) {
    let labs = await this.records(tenantId, 'lab-result');
    let vitals = await this.records(tenantId, 'vital');
    if (mrn) { labs = labs.filter((l) => l.patient_mrn === mrn); vitals = vitals.filter((v) => v.patient_mrn === mrn); }
    const obs = [
      ...labs.map((l) => ({
        resource: {
          resourceType: 'Observation', status: 'final', category: [{ text: 'laboratory' }],
          code: { coding: [{ system: 'http://loinc.org', code: l.loinc_code, display: l.test_name }], text: l.test_name },
          subject: { reference: `Patient/${l.patient_mrn}` },
          valueQuantity: { value: Number(l.value), unit: l.unit },
          interpretation: l.flag ? [{ text: l.flag }] : undefined,
          effectiveDateTime: l.resulted_at,
        },
      })),
      ...vitals.map((v) => ({
        resource: {
          resourceType: 'Observation', status: 'final', category: [{ text: 'vital-signs' }],
          code: { text: 'Blood pressure' }, subject: { reference: `Patient/${v.patient_mrn}` },
          component: [
            { code: { text: 'Systolic' }, valueQuantity: { value: Number(v.systolic), unit: 'mmHg' } },
            { code: { text: 'Diastolic' }, valueQuantity: { value: Number(v.diastolic), unit: 'mmHg' } },
          ],
          effectiveDateTime: v.recorded_at,
        },
      })),
    ];
    return { resourceType: 'Bundle', type: 'searchset', total: obs.length, entry: obs };
  }
}
