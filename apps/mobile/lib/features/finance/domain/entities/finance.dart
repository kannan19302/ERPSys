import 'package:equatable/equatable.dart';

/// A financial invoice, representing a bill sent to a customer.
class Invoice extends Equatable {
  const Invoice({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.invoiceNumber,
    required this.status,
    required this.items,
    required this.subtotal,
    required this.taxTotal,
    required this.discountTotal,
    required this.totalAmount,
    required this.currency,
    required this.dueDate,
    required this.invoiceDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String customerId;
  final String customerName;
  final String invoiceNumber;
  final String status;
  final List<InvoiceLineItem> items;
  final double subtotal;
  final double taxTotal;
  final double discountTotal;
  final double totalAmount;
  final String currency;
  final DateTime dueDate;
  final DateTime invoiceDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, customerId, customerName, invoiceNumber, status, items,
        subtotal, taxTotal, discountTotal, totalAmount, currency,
        dueDate, invoiceDate, notes, createdAt, updatedAt,
      ];
}

/// A single line item within an Invoice.
class InvoiceLineItem extends Equatable {
  const InvoiceLineItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 1,
    this.rate = 0,
    this.amount = 0,
    this.taxRate = 0,
    this.taxAmount = 0,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double rate;
  final double amount;
  final double taxRate;
  final double taxAmount;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity, rate,
        amount, taxRate, taxAmount,
      ];
}

/// A payment applied against an invoice.
class Payment extends Equatable {
  const Payment({
    required this.id,
    required this.invoiceId,
    this.invoiceNumber,
    this.customerName,
    required this.amount,
    this.currency,
    required this.paymentDate,
    this.method = 'BANK_TRANSFER',
    this.reference,
    this.status,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String invoiceId;
  final String? invoiceNumber;
  final String? customerName;
  final double amount;
  final String? currency;
  final DateTime paymentDate;
  final String method;
  final String? reference;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, invoiceId, invoiceNumber, customerName, amount, currency,
        paymentDate, method, reference, status, notes, createdAt,
      ];
}

/// A credit note issued to a customer.
class CreditNote extends Equatable {
  const CreditNote({
    required this.id,
    required this.customerId,
    this.customerName,
    required this.creditNoteNumber,
    required this.status,
    required this.invoiceId,
    this.reason,
    required this.items,
    required this.totalAmount,
    this.currency,
    required this.date,
    this.createdAt,
  });

  final String id;
  final String customerId;
  final String? customerName;
  final String creditNoteNumber;
  final String status;
  final String invoiceId;
  final String? reason;
  final List<CreditNoteLineItem> items;
  final double totalAmount;
  final String? currency;
  final DateTime date;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, customerId, customerName, creditNoteNumber, status,
        invoiceId, reason, items, totalAmount, currency, date, createdAt,
      ];
}

/// A single line item within a CreditNote.
class CreditNoteLineItem extends Equatable {
  const CreditNoteLineItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 1,
    this.rate = 0,
    this.amount = 0,
    this.taxRate = 0,
    this.taxAmount = 0,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double rate;
  final double amount;
  final double taxRate;
  final double taxAmount;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity, rate,
        amount, taxRate, taxAmount,
      ];
}

/// A configured tax rate.
class TaxRate extends Equatable {
  const TaxRate({
    required this.id,
    required this.name,
    required this.rate,
    this.type = 'SALES',
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final double rate;
  final String type;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[id, name, rate, type, isActive, createdAt];
}

/// A budget plan for a fiscal period.
class Budget extends Equatable {
  const Budget({
    required this.id,
    required this.name,
    required this.fiscalYear,
    required this.totalAmount,
    required this.spentAmount,
    required this.remainingAmount,
    this.status = 'ACTIVE',
    this.createdAt,
  });

  final String id;
  final String name;
  final String fiscalYear;
  final double totalAmount;
  final double spentAmount;
  final double remainingAmount;
  final String status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, fiscalYear, totalAmount, spentAmount,
        remainingAmount, status, createdAt,
      ];
}

/// A tax filing record for a given period.
class TaxFiling extends Equatable {
  const TaxFiling({
    required this.id,
    required this.taxType,
    required this.period,
    required this.returnType,
    required this.totalTax,
    required this.status,
    required this.dueAt,
    this.filedAt,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String taxType;
  final String period;
  final String returnType;
  final double totalTax;
  final String status;
  final DateTime? filedAt;
  final DateTime dueAt;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, taxType, period, returnType, totalTax, status,
        filedAt, dueAt, notes, createdAt,
      ];
}

/// A chart of account entry.
class ChartOfAccount extends Equatable {
  const ChartOfAccount({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
    this.parentId,
    this.isActive = true,
    this.balance = 0,
    this.createdAt,
  });

  final String id;
  final String code;
  final String name;
  final String type;
  final String? parentId;
  final bool isActive;
  final double balance;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, name, type, parentId, isActive, balance, createdAt,
      ];
}

/// A single line item within a JournalEntry.
class JournalEntryLineItem extends Equatable {
  const JournalEntryLineItem({
    required this.id,
    required this.accountId,
    this.accountName,
    this.debit = 0,
    this.credit = 0,
    this.description,
  });

  final String id;
  final String accountId;
  final String? accountName;
  final double debit;
  final double credit;
  final String? description;

  @override
  List<Object?> get props => <Object?>[
        id, accountId, accountName, debit, credit, description,
      ];
}

/// A journal entry (general ledger entry).
class JournalEntry extends Equatable {
  const JournalEntry({
    required this.id,
    required this.entryNumber,
    required this.date,
    this.description,
    this.reference,
    this.totalDebit = 0,
    this.totalCredit = 0,
    this.status = 'DRAFT',
    this.createdAt,
    this.lineItems = const <JournalEntryLineItem>[],
  });

  final String id;
  final String entryNumber;
  final DateTime date;
  final String? description;
  final String? reference;
  final double totalDebit;
  final double totalCredit;
  final String status;
  final DateTime? createdAt;
  final List<JournalEntryLineItem> lineItems;

  @override
  List<Object?> get props => <Object?>[
        id, entryNumber, date, description, reference,
        totalDebit, totalCredit, status, createdAt, lineItems,
      ];
}

/// A bank account record.
class BankAccount extends Equatable {
  const BankAccount({
    required this.id,
    required this.name,
    required this.accountNumber,
    required this.bankName,
    this.branch,
    this.currency = 'USD',
    this.balance = 0,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String accountNumber;
  final String bankName;
  final String? branch;
  final String currency;
  final double balance;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, accountNumber, bankName, branch, currency,
        balance, isActive, createdAt,
      ];
}
