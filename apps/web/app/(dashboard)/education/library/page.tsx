"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  BookOpen,
  Plus,
  Search,
  ArrowLeftRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  isbn: string;
  author: string;
  quantity: number;
  available?: number;
}

interface BookTransaction {
  id: string;
  studentId: string;
  bookId: string;
  type: string;
  dueDate: string;
  returnedDate?: string | null;
  student?: { firstName: string; lastName: string };
  book?: { title: string };
}

export default function LibraryPage() {
  const client = useApiClient();
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<BookTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "books") as
    | "books"
    | "transactions";
  const [createOpen, setCreateOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "",
    isbn: "",
    author: "",
    quantity: 1,
  });
  const [checkoutForm, setCheckoutForm] = useState({
    studentId: "",
    bookId: "",
    dueDate: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [bRes, tRes] = await Promise.all([
          client.get<Book[] | { data?: Book[] }>("/ext/education/books"),
          client.get<BookTransaction[] | { data?: BookTransaction[] }>(
            "/ext/education/book-transactions",
          ),
        ]);
        setBooks(Array.isArray(bRes) ? bRes : bRes.data || []);
        setTransactions(Array.isArray(tRes) ? tRes : tRes.data || []);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const handleCreateBook = async () => {
    if (!bookForm.title || !bookForm.isbn) return;
    setCreating(true);
    try {
      await client.post("/ext/education/books", {
        ...bookForm,
        quantity: Number(bookForm.quantity),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch {
      /* handled */
    } finally {
      setCreating(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutForm.studentId || !checkoutForm.bookId) return;
    setCreating(true);
    try {
      await client.post("/ext/education/books/checkout", checkoutForm);
      setCheckoutOpen(false);
      window.location.reload();
    } catch {
      /* handled */
    } finally {
      setCreating(false);
    }
  };

  const totalBooks = books.reduce((a, b) => a + (b.quantity || 0), 0);
  const checkedOut = transactions.filter((t) => !t.returnedDate).length;

  const bookColumns: Column<Book>[] = [
    {
      key: "book",
      header: "Book",
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            <BookOpen size={18} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.title}</div>
            <div className="ui-text-xs-tertiary">{row.author}</div>
          </div>
        </div>
      ),
    },
    {
      key: "isbn",
      header: "ISBN",
      render: (row) => <code className={styles.s2}>{row.isbn}</code>,
    },
    {
      key: "qty",
      header: "Total Qty",
      render: (row) => <span className="text-sm">{row.quantity}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.quantity > 0 ? "success" : "danger"}>
          {row.quantity > 0 ? "Available" : "All Out"}
        </Badge>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="education.library.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Library"
          description="Book register, checkouts, and availability tracking"
          breadcrumbs={[
            { label: "Education", href: "/education" },
            { label: "Library" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="secondary" onClick={() => setCheckoutOpen(true)}>
                <ArrowLeftRight size={14} className="mr-2" /> Checkout
              </Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={14} className="mr-2" /> Add Book
              </Button>
            </div>
          }
        />

        <div className="ui-grid-auto">
          <KPICard
            title="Total Books"
            value={totalBooks}
            icon={<BookOpen size={18} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Unique Titles"
            value={books.length}
            icon={<BookOpen size={18} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Checked Out"
            value={checkedOut}
            icon={<ArrowLeftRight size={18} />}
            color="var(--color-warning)"
          />
        </div>

        <SubTabBar
          tabs={
            [
              {
                id: "books",
                label: "Book Register",
                href: "/education/library?subtab=books",
                icon: BookOpen,
              },
              {
                id: "transactions",
                label: "Transactions",
                href: "/education/library?subtab=transactions",
                icon: ArrowLeftRight,
              },
            ] as SubTab[]
          }
        />

        {activeTab === "books" && (
          <Card padding="none">
            <DataTable
              columns={bookColumns}
              data={books}
              rowKey={(r) => r.id}
              emptyTitle="No books"
              emptyMessage="Add books to your library register."
              emptyIcon={<BookOpen size={48} />}
            />
          </Card>
        )}

        {activeTab === "transactions" && (
          <Card padding="none">
            <DataTable
              columns={
                [
                  {
                    key: "student",
                    header: "Student",
                    render: (row: BookTransaction) => (
                      <span className="text-sm">
                        {row.student
                          ? `${row.student.firstName} ${row.student.lastName}`
                          : row.studentId}
                      </span>
                    ),
                  },
                  {
                    key: "book",
                    header: "Book",
                    render: (row: BookTransaction) => (
                      <span className="text-sm">
                        {row.book?.title || row.bookId}
                      </span>
                    ),
                  },
                  {
                    key: "due",
                    header: "Due Date",
                    render: (row: BookTransaction) => (
                      <span className="text-sm">
                        {new Date(row.dueDate).toLocaleDateString()}
                      </span>
                    ),
                  },
                  {
                    key: "returned",
                    header: "Returned",
                    render: (row: BookTransaction) =>
                      row.returnedDate ? (
                        <Badge variant="success">Returned</Badge>
                      ) : (
                        <Badge variant="warning">Out</Badge>
                      ),
                  },
                ] as Column<BookTransaction>[]
              }
              data={transactions}
              rowKey={(r) => r.id}
              emptyTitle="No transactions"
              emptyMessage="Book checkout/return records will appear here."
              emptyIcon={<ArrowLeftRight size={48} />}
            />
          </Card>
        )}

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Book"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateBook}
                disabled={creating}
              >
                {creating ? "Saving..." : "Add Book"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Title"
              required
              value={bookForm.title}
              onChange={(e) =>
                setBookForm({ ...bookForm, title: e.target.value })
              }
            />
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="ISBN"
                required
                value={bookForm.isbn}
                onChange={(e) =>
                  setBookForm({ ...bookForm, isbn: e.target.value })
                }
              />
              <TextField
                label="Author"
                value={bookForm.author}
                onChange={(e) =>
                  setBookForm({ ...bookForm, author: e.target.value })
                }
              />
            </div>
            <TextField
              label="Quantity"
              type="number"
              value={String(bookForm.quantity)}
              onChange={(e) =>
                setBookForm({ ...bookForm, quantity: Number(e.target.value) })
              }
            />
          </div>
        </Modal>

        <Modal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          title="Checkout Book"
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={creating}
              >
                {creating ? "Processing..." : "Checkout"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Student ID"
              required
              value={checkoutForm.studentId}
              onChange={(e) =>
                setCheckoutForm({ ...checkoutForm, studentId: e.target.value })
              }
            />
            <FormField label="Book">
              <Select
                value={checkoutForm.bookId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setCheckoutForm({ ...checkoutForm, bookId: e.target.value })
                }
              >
                <option value="">Select book...</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </Select>
            </FormField>
            <TextField
              label="Due Date"
              type="date"
              value={checkoutForm.dueDate}
              onChange={(e) =>
                setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })
              }
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
