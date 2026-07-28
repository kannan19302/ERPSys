import '../../../../core/error/exceptions.dart';
import '../../domain/entities/fixed_assets.dart';

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

class FixedAssetModel extends FixedAsset {
  const FixedAssetModel({
    required super.id,
    required super.name,
    required super.assetCategory,
    super.assetTag,
    super.serialNumber,
    super.location,
    super.department,
    super.status = 'ACTIVE',
    super.purchaseDate,
    super.purchaseCost = 0,
    super.currentValue = 0,
    super.salvageValue = 0,
    super.usefulLifeYears = 0,
    super.depreciationMethod = 'STRAIGHT_LINE',
    super.accumulatedDepreciation = 0,
    super.warrantyExpiry,
    super.insurancePolicy,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory FixedAssetModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('FixedAsset missing id');
    return FixedAssetModel(
      id: id,
      name: json['name'] as String? ?? '',
      assetCategory: json['assetCategory'] as String? ?? '',
      assetTag: json['assetTag'] as String?,
      serialNumber: json['serialNumber'] as String?,
      location: json['location'] as String?,
      department: json['department'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      purchaseDate: DateTime.tryParse('${json['purchaseDate']}'),
      purchaseCost: asDouble(json['purchaseCost']),
      currentValue: asDouble(json['currentValue']),
      salvageValue: asDouble(json['salvageValue']),
      usefulLifeYears: asInt(json['usefulLifeYears']),
      depreciationMethod: json['depreciationMethod'] as String? ?? 'STRAIGHT_LINE',
      accumulatedDepreciation: asDouble(json['accumulatedDepreciation']),
      warrantyExpiry: DateTime.tryParse('${json['warrantyExpiry']}'),
      insurancePolicy: json['insurancePolicy'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'assetCategory': assetCategory,
        'assetTag': assetTag,
        'serialNumber': serialNumber,
        'location': location,
        'department': department,
        'status': status,
        'purchaseDate': purchaseDate?.toIso8601String(),
        'purchaseCost': purchaseCost,
        'currentValue': currentValue,
        'salvageValue': salvageValue,
        'usefulLifeYears': usefulLifeYears,
        'depreciationMethod': depreciationMethod,
        'accumulatedDepreciation': accumulatedDepreciation,
        'warrantyExpiry': warrantyExpiry?.toIso8601String(),
        'insurancePolicy': insurancePolicy,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AssetDepreciationScheduleModel extends AssetDepreciationSchedule {
  const AssetDepreciationScheduleModel({
    required super.id,
    required super.assetId,
    super.assetName,
    super.fiscalYear = 0,
    super.period = 1,
    super.scheduledAmount = 0,
    super.recordedAmount,
    super.status = 'PENDING',
    super.depreciationDate,
    super.isCatchUp = false,
    super.notes,
    super.createdAt,
  });

  factory AssetDepreciationScheduleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AssetDepreciationSchedule missing id');
    return AssetDepreciationScheduleModel(
      id: id,
      assetId: json['assetId'] as String? ?? '',
      assetName: json['assetName'] as String?,
      fiscalYear: asInt(json['fiscalYear']),
      period: asInt(json['period']),
      scheduledAmount: asDouble(json['scheduledAmount']),
      recordedAmount: asDouble(json['recordedAmount']),
      status: json['status'] as String? ?? 'PENDING',
      depreciationDate: DateTime.tryParse('${json['depreciationDate']}'),
      isCatchUp: json['isCatchUp'] == true,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'assetId': assetId,
        'assetName': assetName,
        'fiscalYear': fiscalYear,
        'period': period,
        'scheduledAmount': scheduledAmount,
        'recordedAmount': recordedAmount,
        'status': status,
        'depreciationDate': depreciationDate?.toIso8601String(),
        'isCatchUp': isCatchUp,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AssetMaintenanceScheduleModel extends AssetMaintenanceSchedule {
  const AssetMaintenanceScheduleModel({
    required super.id,
    required super.assetId,
    super.assetName,
    required super.maintenanceType,
    super.description,
    super.priority = 'MEDIUM',
    super.status = 'SCHEDULED',
    super.scheduledDate,
    super.completedDate,
    super.assignedTo,
    super.estimatedCost,
    super.actualCost,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory AssetMaintenanceScheduleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AssetMaintenanceSchedule missing id');
    return AssetMaintenanceScheduleModel(
      id: id,
      assetId: json['assetId'] as String? ?? '',
      assetName: json['assetName'] as String?,
      maintenanceType: json['maintenanceType'] as String? ?? '',
      description: json['description'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'SCHEDULED',
      scheduledDate: DateTime.tryParse('${json['scheduledDate']}'),
      completedDate: DateTime.tryParse('${json['completedDate']}'),
      assignedTo: json['assignedTo'] as String?,
      estimatedCost: asDouble(json['estimatedCost']),
      actualCost: asDouble(json['actualCost']),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'assetId': assetId,
        'assetName': assetName,
        'maintenanceType': maintenanceType,
        'description': description,
        'priority': priority,
        'status': status,
        'scheduledDate': scheduledDate?.toIso8601String(),
        'completedDate': completedDate?.toIso8601String(),
        'assignedTo': assignedTo,
        'estimatedCost': estimatedCost,
        'actualCost': actualCost,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AssetDisposalModel extends AssetDisposal {
  const AssetDisposalModel({
    required super.id,
    required super.assetId,
    super.assetName,
    required super.disposalMethod,
    super.disposalDate,
    super.status = 'DRAFT',
    super.proceedsFromSale = 0,
    super.disposalCost = 0,
    super.netBookValueAtDisposal = 0,
    super.gainOrLoss = 0,
    super.approvedBy,
    super.approvalDate,
    super.reason,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory AssetDisposalModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AssetDisposal missing id');
    return AssetDisposalModel(
      id: id,
      assetId: json['assetId'] as String? ?? '',
      assetName: json['assetName'] as String?,
      disposalMethod: json['disposalMethod'] as String? ?? '',
      disposalDate: DateTime.tryParse('${json['disposalDate']}'),
      status: json['status'] as String? ?? 'DRAFT',
      proceedsFromSale: asDouble(json['proceedsFromSale']),
      disposalCost: asDouble(json['disposalCost']),
      netBookValueAtDisposal: asDouble(json['netBookValueAtDisposal']),
      gainOrLoss: asDouble(json['gainOrLoss']),
      approvedBy: json['approvedBy'] as String?,
      approvalDate: DateTime.tryParse('${json['approvalDate']}'),
      reason: json['reason'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'assetId': assetId,
        'assetName': assetName,
        'disposalMethod': disposalMethod,
        'disposalDate': disposalDate?.toIso8601String(),
        'status': status,
        'proceedsFromSale': proceedsFromSale,
        'disposalCost': disposalCost,
        'netBookValueAtDisposal': netBookValueAtDisposal,
        'gainOrLoss': gainOrLoss,
        'approvedBy': approvedBy,
        'approvalDate': approvalDate?.toIso8601String(),
        'reason': reason,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
