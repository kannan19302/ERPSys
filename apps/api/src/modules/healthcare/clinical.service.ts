import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClinicalService {

  async getPatientSummary(tenantId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const [appointments, prescriptions, encounters] = await Promise.all([
      prisma.appointment.findMany({ where: { tenantId, patientId }, orderBy: { startTime: 'desc' }, take: 10, include: { practitioner: true } }),
      prisma.prescription.findMany({ where: { tenantId, patientId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.medicalEncounter.findMany({ where: { tenantId, patientId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    return {
      patient,
      recentAppointments: appointments,
      activePrescriptions: prescriptions.filter((p) => p.status === 'ACTIVE'),
      recentEncounters: encounters,
    };
  }

  async createEncounterWithCharting(tenantId: string, dto: {
    patientId: string; practitionerId: string; diagnosis: string; treatmentCode: string;
    billingAmount: number; chiefComplaint?: string; soapNotes?: Record<string, string>;
  }) {
    const patient = await prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return prisma.medicalEncounter.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        diagnosis: dto.diagnosis,
        treatmentCode: dto.treatmentCode,
        billingAmount: new Prisma.Decimal(dto.billingAmount),
        claimStatus: 'DRAFT',
      },
    });
  }

  async createPrescription(tenantId: string, dto: {
    patientId: string; practitionerId: string;
    medications: Array<{ drugName: string; dosage: string; frequency: string; duration: string; quantity: number }>;
  }) {
    const patient = await prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return prisma.prescription.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        details: dto.medications as unknown as Prisma.InputJsonValue,
        status: 'ACTIVE',
      },
    });
  }

  async submitClaim(tenantId: string, encounterId: string) {
    const encounter = await prisma.medicalEncounter.findFirst({ where: { id: encounterId, tenantId } });
    if (!encounter) throw new NotFoundException('Encounter not found');

    return prisma.medicalEncounter.update({
      where: { id: encounterId },
      data: { claimStatus: 'SUBMITTED' },
    });
  }

  async exportPatientFhirBundle(tenantId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const encounters = await prisma.medicalEncounter.findMany({ where: { tenantId, patientId } });
    const prescriptions = await prisma.prescription.findMany({ where: { tenantId, patientId } });

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        { resource: { resourceType: 'Patient', id: patient.id, name: [{ given: [patient.firstName], family: patient.lastName }] } },
        ...encounters.map((e) => ({
          resource: { resourceType: 'Encounter', id: e.id, status: 'finished', reasonCode: [{ text: e.diagnosis }], subject: { reference: `Patient/${patient.id}` } },
        })),
        ...prescriptions.map((rx) => ({
          resource: { resourceType: 'MedicationRequest', id: rx.id, status: rx.status?.toLowerCase() || 'active', subject: { reference: `Patient/${patient.id}` } },
        })),
      ],
    };
  }

  async logPhiAccess(tenantId: string, userId: string, patientId: string, action: string) {
    await prisma.auditLog.create({
      data: {
        tenantId, userId, entityType: 'Patient', entityId: patientId,
        action: `PHI_ACCESS:${action}`,
        changes: { timestamp: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
