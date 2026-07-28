import 'package:equatable/equatable.dart';

class SaasPlan extends Equatable {
  const SaasPlan({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.billingInterval,
    this.features = const <String>[],
    this.isActive = true,
    this.maxUsers,
    this.maxStorage,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final double price;
  final String billingInterval;
  final List<String> features;
  final bool isActive;
  final int? maxUsers;
  final int? maxStorage;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, price, billingInterval, features,
        isActive, maxUsers, maxStorage, createdAt, updatedAt,
      ];
}

class SaasSubscription extends Equatable {
  const SaasSubscription({
    required this.id,
    required this.tenantId,
    required this.planId,
    required this.planName,
    required this.status,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
    this.trialEndsAt,
    this.stripeSubscriptionId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String tenantId;
  final String planId;
  final String planName;
  final String status;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;
  final DateTime? trialEndsAt;
  final String? stripeSubscriptionId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, tenantId, planId, planName, status, currentPeriodStart,
        currentPeriodEnd, cancelAtPeriodEnd, trialEndsAt,
        stripeSubscriptionId, createdAt, updatedAt,
      ];
}

class SaasInvoice extends Equatable {
  const SaasInvoice({
    required this.id,
    required this.subscriptionId,
    required this.amount,
    required this.currency,
    required this.status,
    this.invoiceNumber,
    this.paidAt,
    this.stripeInvoiceId,
    this.invoicePdf,
    this.createdAt,
  });

  final String id;
  final String subscriptionId;
  final double amount;
  final String currency;
  final String status;
  final String? invoiceNumber;
  final DateTime? paidAt;
  final String? stripeInvoiceId;
  final String? invoicePdf;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, subscriptionId, amount, currency, status, invoiceNumber,
        paidAt, stripeInvoiceId, invoicePdf, createdAt,
      ];
}

class SaasUsageRecord extends Equatable {
  const SaasUsageRecord({
    required this.id,
    required this.tenantId,
    required this.metric,
    required this.quantity,
    this.recordedAt,
  });

  final String id;
  final String tenantId;
  final String metric;
  final double quantity;
  final DateTime? recordedAt;

  @override
  List<Object?> get props => <Object?>[id, tenantId, metric, quantity, recordedAt];
}

class SaasQuota extends Equatable {
  const SaasQuota({
    required this.id,
    required this.tenantId,
    required this.metric,
    required this.limit,
    required this.used,
    this.resetAt,
  });

  final String id;
  final String tenantId;
  final String metric;
  final double limit;
  final double used;
  final DateTime? resetAt;

  @override
  List<Object?> get props => <Object?>[id, tenantId, metric, limit, used, resetAt];
}

class SaasTenant extends Equatable {
  const SaasTenant({
    required this.id,
    required this.organizationName,
    this.domain,
    this.status = 'ACTIVE',
    this.planId,
    this.planName,
    this.userCount = 0,
    this.storageUsed = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String organizationName;
  final String? domain;
  final String status;
  final String? planId;
  final String? planName;
  final int userCount;
  final double storageUsed;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, organizationName, domain, status, planId, planName,
        userCount, storageUsed, createdAt, updatedAt,
      ];
}
