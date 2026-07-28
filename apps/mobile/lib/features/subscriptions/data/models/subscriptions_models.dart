import '../../../../core/error/exceptions.dart';
import '../../domain/entities/subscriptions.dart';

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

class SubscriptionPlanModel extends SubscriptionPlan {
  const SubscriptionPlanModel({
    required super.id,
    required super.name,
    super.description,
    required super.price,
    required super.interval,
    super.trialDays = 0,
    super.features = const <String>[],
    super.isActive = true,
    super.sortOrder = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SubscriptionPlan missing id');
    return SubscriptionPlanModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      price: asDouble(json['price']),
      interval: json['interval'] as String? ?? 'monthly',
      trialDays: asInt(json['trialDays']),
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: asInt(json['sortOrder']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        'interval': interval,
        'trialDays': trialDays,
        'features': features,
        'isActive': isActive,
        'sortOrder': sortOrder,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SubscriptionBillingCycleModel extends SubscriptionBillingCycle {
  const SubscriptionBillingCycleModel({
    required super.id,
    required super.subscriptionId,
    required super.periodStart,
    required super.periodEnd,
    required super.status,
    super.amount = 0,
    super.currency = 'USD',
    super.invoiceId,
    super.paidAt,
    super.createdAt,
  });

  factory SubscriptionBillingCycleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SubscriptionBillingCycle missing id');
    return SubscriptionBillingCycleModel(
      id: id,
      subscriptionId: json['subscriptionId'] as String? ?? '',
      periodStart: DateTime.tryParse('${json['periodStart']}') ?? DateTime.now(),
      periodEnd: DateTime.tryParse('${json['periodEnd']}') ?? DateTime.now(),
      status: json['status'] as String? ?? 'PENDING',
      amount: asDouble(json['amount']),
      currency: json['currency'] as String? ?? 'USD',
      invoiceId: json['invoiceId'] as String?,
      paidAt: DateTime.tryParse('${json['paidAt']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subscriptionId': subscriptionId,
        'periodStart': periodStart.toIso8601String(),
        'periodEnd': periodEnd.toIso8601String(),
        'status': status,
        'amount': amount,
        'currency': currency,
        'invoiceId': invoiceId,
        'paidAt': paidAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SubscriptionUsageRecordModel extends SubscriptionUsageRecord {
  const SubscriptionUsageRecordModel({
    required super.id,
    required super.subscriptionId,
    required super.metric,
    required super.quantity,
    super.unit,
    super.recordedAt,
  });

  factory SubscriptionUsageRecordModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SubscriptionUsageRecord missing id');
    return SubscriptionUsageRecordModel(
      id: id,
      subscriptionId: json['subscriptionId'] as String? ?? '',
      metric: json['metric'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      unit: json['unit'] as String?,
      recordedAt: DateTime.tryParse('${json['recordedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subscriptionId': subscriptionId,
        'metric': metric,
        'quantity': quantity,
        'unit': unit,
        'recordedAt': recordedAt?.toIso8601String(),
      };
}

class ChurnSurveyResponseModel extends ChurnSurveyResponse {
  const ChurnSurveyResponseModel({
    required super.id,
    required super.subscriptionId,
    super.reason,
    super.feedback,
    super.rating,
    super.wouldRecommend,
    super.createdAt,
  });

  factory ChurnSurveyResponseModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ChurnSurveyResponse missing id');
    return ChurnSurveyResponseModel(
      id: id,
      subscriptionId: json['subscriptionId'] as String? ?? '',
      reason: json['reason'] as String?,
      feedback: json['feedback'] as String?,
      rating: asInt(json['rating']),
      wouldRecommend: json['wouldRecommend'] as bool?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subscriptionId': subscriptionId,
        'reason': reason,
        'feedback': feedback,
        'rating': rating,
        'wouldRecommend': wouldRecommend,
        'createdAt': createdAt?.toIso8601String(),
      };
}
