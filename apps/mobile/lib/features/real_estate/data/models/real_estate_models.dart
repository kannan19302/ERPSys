import '../../../../core/error/exceptions.dart';
import '../../domain/entities/real_estate.dart';

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

class PropertyModel extends Property {
  const PropertyModel({
    required super.id,
    required super.name,
    super.propertyType = 'COMMERCIAL',
    super.address,
    super.city,
    super.state,
    super.zipCode,
    super.country = 'US',
    super.totalUnits = 0,
    super.occupiedUnits = 0,
    super.totalArea = 0,
    super.areaUnit = 'sqft',
    super.status = 'ACTIVE',
    super.purchasePrice,
    super.currentValue,
    super.description,
    super.amenities = const <String>[],
    super.createdAt,
    super.updatedAt,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Property missing id');
    return PropertyModel(
      id: id,
      name: json['name'] as String? ?? '',
      propertyType: json['propertyType'] as String? ?? 'COMMERCIAL',
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      zipCode: json['zipCode'] as String?,
      country: json['country'] as String? ?? 'US',
      totalUnits: asInt(json['totalUnits']),
      occupiedUnits: asInt(json['occupiedUnits']),
      totalArea: asDouble(json['totalArea']),
      areaUnit: json['areaUnit'] as String? ?? 'sqft',
      status: json['status'] as String? ?? 'ACTIVE',
      purchasePrice: asDouble(json['purchasePrice']),
      currentValue: asDouble(json['currentValue']),
      description: json['description'] as String?,
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => '$e')
              .toList(growable: false) ??
          const [],
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'propertyType': propertyType,
        'address': address,
        'city': city,
        'state': state,
        'zipCode': zipCode,
        'country': country,
        'totalUnits': totalUnits,
        'occupiedUnits': occupiedUnits,
        'totalArea': totalArea,
        'areaUnit': areaUnit,
        'status': status,
        'purchasePrice': purchasePrice,
        'currentValue': currentValue,
        'description': description,
        'amenities': amenities,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LeaseModel extends Lease {
  const LeaseModel({
    required super.id,
    required super.leaseNumber,
    required super.propertyId,
    required super.propertyName,
    super.tenantId,
    super.tenantName,
    super.unitLabel,
    super.startDate,
    super.endDate,
    super.status = 'ACTIVE',
    super.monthlyRent = 0,
    super.securityDeposit = 0,
    super.currency = 'USD',
    super.paymentDay = 1,
    super.renewalTerms,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory LeaseModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Lease missing id');
    return LeaseModel(
      id: id,
      leaseNumber: json['leaseNumber'] as String? ?? '',
      propertyId: json['propertyId'] as String? ?? '',
      propertyName: json['propertyName'] as String? ?? '',
      tenantId: json['tenantId'] as String?,
      tenantName: json['tenantName'] as String?,
      unitLabel: json['unitLabel'] as String?,
      startDate: DateTime.tryParse('${json['startDate']}'),
      endDate: DateTime.tryParse('${json['endDate']}'),
      status: json['status'] as String? ?? 'ACTIVE',
      monthlyRent: asDouble(json['monthlyRent']),
      securityDeposit: asDouble(json['securityDeposit']),
      currency: json['currency'] as String? ?? 'USD',
      paymentDay: asInt(json['paymentDay']),
      renewalTerms: json['renewalTerms'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'leaseNumber': leaseNumber,
        'propertyId': propertyId,
        'propertyName': propertyName,
        'tenantId': tenantId,
        'tenantName': tenantName,
        'unitLabel': unitLabel,
        'startDate': startDate?.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'status': status,
        'monthlyRent': monthlyRent,
        'securityDeposit': securityDeposit,
        'currency': currency,
        'paymentDay': paymentDay,
        'renewalTerms': renewalTerms,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class TenantDetailModel extends TenantDetail {
  const TenantDetailModel({
    required super.id,
    required super.name,
    super.email,
    super.phone,
    super.company,
    super.status = 'ACTIVE',
    super.leaseCount = 0,
    super.totalRent = 0,
    super.outstandingBalance = 0,
    super.emergencyContact,
    super.emergencyPhone,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory TenantDetailModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('TenantDetail missing id');
    return TenantDetailModel(
      id: id,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      company: json['company'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      leaseCount: asInt(json['leaseCount']),
      totalRent: asDouble(json['totalRent']),
      outstandingBalance: asDouble(json['outstandingBalance']),
      emergencyContact: json['emergencyContact'] as String?,
      emergencyPhone: json['emergencyPhone'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'company': company,
        'status': status,
        'leaseCount': leaseCount,
        'totalRent': totalRent,
        'outstandingBalance': outstandingBalance,
        'emergencyContact': emergencyContact,
        'emergencyPhone': emergencyPhone,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class MaintenanceOrderModel extends MaintenanceOrder {
  const MaintenanceOrderModel({
    required super.id,
    required super.title,
    required super.propertyId,
    super.propertyName,
    super.unitLabel,
    super.priority = 'MEDIUM',
    super.category,
    super.status = 'OPEN',
    super.assignedTo,
    super.description,
    super.estimatedCost,
    super.actualCost,
    super.scheduledDate,
    super.completedDate,
    super.createdAt,
    super.updatedAt,
  });

  factory MaintenanceOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MaintenanceOrder missing id');
    return MaintenanceOrderModel(
      id: id,
      title: json['title'] as String? ?? '',
      propertyId: json['propertyId'] as String? ?? '',
      propertyName: json['propertyName'] as String?,
      unitLabel: json['unitLabel'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      category: json['category'] as String?,
      status: json['status'] as String? ?? 'OPEN',
      assignedTo: json['assignedTo'] as String?,
      description: json['description'] as String?,
      estimatedCost: asDouble(json['estimatedCost']),
      actualCost: asDouble(json['actualCost']),
      scheduledDate: DateTime.tryParse('${json['scheduledDate']}'),
      completedDate: DateTime.tryParse('${json['completedDate']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'propertyId': propertyId,
        'propertyName': propertyName,
        'unitLabel': unitLabel,
        'priority': priority,
        'category': category,
        'status': status,
        'assignedTo': assignedTo,
        'description': description,
        'estimatedCost': estimatedCost,
        'actualCost': actualCost,
        'scheduledDate': scheduledDate?.toIso8601String(),
        'completedDate': completedDate?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PropertyValuationModel extends PropertyValuation {
  const PropertyValuationModel({
    required super.id,
    required super.propertyId,
    required super.valuationDate,
    super.estimatedValue = 0,
    super.assessedValue,
    super.appraisedBy,
    super.valuationMethod,
    super.capRate,
    super.noi,
    super.marketComparables = const <String>[],
    super.notes,
    super.createdAt,
  });

  factory PropertyValuationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PropertyValuation missing id');
    return PropertyValuationModel(
      id: id,
      propertyId: json['propertyId'] as String? ?? '',
      valuationDate: DateTime.tryParse('${json['valuationDate']}') ?? DateTime.now(),
      estimatedValue: asDouble(json['estimatedValue']),
      assessedValue: asDouble(json['assessedValue']),
      appraisedBy: json['appraisedBy'] as String?,
      valuationMethod: json['valuationMethod'] as String?,
      capRate: asDouble(json['capRate']),
      noi: asDouble(json['noi']),
      marketComparables: (json['marketComparables'] as List<dynamic>?)
              ?.map((e) => '$e')
              .toList(growable: false) ??
          const [],
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'propertyId': propertyId,
        'valuationDate': valuationDate.toIso8601String(),
        'estimatedValue': estimatedValue,
        'assessedValue': assessedValue,
        'appraisedBy': appraisedBy,
        'valuationMethod': valuationMethod,
        'capRate': capRate,
        'noi': noi,
        'marketComparables': marketComparables,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}
