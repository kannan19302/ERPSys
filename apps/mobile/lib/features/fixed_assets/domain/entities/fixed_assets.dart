import 'package:equatable/equatable.dart';

class FixedAsset extends Equatable {
  const FixedAsset({
    required this.id,
    required this.name,
    required this.assetCategory,
    this.assetTag,
    this.serialNumber,
    this.location,
    this.department,
    this.status = 'ACTIVE',
    this.purchaseDate,
    this.purchaseCost = 0,
    this.currentValue = 0,
    this.salvageValue = 0,
    this.usefulLifeYears = 0,
    this.depreciationMethod = 'STRAIGHT_LINE',
    this.accumulatedDepreciation = 0,
    this.warrantyExpiry,
    this.insurancePolicy,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String assetCategory;
  final String? assetTag;
  final String? serialNumber;
  final String? location;
  final String? department;
  final String status;
  final DateTime? purchaseDate;
  final double purchaseCost;
  final double currentValue;
  final double salvageValue;
  final int usefulLifeYears;
  final String depreciationMethod;
  final double accumulatedDepreciation;
  final DateTime? warrantyExpiry;
  final String? insurancePolicy;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  double get netBookValue => currentValue - accumulatedDepreciation;

  @override
  List<Object?> get props => <Object?>[
        id, name, assetCategory, assetTag, serialNumber, location,
        department, status, purchaseDate, purchaseCost, currentValue,
        salvageValue, usefulLifeYears, depreciationMethod,
        accumulatedDepreciation, warrantyExpiry, insurancePolicy, notes,
        createdAt, updatedAt,
      ];
}

class AssetDepreciationSchedule extends Equatable {
  const AssetDepreciationSchedule({
    required this.id,
    required this.assetId,
    this.assetName,
    this.fiscalYear = 0,
    this.period = 1,
    this.scheduledAmount = 0,
    this.recordedAmount,
    this.status = 'PENDING',
    this.depreciationDate,
    this.isCatchUp = false,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String assetId;
  final String? assetName;
  final int fiscalYear;
  final int period;
  final double scheduledAmount;
  final double? recordedAmount;
  final String status;
  final DateTime? depreciationDate;
  final bool isCatchUp;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, assetId, assetName, fiscalYear, period, scheduledAmount,
        recordedAmount, status, depreciationDate, isCatchUp, notes,
        createdAt,
      ];
}

class AssetMaintenanceSchedule extends Equatable {
  const AssetMaintenanceSchedule({
    required this.id,
    required this.assetId,
    this.assetName,
    required this.maintenanceType,
    this.description,
    this.priority = 'MEDIUM',
    this.status = 'SCHEDULED',
    this.scheduledDate,
    this.completedDate,
    this.assignedTo,
    this.estimatedCost,
    this.actualCost,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String assetId;
  final String? assetName;
  final String maintenanceType;
  final String? description;
  final String priority;
  final String status;
  final DateTime? scheduledDate;
  final DateTime? completedDate;
  final String? assignedTo;
  final double? estimatedCost;
  final double? actualCost;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, assetId, assetName, maintenanceType, description, priority,
        status, scheduledDate, completedDate, assignedTo, estimatedCost,
        actualCost, notes, createdAt, updatedAt,
      ];
}

class AssetDisposal extends Equatable {
  const AssetDisposal({
    required this.id,
    required this.assetId,
    this.assetName,
    required this.disposalMethod,
    this.disposalDate,
    this.status = 'DRAFT',
    this.proceedsFromSale = 0,
    this.disposalCost = 0,
    this.netBookValueAtDisposal = 0,
    this.gainOrLoss = 0,
    this.approvedBy,
    this.approvalDate,
    this.reason,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String assetId;
  final String? assetName;
  final String disposalMethod;
  final DateTime? disposalDate;
  final String status;
  final double proceedsFromSale;
  final double disposalCost;
  final double netBookValueAtDisposal;
  final double gainOrLoss;
  final String? approvedBy;
  final DateTime? approvalDate;
  final String? reason;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, assetId, assetName, disposalMethod, disposalDate, status,
        proceedsFromSale, disposalCost, netBookValueAtDisposal, gainOrLoss,
        approvedBy, approvalDate, reason, notes, createdAt, updatedAt,
      ];
}
