// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EducationLibraryService } from "../services/library.service";

const mockPrisma = vi.hoisted(() => ({
  educationBook: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  bookTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  educationLibraryFine: { create: vi.fn(), findMany: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationLibraryService", () => {
  let svc: EducationLibraryService;
  const tenantId = "tenant_1";
  const now = new Date("2026-07-27");

  beforeEach(() => {
    vi.useFakeTimers({ now });
    svc = new EducationLibraryService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should getBooks", async () => {
    mockPrisma.educationBook.findMany.mockResolvedValue([
      { id: "b1", title: "Math Book" },
    ]);
    const result = await svc.getBooks(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should createBook", async () => {
    mockPrisma.educationBook.create.mockResolvedValue({
      id: "b1",
      isbn: "123",
    });
    const result = await svc.createBook(tenantId, {
      title: "Physics",
      isbn: "123",
    });
    expect(result.isbn).toBe("123");
  });

  it("should checkout book", async () => {
    mockPrisma.educationBook.findFirst.mockResolvedValue({
      id: "b1",
      available: 5,
      quantity: 10,
    });
    mockPrisma.educationBook.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.bookTransaction.create.mockResolvedValue({
      id: "co1",
      type: "CHECKOUT",
      studentId: "s1",
      bookId: "b1",
    });
    const result = await svc.checkout(tenantId, "s1", "b1");
    expect(result.type).toBe("CHECKOUT");
  });

  it("should return book and calculate fine if overdue", async () => {
    mockPrisma.bookTransaction.findFirst.mockResolvedValueOnce({
      id: "co1",
      dueDate: new Date("2026-07-20"),
      bookId: "b1",
      studentId: "s1",
    });
    mockPrisma.bookTransaction.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.educationBook.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.educationLibraryFine.create.mockResolvedValue({
      id: "f1",
      amount: 3.5,
    });
    mockPrisma.bookTransaction.findFirst.mockResolvedValueOnce({
      id: "co1",
      type: "RETURNED",
    });
    const result = await svc.returnBook(tenantId, "co1");
    expect(result.type).toBe("RETURNED");
  });

  it("should not fine if returned on time", async () => {
    mockPrisma.bookTransaction.findFirst.mockResolvedValueOnce({
      id: "co1",
      dueDate: new Date("2026-08-01"),
      bookId: "b1",
      studentId: "s1",
    });
    mockPrisma.bookTransaction.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.educationBook.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.bookTransaction.findFirst.mockResolvedValueOnce({
      id: "co1",
      type: "RETURNED",
    });
    const result = await svc.returnBook(tenantId, "co1");
    expect(result.type).toBe("RETURNED");
  });

  it("should searchBooks", async () => {
    mockPrisma.educationBook.findMany.mockResolvedValue([{ id: "b1" }]);
    const result = await svc.searchBooks(tenantId, "Math");
    expect(result).toHaveLength(1);
  });
});
