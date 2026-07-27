import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationFeesService {
  async getFeeStructures(tenantId: string) {
    return prisma.educationFeeStructure.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createFeeStructure(tenantId: string, data: any) {
    return prisma.educationFeeStructure.create({ data: { ...data, tenantId } });
  }
  async updateFeeStructure(tenantId: string, id: string, data: any) {
    await prisma.educationFeeStructure.updateMany({
      where: { tenantId, id },
      data,
    });
    return prisma.educationFeeStructure.findFirst({ where: { tenantId, id } });
  }
  async getStudentFees(tenantId: string) {
    return prisma.studentFee.findMany({
      where: { tenantId },
      include: { student: true, feeStructure: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async assignStudentFee(tenantId: string, data: any) {
    return prisma.studentFee.create({
      data: { ...data, tenantId },
      include: { student: true, feeStructure: true },
    });
  }
  async getInvoices(
    tenantId: string,
    filters?: { studentId?: string; status?: string },
  ) {
    return prisma.educationFeeInvoice.findMany({
      where: {
        tenantId,
        studentId: filters?.studentId,
        status: filters?.status,
      },
      include: { student: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createInvoice(tenantId: string, data: any) {
    return prisma.educationFeeInvoice.create({
      data: { ...data, tenantId },
      include: { student: true },
    });
  }
  async recordPayment(tenantId: string, invoiceId: string, data: any) {
    const payment = await prisma.educationFeePayment.create({
      data: { ...data, tenantId, invoiceId },
      include: { invoice: true },
    });
    const invoice = await prisma.educationFeeInvoice.findFirst({
      where: { tenantId, id: invoiceId },
    });
    if (invoice) {
      const totalPaid =
        (
          await prisma.educationFeePayment.aggregate({
            where: { invoiceId, tenantId },
            _sum: { amount: true },
          })
        )._sum.amount || 0;
      const newStatus =
        totalPaid >= invoice.totalAmount
          ? "PAID"
          : totalPaid > 0
            ? "PARTIAL"
            : "PENDING";
      await prisma.educationFeeInvoice.updateMany({
        where: { tenantId, id: invoiceId },
        data: { status: newStatus, paidAmount: totalPaid },
      });
    }
    return payment;
  }
  async getPaymentHistory(tenantId: string, studentId?: string) {
    return prisma.educationFeePayment.findMany({
      where: { tenantId, invoice: studentId ? { studentId } : undefined },
      include: { invoice: { include: { student: true } } },
      orderBy: { paidAt: "desc" },
    });
  }
}
