import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class EducationCoreService {

  async enrolStudent(tenantId: string, dto: { studentId: string; courseId: string; academicYear: string }) {
    const student = await prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Student not found');
    const course = await prisma.course.findFirst({ where: { id: dto.courseId, tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    return { studentId: dto.studentId, courseId: dto.courseId, academicYear: dto.academicYear, status: 'ACTIVE', enrolmentDate: new Date().toISOString() };
  }

  async recordGrade(_tenantId: string, dto: {
    studentId: string; courseId: string; assessmentType: string; assessmentName: string;
    maxScore: number; score: number; date: string;
  }) {
    if (dto.score > dto.maxScore) throw new BadRequestException('Score cannot exceed max score');
    const pct = (dto.score / dto.maxScore) * 100;
    return {
      studentId: dto.studentId, courseId: dto.courseId,
      score: dto.score, maxScore: dto.maxScore,
      percentage: Math.round(pct * 10) / 10,
      letterGrade: this.letterGrade(pct),
    };
  }

  async getStudentTranscript(tenantId: string, studentId: string) {
    const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Student not found');
    const courses = await prisma.course.findMany({ where: { tenantId } });

    return {
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
      courses: courses.map((c) => ({ courseId: c.id, courseName: c.name })),
    };
  }

  async recordAttendance(_tenantId: string, dto: {
    courseId: string; date: string;
    records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' }>;
  }) {
    return {
      courseId: dto.courseId, date: dto.date, totalRecords: dto.records.length,
      present: dto.records.filter((r) => r.status === 'PRESENT').length,
      absent: dto.records.filter((r) => r.status === 'ABSENT').length,
    };
  }

  async generateFeeInvoice(tenantId: string, studentId: string, feeStructureId: string) {
    const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Student not found');
    const fee = await prisma.feeStructure.findFirst({ where: { id: feeStructureId, tenantId } });
    if (!fee) throw new NotFoundException('Fee structure not found');

    return {
      studentId, feeStructureId,
      amount: Number(fee.amount),
      dueDate: fee.dueDate,
      status: 'PENDING',
    };
  }

  private letterGrade(pct: number): string {
    if (pct >= 93) return 'A'; if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+'; if (pct >= 83) return 'B'; if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+'; if (pct >= 73) return 'C'; if (pct >= 70) return 'C-';
    if (pct >= 60) return 'D'; return 'F';
  }
}
