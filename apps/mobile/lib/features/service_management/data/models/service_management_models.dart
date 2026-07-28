import '../../../../core/error/exceptions.dart';
import '../../domain/entities/service_management.dart';

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

class ServiceCatalogModel extends ServiceCatalog {
  const ServiceCatalogModel({
    required super.id,
    required super.name,
    super.description,
    super.category,
    super.deliveryType,
    super.defaultSlaId,
    super.estimatedDuration,
    super.price = 0,
    super.currency = 'USD',
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceCatalogModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceCatalog missing id');
    return ServiceCatalogModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String?,
      deliveryType: json['deliveryType'] as String?,
      defaultSlaId: json['defaultSlaId'] as String?,
      estimatedDuration: json['estimatedDuration'] as String?,
      price: asDouble(json['price']),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'category': category,
        'deliveryType': deliveryType,
        'defaultSlaId': defaultSlaId,
        'estimatedDuration': estimatedDuration,
        'price': price,
        'currency': currency,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ServiceRequestModel extends ServiceRequest {
  const ServiceRequestModel({
    required super.id,
    required super.subject,
    super.description,
    super.catalogId,
    super.catalogName,
    super.customerId,
    super.customerName,
    super.assignedTo,
    super.priority = 'MEDIUM',
    super.status = 'OPEN',
    super.slaId,
    super.slaDeadline,
    super.resolution,
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceRequestModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceRequest missing id');
    return ServiceRequestModel(
      id: id,
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String?,
      catalogId: json['catalogId'] as String?,
      catalogName: json['catalogName'] as String?,
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      assignedTo: json['assignedTo'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'OPEN',
      slaId: json['slaId'] as String?,
      slaDeadline: DateTime.tryParse('${json['slaDeadline']}'),
      resolution: json['resolution'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'subject': subject,
        'description': description,
        'catalogId': catalogId,
        'catalogName': catalogName,
        'customerId': customerId,
        'customerName': customerName,
        'assignedTo': assignedTo,
        'priority': priority,
        'status': status,
        'slaId': slaId,
        'slaDeadline': slaDeadline?.toIso8601String(),
        'resolution': resolution,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ServiceContractModel extends ServiceContract {
  const ServiceContractModel({
    required super.id,
    required super.name,
    super.customerId,
    super.customerName,
    super.startDate,
    super.endDate,
    super.slaId,
    super.serviceLevel,
    super.status = 'ACTIVE',
    super.renewalType,
    super.price = 0,
    super.currency = 'USD',
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceContractModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceContract missing id');
    return ServiceContractModel(
      id: id,
      name: json['name'] as String? ?? '',
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      startDate: DateTime.tryParse('${json['startDate']}'),
      endDate: DateTime.tryParse('${json['endDate']}'),
      slaId: json['slaId'] as String?,
      serviceLevel: json['serviceLevel'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      renewalType: json['renewalType'] as String?,
      price: asDouble(json['price']),
      currency: json['currency'] as String? ?? 'USD',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'customerId': customerId,
        'customerName': customerName,
        'startDate': startDate?.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'slaId': slaId,
        'serviceLevel': serviceLevel,
        'status': status,
        'renewalType': renewalType,
        'price': price,
        'currency': currency,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ServiceLevelAgreementModel extends ServiceLevelAgreement {
  const ServiceLevelAgreementModel({
    required super.id,
    required super.name,
    super.description,
    super.responseTime,
    super.resolutionTime,
    super.availabilityTarget,
    super.priority = 'STANDARD',
    super.penaltyRules,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceLevelAgreementModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceLevelAgreement missing id');
    return ServiceLevelAgreementModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      responseTime: json['responseTime'] as String?,
      resolutionTime: json['resolutionTime'] as String?,
      availabilityTarget: json['availabilityTarget'] as String?,
      priority: json['priority'] as String? ?? 'STANDARD',
      penaltyRules: json['penaltyRules'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'responseTime': responseTime,
        'resolutionTime': resolutionTime,
        'availabilityTarget': availabilityTarget,
        'priority': priority,
        'penaltyRules': penaltyRules,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}