// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class EducationLibraryService {
  async getBooks(tenantId: string) {
    return prisma.educationBook.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async getBookById(tenantId: string, id: string) {
    return prisma.educationBook.findFirst({
      where: { tenantId, id },
      include: {
        transactions: {
          include: { student: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }
  async createBook(tenantId: string, data: any) {
    return prisma.educationBook.create({
      data: { ...data, tenantId, available: data.quantity },
    });
  }
  async updateBook(tenantId: string, id: string, data: any) {
    await prisma.educationBook.updateMany({ where: { tenantId, id }, data });
    return this.getBookById(tenantId, id);
  }
  async deleteBook(tenantId: string, id: string) {
    return prisma.educationBook.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async checkout(
    tenantId: string,
    studentId: string,
    bookId: string,
    dueDate?: string,
  ) {
    const book = await prisma.educationBook.findFirst({
      where: { tenantId, id: bookId },
    });
    if (!book || book.available <= 0) throw new Error("Book not available");
    await prisma.educationBook.updateMany({
      where: { tenantId, id: bookId },
      data: { available: { decrement: 1 } },
    });
    return prisma.bookTransaction.create({
      data: {
        tenantId,
        studentId,
        bookId,
        type: "CHECKOUT",
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: { student: true, book: true },
    });
  }
  async returnBook(tenantId: string, transactionId: string) {
    const tx = await prisma.bookTransaction.findFirst({
      where: { tenantId, id: transactionId },
    });
    if (!tx) throw new Error("Transaction not found");
    await prisma.bookTransaction.updateMany({
      where: { tenantId, id: transactionId },
      data: { type: "RETURNED", returnedDate: new Date() },
    });
    await prisma.educationBook.updateMany({
      where: { tenantId, id: tx.bookId },
      data: { available: { increment: 1 } },
    });
    if (tx.dueDate && new Date() > tx.dueDate) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - tx.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const fine = daysOverdue * 0.5;
      await prisma.educationLibraryFine.create({
        data: {
          tenantId,
          studentId: tx.studentId,
          transactionId,
          amount: fine,
          reason: "OVERDUE",
        },
      });
    }
    return prisma.bookTransaction.findFirst({
      where: { tenantId, id: transactionId },
      include: { student: true, book: true },
    });
  }
  async getTransactions(tenantId: string) {
    return prisma.bookTransaction.findMany({
      where: { tenantId },
      include: { student: true, book: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async getFines(tenantId: string, studentId?: string) {
    return prisma.educationLibraryFine.findMany({
      where: { tenantId, studentId },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async payFine(tenantId: string, fineId: string) {
    return prisma.educationLibraryFine.updateMany({
      where: { tenantId, id: fineId },
      data: { status: "PAID", paidAt: new Date() },
    });
  }
  async waiveFine(tenantId: string, fineId: string) {
    return prisma.educationLibraryFine.updateMany({
      where: { tenantId, id: fineId },
      data: { status: "WAIVED" },
    });
  }
  async searchBooks(tenantId: string, q: string) {
    return prisma.educationBook.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { isbn: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
  }
}
