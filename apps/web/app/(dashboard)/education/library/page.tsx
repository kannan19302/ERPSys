'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { BookOpen, Plus, Search, ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react';

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

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<BookTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'transactions'>('books');
  const [createOpen, setCreateOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', isbn: '', author: '', quantity: 1 });
  const [checkoutForm, setCheckoutForm] = useState({ studentId: '', bookId: '', dueDate: '' });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [bRes, tRes] = await Promise.all([
          fetch('/api/v1/education/books', { headers }),
          fetch('/api/v1/education/book-transactions', { headers }),
        ]);
        if (bRes.ok) { const d = await bRes.json(); setBooks(Array.isArray(d) ? d : d?.data || []); }
        if (tRes.ok) { const d = await tRes.json(); setTransactions(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreateBook = async () => {
    if (!bookForm.title || !bookForm.isbn) return;
    setCreating(true);
    try {
      await fetch('/api/v1/education/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...bookForm, quantity: Number(bookForm.quantity) }),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutForm.studentId || !checkoutForm.bookId) return;
    setCreating(true);
    try {
      await fetch('/api/v1/education/books/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(checkoutForm),
      });
      setCheckoutOpen(false);
      window.location.reload();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const totalBooks = books.reduce((a, b) => a + (b.quantity || 0), 0);
  const checkedOut = transactions.filter(t => !t.returnedDate).length;

  const bookColumns: Column<Book>[] = [
    {
      key: 'book', header: 'Book',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-info-light)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.title}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.author}</div>
          </div>
        </div>
      ),
    },
    { key: 'isbn', header: 'ISBN', render: (row) => <code style={{ fontSize: '11px' }}>{row.isbn}</code> },
    { key: 'qty', header: 'Total Qty', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.quantity}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.quantity > 0 ? 'success' : 'danger'}>{row.quantity > 0 ? 'Available' : 'All Out'}</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Library" description="Book register, checkouts, and availability tracking"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Library' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setCheckoutOpen(true)}><ArrowLeftRight size={14} style={{ marginRight: 6 }} /> Checkout</Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Book</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Books" value={totalBooks} icon={<BookOpen size={18} />} color="var(--color-primary)" />
        <KPICard title="Unique Titles" value={books.length} icon={<BookOpen size={18} />} color="var(--color-info)" />
        <KPICard title="Checked Out" value={checkedOut} icon={<ArrowLeftRight size={18} />} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
        {(['books', 'transactions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
            border: 'none', borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none', cursor: 'pointer',
            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}>
            {tab === 'books' ? 'Book Register' : 'Transactions'}
          </button>
        ))}
      </div>

      {activeTab === 'books' && (
        <Card padding="none">
          <DataTable columns={bookColumns} data={books} rowKey={r => r.id}
            emptyTitle="No books" emptyMessage="Add books to your library register." emptyIcon={<BookOpen size={48} />} />
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card padding="none">
          <DataTable
            columns={[
              { key: 'student', header: 'Student', render: (row: BookTransaction) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.student ? `${row.student.firstName} ${row.student.lastName}` : row.studentId}</span> },
              { key: 'book', header: 'Book', render: (row: BookTransaction) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.book?.title || row.bookId}</span> },
              { key: 'due', header: 'Due Date', render: (row: BookTransaction) => <span style={{ fontSize: 'var(--text-sm)' }}>{new Date(row.dueDate).toLocaleDateString()}</span> },
              { key: 'returned', header: 'Returned', render: (row: BookTransaction) => row.returnedDate ? <Badge variant="success">Returned</Badge> : <Badge variant="warning">Out</Badge> },
            ] as Column<BookTransaction>[]}
            data={transactions} rowKey={r => r.id}
            emptyTitle="No transactions" emptyMessage="Book checkout/return records will appear here." emptyIcon={<ArrowLeftRight size={48} />}
          />
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Book" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateBook} disabled={creating}>{creating ? 'Saving...' : 'Add Book'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Title" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="ISBN" required value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} />
            <TextField label="Author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
          </div>
          <TextField label="Quantity" type="number" value={String(bookForm.quantity)} onChange={e => setBookForm({ ...bookForm, quantity: Number(e.target.value) })} />
        </div>
      </Modal>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout Book" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCheckoutOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCheckout} disabled={creating}>{creating ? 'Processing...' : 'Checkout'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Student ID" required value={checkoutForm.studentId} onChange={e => setCheckoutForm({ ...checkoutForm, studentId: e.target.value })} />
          <FormField label="Book">
            <Select value={checkoutForm.bookId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCheckoutForm({ ...checkoutForm, bookId: e.target.value })}>
              <option value="">Select book...</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </Select>
          </FormField>
          <TextField label="Due Date" type="date" value={checkoutForm.dueDate} onChange={e => setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
