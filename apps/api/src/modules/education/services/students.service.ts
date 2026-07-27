import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationStudentsService {
  async findAll(tenantId: string) {
    return prisma.educationStudent.findMany({
      where: { tenantId },
      include: {
        enrollments: { include: { course: true } },
        parents: { include: { parent: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.educationStudent.findFirst({
      where: { tenantId, id },
      include: {
        enrollments: {
          include: { course: true },
          orderBy: { enrollmentDate: "desc" },
        },
        parents: { include: { parent: true } },
        fees: true,
        feeInvoices: {
          include: { payments: true },
          orderBy: { createdAt: "desc" },
        },
        grades: true,
        gradeEntries: { include: { gradebook: true } },
        attendance: {
          include: { course: true },
          orderBy: { date: "desc" },
          take: 30,
        },
        transactions: {
          include: { book: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        examResults: { include: { exam: true } },
        libraryFines: true,
      },
    });
  }
  async create(tenantId: string, data: any) {
    const { parents, ...student } = data;
    return prisma.educationStudent.create({
      data: {
        ...student,
        tenantId,
        parents: parents
          ? { create: parents.map((p: any) => ({ parentId: p, tenantId })) }
          : undefined,
      },
      include: { parents: { include: { parent: true } } },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    const { parents, ...student } = data;
    if (parents) {
      await prisma.educationStudentParent.deleteMany({
        where: { studentId: id, tenantId },
      });
      if (parents.length > 0)
        await prisma.educationStudentParent.createMany({
          data: parents.map((p: string) => ({
            studentId: id,
            parentId: p,
            tenantId,
          })),
        });
    }
    await prisma.educationStudent.updateMany({
      where: { tenantId, id },
      data: student,
    });
    return this.findById(tenantId, id);
  }
  async delete(tenantId: string, id: string) {
    return prisma.educationStudent.updateMany({
      where: { tenantId, id },
      data: { isActive: false, status: "WITHDRAWN" },
    });
  }
  async search(tenantId: string, q: string) {
    return prisma.educationStudent.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { enrollmentNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
  }
  async getParents(tenantId: string) {
    return prisma.educationParent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createParent(tenantId: string, data: any) {
    return prisma.educationParent.create({ data: { ...data, tenantId } });
  }
}
