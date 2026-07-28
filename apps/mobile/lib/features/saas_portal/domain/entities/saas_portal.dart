import 'package:equatable/equatable.dart';

class PortalBillingInfo extends Equatable {
  const PortalBillingInfo({
    required this.id,
    required this.tenantId,
    this.companyName,
    this.taxId,
    this.address,
    this.city,
    this.country,
    this.zipCode,
    this.email,
    this.phone,
    this.paymentMethod,
    this.last4,
    this.cardBrand,
    this.expMonth,
    this.expYear,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String tenantId;
  final String? companyName;
  final String? taxId;
  final String? address;
  final String? city;
  final String? country;
  final String? zipCode;
  final String? email;
  final String? phone;
  final String? paymentMethod;
  final String? last4;
  final String? cardBrand;
  final int? expMonth;
  final int? expYear;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, tenantId, companyName, taxId, address, city, country,
        zipCode, email, phone, paymentMethod, last4, cardBrand,
        expMonth, expYear, createdAt, updatedAt,
      ];
}

class PortalPlan extends Equatable {
  const PortalPlan({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.billingInterval,
    this.features = const <String>[],
    this.isPopular = false,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? description;
  final double price;
  final String billingInterval;
  final List<String> features;
  final bool isPopular;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, price, billingInterval,
        features, isPopular, createdAt,
      ];
}

class PortalSupportTicket extends Equatable {
  const PortalSupportTicket({
    required this.id,
    required this.subject,
    required this.status,
    required this.priority,
    this.description,
    this.category,
    this.assignedTo,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String subject;
  final String status;
  final String priority;
  final String? description;
  final String? category;
  final String? assignedTo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, subject, status, priority, description, category,
        assignedTo, createdAt, updatedAt,
      ];
}
