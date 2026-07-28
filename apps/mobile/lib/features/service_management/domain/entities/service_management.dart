import 'package:equatable/equatable.dart';

class ServiceCatalog extends Equatable {
  const ServiceCatalog({
    required this.id,
    required this.name,
    this.description,
    this.category,
    this.deliveryType,
    this.defaultSlaId,
    this.estimatedDuration,
    this.price = 0,
    this.currency = 'USD',
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? category;
  final String? deliveryType;
  final String? defaultSlaId;
  final String? estimatedDuration;
  final double price;
  final String currency;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, category, deliveryType, defaultSlaId,
        estimatedDuration, price, currency, status, createdAt, updatedAt,
      ];
}

class ServiceRequest extends Equatable {
  const ServiceRequest({
    required this.id,
    required this.subject,
    this.description,
    this.catalogId,
    this.catalogName,
    this.customerId,
    this.customerName,
    this.assignedTo,
    this.priority = 'MEDIUM',
    this.status = 'OPEN',
    this.slaId,
    this.slaDeadline,
    this.resolution,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String subject;
  final String? description;
  final String? catalogId;
  final String? catalogName;
  final String? customerId;
  final String? customerName;
  final String? assignedTo;
  final String priority;
  final String status;
  final String? slaId;
  final DateTime? slaDeadline;
  final String? resolution;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, subject, description, catalogId, catalogName, customerId,
        customerName, assignedTo, priority, status, slaId, slaDeadline,
        resolution, createdAt, updatedAt,
      ];
}

class ServiceContract extends Equatable {
  const ServiceContract({
    required this.id,
    required this.name,
    this.customerId,
    this.customerName,
    this.startDate,
    this.endDate,
    this.slaId,
    this.serviceLevel,
    this.status = 'ACTIVE',
    this.renewalType,
    this.price = 0,
    this.currency = 'USD',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? customerId;
  final String? customerName;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? slaId;
  final String? serviceLevel;
  final String status;
  final String? renewalType;
  final double price;
  final String currency;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, customerId, customerName, startDate, endDate, slaId,
        serviceLevel, status, renewalType, price, currency, createdAt, updatedAt,
      ];
}

class ServiceLevelAgreement extends Equatable {
  const ServiceLevelAgreement({
    required this.id,
    required this.name,
    this.description,
    this.responseTime,
    this.resolutionTime,
    this.availabilityTarget,
    this.priority = 'STANDARD',
    this.penaltyRules,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? responseTime;
  final String? resolutionTime;
  final String? availabilityTarget;
  final String priority;
  final String? penaltyRules;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, responseTime, resolutionTime,
        availabilityTarget, priority, penaltyRules, status, createdAt, updatedAt,
      ];
}