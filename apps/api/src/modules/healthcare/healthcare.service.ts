import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class HealthcareService {
  async getPatients(tenantId: string) {
    return prisma.patient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPatient(
    tenantId: string,
    dto: { firstName: string; lastName: string; dateOfBirth: string; gender: string; email?: string; phone?: string; medicalHistory?: string; vitalsHistory?: string; allergies?: string }
  ) {
    return prisma.patient.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        email: dto.email,
        phone: dto.phone,
        medicalHistory: dto.medicalHistory ? JSON.parse(dto.medicalHistory) : null,
        vitalsHistory: dto.vitalsHistory ? JSON.parse(dto.vitalsHistory) : null,
        allergies: dto.allergies ? JSON.parse(dto.allergies) : null,
      },
    });
  }

  async getPractitioners(tenantId: string) {
    return prisma.practitioner.findMany({
      where: { tenantId },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPractitioner(
    tenantId: string,
    dto: { employeeId: string; specialty: string; licenseNumber: string }
  ) {
    return prisma.practitioner.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        specialty: dto.specialty,
        licenseNumber: dto.licenseNumber,
      },
    });
  }

  async getAppointments(tenantId: string) {
    return prisma.appointment.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: { include: { employee: true } } },
      orderBy: { startTime: 'desc' },
    });
  }

  async createAppointment(
    tenantId: string,
    dto: { patientId: string; practitionerId: string; startTime: string; endTime: string; notes?: string }
  ) {
    return prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        notes: dto.notes,
        status: 'CONFIRMED',
      },
    });
  }

  async getPrescriptions(tenantId: string) {
    return prisma.prescription.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: { include: { employee: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPrescription(
    tenantId: string,
    dto: { patientId: string; practitionerId: string; details: string }
  ) {
    return prisma.prescription.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        details: JSON.parse(dto.details),
        status: 'ACTIVE',
      },
    });
  }

  async getDrugRegister(tenantId: string) {
    return prisma.drugRegister.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async logDrugRegister(
    tenantId: string,
    dto: { name: string; batchNumber: string; expiryDate: string; isControlled?: boolean; quantity: number }
  ) {
    return prisma.drugRegister.create({
      data: {
        tenantId,
        name: dto.name,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        isControlled: dto.isControlled ?? false,
        quantity: dto.quantity,
      },
    });
  }

  async getMedicalEncounters(tenantId: string) {
    return prisma.medicalEncounter.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: { include: { employee: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMedicalEncounter(
    tenantId: string,
    dto: { patientId: string; practitionerId: string; diagnosis: string; treatmentCode: string; billingAmount: number }
  ) {
    return prisma.medicalEncounter.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        diagnosis: dto.diagnosis,
        treatmentCode: dto.treatmentCode,
        billingAmount: dto.billingAmount,
        claimStatus: 'SUBMITTED',
      },
    });
  }
}
