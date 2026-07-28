import '../../../../core/error/exceptions.dart';
import '../../domain/entities/saas.dart';

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

class SaasPlanModel extends SaasPlan {
  const SaasPlanModel({
    required super.id,
    required super.name,
    super.description,
    required super.price,
    required super.billingInterval,
    super.features = const <String>[],
    super.isActive = true,
    super.maxUsers,
    super.maxStorage,
    super.createdAt,
    super.updatedAt,
  });

  factory SaasPlanModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasPlan missing id');
    return SaasPlanModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      price: asDouble(json['price']),
      billingInterval: json['billingInterval'] as String? ?? 'monthly',
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      isActive: json['isActive'] as bool? ?? true,
      maxUsers: asInt(json['maxUsers']),
      maxStorage: asInt(json['maxStorage']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        'billingInterval': billingInterval,
        'features': features,
        'isActive': isActive,
        'maxUsers': maxUsers,
        'maxStorage': maxStorage,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SaasSubscriptionModel extends SaasSubscription {
  const SaasSubscriptionModel({
    required super.id,
    required super.tenantId,
    required super.planId,
    required super.planName,
    required super.status,
    super.currentPeriodStart,
    super.currentPeriodEnd,
    super.cancelAtPeriodEnd = false,
    super.trialEndsAt,
    super.stripeSubscriptionId,
    super.createdAt,
    super.updatedAt,
  });

  factory SaasSubscriptionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasSubscription missing id');
    return SaasSubscriptionModel(
      id: id,
      tenantId: json['tenantId'] as String? ?? '',
      planId: json['planId'] as String? ?? '',
      planName: json['planName'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      currentPeriodStart: DateTime.tryParse('${json['currentPeriodStart']}'),
      currentPeriodEnd: DateTime.tryParse('${json['currentPeriodEnd']}'),
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
      trialEndsAt: DateTime.tryParse('${json['trialEndsAt']}'),
      stripeSubscriptionId: json['stripeSubscriptionId'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'tenantId': tenantId,
        'planId': planId,
        'planName': planName,
        'status': status,
        'currentPeriodStart': currentPeriodStart?.toIso8601String(),
        'currentPeriodEnd': currentPeriodEnd?.toIso8601String(),
        'cancelAtPeriodEnd': cancelAtPeriodEnd,
        'trialEndsAt': trialEndsAt?.toIso8601String(),
        'stripeSubscriptionId': stripeSubscriptionId,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SaasInvoiceModel extends SaasInvoice {
  const SaasInvoiceModel({
    required super.id,
    required super.subscriptionId,
    required super.amount,
    required super.currency,
    required super.status,
    super.invoiceNumber,
    super.paidAt,
    super.stripeInvoiceId,
    super.invoicePdf,
    super.createdAt,
  });

  factory SaasInvoiceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasInvoice missing id');
    return SaasInvoiceModel(
      id: id,
      subscriptionId: json['subscriptionId'] as String? ?? '',
      amount: asDouble(json['amount']),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'PENDING',
      invoiceNumber: json['invoiceNumber'] as String?,
      paidAt: DateTime.tryParse('${json['paidAt']}'),
      stripeInvoiceId: json['stripeInvoiceId'] as String?,
      invoicePdf: json['invoicePdf'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subscriptionId': subscriptionId,
        'amount': amount,
        'currency': currency,
        'status': status,
        'invoiceNumber': invoiceNumber,
        'paidAt': paidAt?.toIso8601String(),
        'stripeInvoiceId': stripeInvoiceId,
        'invoicePdf': invoicePdf,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SaasUsageRecordModel extends SaasUsageRecord {
  const SaasUsageRecordModel({
    required super.id,
    required super.tenantId,
    required super.metric,
    required super.quantity,
    super.recordedAt,
  });

  factory SaasUsageRecordModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasUsageRecord missing id');
    return SaasUsageRecordModel(
      id: id,
      tenantId: json['tenantId'] as String? ?? '',
      metric: json['metric'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      recordedAt: DateTime.tryParse('${json['recordedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'tenantId': tenantId,
        'metric': metric,
        'quantity': quantity,
        'recordedAt': recordedAt?.toIso8601String(),
      };
}

class SaasQuotaModel extends SaasQuota {
  const SaasQuotaModel({
    required super.id,
    required super.tenantId,
    required super.metric,
    required super.limit,
    required super.used,
    super.resetAt,
  });

  factory SaasQuotaModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasQuota missing id');
    return SaasQuotaModel(
      id: id,
      tenantId: json['tenantId'] as String? ?? '',
      metric: json['metric'] as String? ?? '',
      limit: asDouble(json['limit']),
      used: asDouble(json['used']),
      resetAt: DateTime.tryParse('${json['resetAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'tenantId': tenantId,
        'metric': metric,
        'limit': limit,
        'used': used,
        'resetAt': resetAt?.toIso8601String(),
      };
}

class SaasTenantModel extends SaasTenant {
  const SaasTenantModel({
    required super.id,
    required super.organizationName,
    super.domain,
    super.status = 'ACTIVE',
    super.planId,
    super.planName,
    super.userCount = 0,
    super.storageUsed = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory SaasTenantModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SaasTenant missing id');
    return SaasTenantModel(
      id: id,
      organizationName: json['organizationName'] as String? ?? '',
      domain: json['domain'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      planId: json['planId'] as String?,
      planName: json['planName'] as String?,
      userCount: asInt(json['userCount']),
      storageUsed: asDouble(json['storageUsed']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'organizationName': organizationName,
        'domain': domain,
        'status': status,
        'planId': planId,
        'planName': planName,
        'userCount': userCount,
        'storageUsed': storageUsed,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
