import '../../../../core/error/exceptions.dart';
import '../../domain/entities/finance.dart';

class InvoiceModel extends Invoice {
  const InvoiceModel({
    required super.id,
    required super.customerId,
    required super.customerName,
    required super.invoiceNumber,
    required super.status,
    required super.items,
    required super.subtotal,
    required super.taxTotal,
    required super.discountTotal,
    required super.totalAmount,
    required super.currency,
    required super.dueDate,
    required super.invoiceDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Invoice is missing its id');
    }
    return InvoiceModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      items: json['items'] is List
          ? (json['items'] as List)
              .map((Object? e) => InvoiceLineItemModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const <InvoiceLineItemModel>[],
      subtotal: asDouble(json['subtotal']),
      taxTotal: asDouble(json['taxTotal']),
      discountTotal: asDouble(json['discountTotal']),
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      dueDate: DateTime.parse(json['dueDate'] as String),
      invoiceDate: DateTime.parse(json['invoiceDate'] as String),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'customerName': customerName,
        'invoiceNumber': invoiceNumber,
        'status': status,
        'items': items.map((InvoiceLineItem i) => (i as InvoiceLineItemModel).toJson()).toList(),
        'subtotal': subtotal,
        'taxTotal': taxTotal,
        'discountTotal': discountTotal,
        'totalAmount': totalAmount,
        'currency': currency,
        'dueDate': dueDate.toIso8601String(),
        'invoiceDate': invoiceDate.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class InvoiceLineItemModel extends InvoiceLineItem {
  const InvoiceLineItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity,
    super.rate,
    super.amount,
    super.taxRate,
    super.taxAmount,
  });

  factory InvoiceLineItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('InvoiceLineItem is missing its id');
    }
    return InvoiceLineItemModel(
      id: id,
      productId: json['productId'] as String?,
      productName: json['productName'] as String?,
      description: json['description'] as String?,
      quantity: asDouble(json['quantity']),
      rate: asDouble(json['rate']),
      amount: asDouble(json['amount']),
      taxRate: asDouble(json['taxRate']),
      taxAmount: asDouble(json['taxAmount']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'taxRate': taxRate,
        'taxAmount': taxAmount,
      };
}

class PaymentModel extends Payment {
  const PaymentModel({
    required super.id,
    required super.invoiceId,
    super.invoiceNumber,
    super.customerName,
    required super.amount,
    super.currency,
    required super.paymentDate,
    super.method,
    super.reference,
    super.status,
    super.notes,
    super.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Payment is missing its id');
    }
    return PaymentModel(
      id: id,
      invoiceId: json['invoiceId'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String?,
      customerName: json['customerName'] as String?,
      amount: asDouble(json['amount']),
      currency: json['currency'] as String?,
      paymentDate: DateTime.parse(json['paymentDate'] as String),
      method: json['method'] as String? ?? 'BANK_TRANSFER',
      reference: json['reference'] as String?,
      status: json['status'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'invoiceId': invoiceId,
        'invoiceNumber': invoiceNumber,
        'customerName': customerName,
        'amount': amount,
        'currency': currency,
        'paymentDate': paymentDate.toIso8601String(),
        'method': method,
        'reference': reference,
        'status': status,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class CreditNoteModel extends CreditNote {
  const CreditNoteModel({
    required super.id,
    required super.customerId,
    super.customerName,
    required super.creditNoteNumber,
    required super.status,
    required super.invoiceId,
    super.reason,
    required super.items,
    required super.totalAmount,
    super.currency,
    required super.date,
    super.createdAt,
  });

  factory CreditNoteModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('CreditNote is missing its id');
    }
    return CreditNoteModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      customerName: json['customerName'] as String?,
      creditNoteNumber: json['creditNoteNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      invoiceId: json['invoiceId'] as String? ?? '',
      reason: json['reason'] as String?,
      items: json['items'] is List
          ? (json['items'] as List)
              .map((Object? e) => CreditNoteLineItemModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const <CreditNoteLineItemModel>[],
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String?,
      date: DateTime.parse(json['date'] as String),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'customerName': customerName,
        'creditNoteNumber': creditNoteNumber,
        'status': status,
        'invoiceId': invoiceId,
        'reason': reason,
        'items': items.map((CreditNoteLineItem i) => (i as CreditNoteLineItemModel).toJson()).toList(),
        'totalAmount': totalAmount,
        'currency': currency,
        'date': date.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class CreditNoteLineItemModel extends CreditNoteLineItem {
  const CreditNoteLineItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity,
    super.rate,
    super.amount,
    super.taxRate,
    super.taxAmount,
  });

  factory CreditNoteLineItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('CreditNoteLineItem is missing its id');
    }
    return CreditNoteLineItemModel(
      id: id,
      productId: json['productId'] as String?,
      productName: json['productName'] as String?,
      description: json['description'] as String?,
      quantity: asDouble(json['quantity']),
      rate: asDouble(json['rate']),
      amount: asDouble(json['amount']),
      taxRate: asDouble(json['taxRate']),
      taxAmount: asDouble(json['taxAmount']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'taxRate': taxRate,
        'taxAmount': taxAmount,
      };
}

class TaxRateModel extends TaxRate {
  const TaxRateModel({
    required super.id,
    required super.name,
    required super.rate,
    super.type,
    super.isActive,
    super.createdAt,
  });

  factory TaxRateModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('TaxRate is missing its id');
    }
    return TaxRateModel(
      id: id,
      name: json['name'] as String? ?? '',
      rate: asDouble(json['rate']),
      type: json['type'] as String? ?? 'SALES',
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'rate': rate,
        'type': type,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BudgetModel extends Budget {
  const BudgetModel({
    required super.id,
    required super.name,
    required super.fiscalYear,
    required super.totalAmount,
    required super.spentAmount,
    required super.remainingAmount,
    super.status,
    super.createdAt,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Budget is missing its id');
    }
    return BudgetModel(
      id: id,
      name: json['name'] as String? ?? '',
      fiscalYear: json['fiscalYear'] as String? ?? '',
      totalAmount: asDouble(json['totalAmount']),
      spentAmount: asDouble(json['spentAmount']),
      remainingAmount: asDouble(json['remainingAmount']),
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'fiscalYear': fiscalYear,
        'totalAmount': totalAmount,
        'spentAmount': spentAmount,
        'remainingAmount': remainingAmount,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };

double? asDoubleOrNull(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v),
      _ => null,
    };
