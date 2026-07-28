import '../../../../core/error/exceptions.dart';
import '../../domain/entities/saas_portal.dart';

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

class PortalBillingInfoModel extends PortalBillingInfo {
  const PortalBillingInfoModel({
    required super.id,
    required super.tenantId,
    super.companyName,
    super.taxId,
    super.address,
    super.city,
    super.country,
    super.zipCode,
    super.email,
    super.phone,
    super.paymentMethod,
    super.last4,
    super.cardBrand,
    super.expMonth,
    super.expYear,
    super.createdAt,
    super.updatedAt,
  });

  factory PortalBillingInfoModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PortalBillingInfo missing id');
    return PortalBillingInfoModel(
      id: id,
      tenantId: json['tenantId'] as String? ?? '',
      companyName: json['companyName'] as String?,
      taxId: json['taxId'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String?,
      zipCode: json['zipCode'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      last4: json['last4'] as String?,
      cardBrand: json['cardBrand'] as String?,
      expMonth: asInt(json['expMonth']),
      expYear: asInt(json['expYear']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'tenantId': tenantId,
        'companyName': companyName,
        'taxId': taxId,
        'address': address,
        'city': city,
        'country': country,
        'zipCode': zipCode,
        'email': email,
        'phone': phone,
        'paymentMethod': paymentMethod,
        'last4': last4,
        'cardBrand': cardBrand,
        'expMonth': expMonth,
        'expYear': expYear,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PortalPlanModel extends PortalPlan {
  const PortalPlanModel({
    required super.id,
    required super.name,
    super.description,
    required super.price,
    required super.billingInterval,
    super.features = const <String>[],
    super.isPopular = false,
    super.createdAt,
  });

  factory PortalPlanModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PortalPlan missing id');
    return PortalPlanModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      price: asDouble(json['price']),
      billingInterval: json['billingInterval'] as String? ?? 'monthly',
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      isPopular: json['isPopular'] as bool? ?? false,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        'billingInterval': billingInterval,
        'features': features,
        'isPopular': isPopular,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PortalSupportTicketModel extends PortalSupportTicket {
  const PortalSupportTicketModel({
    required super.id,
    required super.subject,
    required super.status,
    required super.priority,
    super.description,
    super.category,
    super.assignedTo,
    super.createdAt,
    super.updatedAt,
  });

  factory PortalSupportTicketModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PortalSupportTicket missing id');
    return PortalSupportTicketModel(
      id: id,
      subject: json['subject'] as String? ?? '',
      status: json['status'] as String? ?? 'OPEN',
      priority: json['priority'] as String? ?? 'MEDIUM',
      description: json['description'] as String?,
      category: json['category'] as String?,
      assignedTo: json['assignedTo'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subject': subject,
        'status': status,
        'priority': priority,
        'description': description,
        'category': category,
        'assignedTo': assignedTo,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
