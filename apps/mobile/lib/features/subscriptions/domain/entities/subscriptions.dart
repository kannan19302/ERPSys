import 'package:equatable/equatable.dart';

class SubscriptionPlan extends Equatable {
  const SubscriptionPlan({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.interval,
    this.trialDays = 0,
    this.features = const <String>[],
    this.isActive = true,
    this.sortOrder = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final double price;
  final String interval;
  final int trialDays;
  final List<String> features;
  final bool isActive;
  final int sortOrder;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, price, interval, trialDays,
        features, isActive, sortOrder, createdAt, updatedAt,
      ];
}

class SubscriptionBillingCycle extends Equatable {
  const SubscriptionBillingCycle({
    required this.id,
    required this.subscriptionId,
    required this.periodStart,
    required this.periodEnd,
    required this.status,
    this.amount = 0,
    this.currency = 'USD',
    this.invoiceId,
    this.paidAt,
    this.createdAt,
  });

  final String id;
  final String subscriptionId;
  final DateTime periodStart;
  final DateTime periodEnd;
  final String status;
  final double amount;
  final String currency;
  final String? invoiceId;
  final DateTime? paidAt;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, subscriptionId, periodStart, periodEnd, status,
        amount, currency, invoiceId, paidAt, createdAt,
      ];
}

class SubscriptionUsageRecord extends Equatable {
  const SubscriptionUsageRecord({
    required this.id,
    required this.subscriptionId,
    required this.metric,
    required this.quantity,
    this.unit,
    this.recordedAt,
  });

  final String id;
  final String subscriptionId;
  final String metric;
  final double quantity;
  final String? unit;
  final DateTime? recordedAt;

  @override
  List<Object?> get props => <Object?>[
        id, subscriptionId, metric, quantity, unit, recordedAt,
      ];
}

class ChurnSurveyResponse extends Equatable {
  const ChurnSurveyResponse({
    required this.id,
    required this.subscriptionId,
    this.reason,
    this.feedback,
    this.rating,
    this.wouldRecommend,
    this.createdAt,
  });

  final String id;
  final String subscriptionId;
  final String? reason;
  final String? feedback;
  final int? rating;
  final bool? wouldRecommend;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, subscriptionId, reason, feedback, rating,
        wouldRecommend, createdAt,
      ];
}
