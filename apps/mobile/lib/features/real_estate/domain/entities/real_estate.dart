import 'package:equatable/equatable.dart';

class Property extends Equatable {
  const Property({
    required this.id,
    required this.name,
    this.propertyType = 'COMMERCIAL',
    this.address,
    this.city,
    this.state,
    this.zipCode,
    this.country = 'US',
    this.totalUnits = 0,
    this.occupiedUnits = 0,
    this.totalArea = 0,
    this.areaUnit = 'sqft',
    this.status = 'ACTIVE',
    this.purchasePrice,
    this.currentValue,
    this.description,
    this.amenities = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String propertyType;
  final String? address;
  final String? city;
  final String? state;
  final String? zipCode;
  final String country;
  final int totalUnits;
  final int occupiedUnits;
  final double totalArea;
  final String areaUnit;
  final String status;
  final double? purchasePrice;
  final double? currentValue;
  final String? description;
  final List<String> amenities;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  double get occupancyRate =>
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  @override
  List<Object?> get props => <Object?>[
        id, name, propertyType, address, city, state, zipCode, country,
        totalUnits, occupiedUnits, totalArea, areaUnit, status,
        purchasePrice, currentValue, description, amenities,
        createdAt, updatedAt,
      ];
}

class Lease extends Equatable {
  const Lease({
    required this.id,
    required this.leaseNumber,
    required this.propertyId,
    required this.propertyName,
    this.tenantId,
    this.tenantName,
    this.unitLabel,
    this.startDate,
    this.endDate,
    this.status = 'ACTIVE',
    this.monthlyRent = 0,
    this.securityDeposit = 0,
    this.currency = 'USD',
    this.paymentDay = 1,
    this.renewalTerms,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String leaseNumber;
  final String propertyId;
  final String propertyName;
  final String? tenantId;
  final String? tenantName;
  final String? unitLabel;
  final DateTime? startDate;
  final DateTime? endDate;
  final String status;
  final double monthlyRent;
  final double securityDeposit;
  final String currency;
  final int paymentDay;
  final String? renewalTerms;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, leaseNumber, propertyId, propertyName, tenantId, tenantName,
        unitLabel, startDate, endDate, status, monthlyRent, securityDeposit,
        currency, paymentDay, renewalTerms, notes, createdAt, updatedAt,
      ];
}

class TenantDetail extends Equatable {
  const TenantDetail({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.company,
    this.status = 'ACTIVE',
    this.leaseCount = 0,
    this.totalRent = 0,
    this.outstandingBalance = 0,
    this.emergencyContact,
    this.emergencyPhone,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? company;
  final String status;
  final int leaseCount;
  final double totalRent;
  final double outstandingBalance;
  final String? emergencyContact;
  final String? emergencyPhone;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, email, phone, company, status, leaseCount, totalRent,
        outstandingBalance, emergencyContact, emergencyPhone, notes,
        createdAt, updatedAt,
      ];
}

class MaintenanceOrder extends Equatable {
  const MaintenanceOrder({
    required this.id,
    required this.title,
    required this.propertyId,
    this.propertyName,
    this.unitLabel,
    this.priority = 'MEDIUM',
    this.category,
    this.status = 'OPEN',
    this.assignedTo,
    this.description,
    this.estimatedCost,
    this.actualCost,
    this.scheduledDate,
    this.completedDate,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String propertyId;
  final String? propertyName;
  final String? unitLabel;
  final String priority;
  final String? category;
  final String status;
  final String? assignedTo;
  final String? description;
  final double? estimatedCost;
  final double? actualCost;
  final DateTime? scheduledDate;
  final DateTime? completedDate;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, propertyId, propertyName, unitLabel, priority, category,
        status, assignedTo, description, estimatedCost, actualCost,
        scheduledDate, completedDate, createdAt, updatedAt,
      ];
}

class PropertyValuation extends Equatable {
  const PropertyValuation({
    required this.id,
    required this.propertyId,
    required this.valuationDate,
    this.estimatedValue = 0,
    this.assessedValue,
    this.appraisedBy,
    this.valuationMethod,
    this.capRate,
    this.noi,
    this.marketComparables = const <String>[],
    this.notes,
    this.createdAt,
  });

  final String id;
  final String propertyId;
  final DateTime valuationDate;
  final double estimatedValue;
  final double? assessedValue;
  final String? appraisedBy;
  final String? valuationMethod;
  final double? capRate;
  final double? noi;
  final List<String> marketComparables;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, propertyId, valuationDate, estimatedValue, assessedValue,
        appraisedBy, valuationMethod, capRate, noi, marketComparables,
        notes, createdAt,
      ];
}
