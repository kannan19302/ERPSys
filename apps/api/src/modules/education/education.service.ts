import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class EducationService {
  async getStudents(tenantId: string) {
    return prisma.student.findMany({
      where: { tenantId },
      orderBy: { enrollmentNumber: 'asc' },
    });
  }

  async createStudent(
    tenantId: string,
    dto: { firstName: string; lastName: string; dateOfBirth: string; enrollmentNumber: string; parentContact: string }
  ) {
    return prisma.student.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        enrollmentNumber: dto.enrollmentNumber,
        parentContact: JSON.parse(dto.parentContact),
      },
    });
  }

  async getCourses(tenantId: string) {
    return prisma.course.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createCourse(
    tenantId: string,
    dto: { name: string; code: string; credits: number; description?: string }
  ) {
    return prisma.course.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        credits: dto.credits,
        description: dto.description,
      },
    });
  }

  async getTimetables(tenantId: string) {
    return prisma.timetable.findMany({
      where: { tenantId },
      include: { course: true },
      orderBy: { weekday: 'asc' },
    });
  }

  async createTimetable(
    tenantId: string,
    dto: { courseId: string; room: string; weekday: string; startTime: string; endTime: string; instructorId: string }
  ) {
    return prisma.timetable.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        room: dto.room,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        instructorId: dto.instructorId,
      },
    });
  }

  async getFeeStructures(tenantId: string) {
    return prisma.feeStructure.findMany({
      where: { tenantId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async createFeeStructure(
    tenantId: string,
    dto: { name: string; description?: string; amount: number; dueDate: string }
  ) {
    return prisma.feeStructure.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  async getStudentFees(tenantId: string) {
    return prisma.studentFee.findMany({
      where: { tenantId },
      include: { student: true, feeStructure: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payStudentFee(
    tenantId: string,
    dto: { studentFeeId: string; paymentAmount: number }
  ) {
    const fee = await prisma.studentFee.findUnique({
      where: { id: dto.studentFeeId, tenantId },
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    const newAmountPaid = Number(fee.amountPaid) + dto.paymentAmount;
    const newBalance = Number(fee.balance) - dto.paymentAmount;
    const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    return prisma.studentFee.update({
      where: { id: dto.studentFeeId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance < 0 ? 0 : newBalance,
        status,
      },
    });
  }

  async getBookRegister(tenantId: string) {
    return prisma.bookRegister.findMany({
      where: { tenantId },
      orderBy: { title: 'asc' },
    });
  }

  async createBook(
    tenantId: string,
    dto: { title: string; isbn: string; author: string; quantity: number }
  ) {
    return prisma.bookRegister.create({
      data: {
        tenantId,
        title: dto.title,
        isbn: dto.isbn,
        author: dto.author,
        quantity: dto.quantity,
        available: dto.quantity,
      },
    });
  }

  async getBookTransactions(tenantId: string) {
    return prisma.bookTransaction.findMany({
      where: { tenantId },
      include: { student: true, book: true },
      orderBy: { checkoutDate: 'desc' },
    });
  }

  async checkoutBook(
    tenantId: string,
    dto: { studentId: string; bookId: string; dueDate: string }
  ) {
    const book = await prisma.bookRegister.findUnique({
      where: { id: dto.bookId },
    });

    if (!book || book.available <= 0) {
      throw new Error('Book is not available for checkout');
    }

    await prisma.bookRegister.update({
      where: { id: dto.bookId },
      data: { available: book.available - 1 },
    });

    return prisma.bookTransaction.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        bookId: dto.bookId,
        checkoutDate: new Date(),
        dueDate: new Date(dto.dueDate),
        status: 'ISSUED',
      },
    });
  }

  async returnBook(
    tenantId: string,
    dto: { transactionId: string }
  ) {
    const tx = await prisma.bookTransaction.findUnique({
      where: { id: dto.transactionId, tenantId },
    });

    if (!tx || tx.status === 'RETURNED') {
      throw new Error('Transaction invalid or already returned');
    }

    const book = await prisma.bookRegister.findUnique({
      where: { id: tx.bookId },
    });

    if (book) {
      await prisma.bookRegister.update({
        where: { id: tx.bookId },
        data: { available: book.available + 1 },
      });
    }

    return prisma.bookTransaction.update({
      where: { id: dto.transactionId },
      data: {
        returnDate: new Date(),
        status: 'RETURNED',
      },
    });
  }
}
