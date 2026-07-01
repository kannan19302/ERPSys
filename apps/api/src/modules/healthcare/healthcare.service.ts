import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';
import {
  CreatePatientInput,
  CreatePractitionerInput,
  CreateAppointmentInput,
  CreatePrescriptionInput,
  LogDrugRegisterInput,
  CreateMedicalEncounterInput,
} from '@unerp/shared';

@Injectable()
export class HealthcareService {
  async getPatients(tenantId: string, params: PaginationParams & { search?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.patient.count({ where }),
    ]);

    return paginatedResult(patients, total, params);
  }

  async createPatient(
    tenantId: string,
    dto: CreatePatientInput
  ) {
    return prisma.patient.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        email: dto.email || null,
        phone: dto.phone || null,
        medicalHistory: dto.medicalHistory ? JSON.parse(dto.medicalHistory) : null,
        vitalsHistory: dto.vitalsHistory ? JSON.parse(dto.vitalsHistory) : null,
        allergies: dto.allergies ? JSON.parse(dto.allergies) : null,
      },
    });
  }

  async getPractitioners(tenantId: string, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [practitioners, total] = await Promise.all([
      prisma.practitioner.findMany({
        where,
        include: { employee: true },
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.practitioner.count({ where }),
    ]);

    return paginatedResult(practitioners, total, params);
  }

  async createPractitioner(
    tenantId: string,
    dto: CreatePractitionerInput
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
    dto: CreateAppointmentInput
  ) {
    return prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        practitionerId: dto.practitionerId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        notes: dto.notes || null,
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
    dto: CreatePrescriptionInput
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
    dto: LogDrugRegisterInput
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
    dto: CreateMedicalEncounterInput
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

