import '../../../../core/error/exceptions.dart';
import '../../domain/entities/pos.dart';

class PosOrderModel extends PosOrder {
  const PosOrderModel({
    required super.id,
    required super.orderNumber,
    super.customerId,
    super.customerName,
    required super.status,
    super.items = const <PosOrderItem>[],
    super.payments = const <PosPayment>[],
    super.subtotal,
    super.discountTotal,
    super.taxTotal,
    super.totalAmount,
    super.terminalId,
    super.registerId,
    super.cashierId,
    super.shiftId,
    super.createdAt,
    super.updatedAt,
  });

  factory PosOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosOrder is missing its id');
    }
    return PosOrderModel(
      id: id,
      orderNumber: json['orderNumber'] as String? ?? '',
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      items: (json['items'] as List<dynamic>?)
              ?.map((Object? e) => PosOrderItemModel.fromJson(e as Map<String, dynamic>))
              .toList(growable: false) ??
          const <PosOrderItem>[],
      payments: (json['payments'] as List<dynamic>?)
              ?.map((Object? e) => PosPaymentModel.fromJson(e as Map<String, dynamic>))
              .toList(growable: false) ??
          const <PosPayment>[],
      subtotal: asDouble(json['subtotal']),
      discountTotal: asDouble(json['discountTotal']),
      taxTotal: asDouble(json['taxTotal']),
      totalAmount: asDouble(json['totalAmount']),
      terminalId: json['terminalId'] as String?,
      registerId: json['registerId'] as String?,
      cashierId: json['cashierId'] as String?,
      shiftId: json['shiftId'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'orderNumber': orderNumber,
        'customerId': customerId,
        'customerName': customerName,
        'status': status,
        'items': items.map((PosOrderItem e) => (e as PosOrderItemModel).toJson()).toList(),
        'payments': payments.map((PosPayment e) => (e as PosPaymentModel).toJson()).toList(),
        'subtotal': subtotal,
        'discountTotal': discountTotal,
        'taxTotal': taxTotal,
        'totalAmount': totalAmount,
        'terminalId': terminalId,
        'registerId': registerId,
        'cashierId': cashierId,
        'shiftId': shiftId,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PosOrderItemModel extends PosOrderItem {
  const PosOrderItemModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.quantity,
    required super.rate,
    required super.amount,
    super.discount,
    super.taxRate,
  });

  factory PosOrderItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosOrderItem is missing its id');
    }
    return PosOrderItemModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      rate: asDouble(json['rate']),
      amount: asDouble(json['amount']),
      discount: asDouble(json['discount']),
      taxRate: asDouble(json['taxRate']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'discount': discount,
        'taxRate': taxRate,
      };
}

class PosPaymentModel extends PosPayment {
  const PosPaymentModel({
    required super.id,
    required super.orderId,
    required super.amount,
    required super.method,
    super.reference,
    super.status,
    super.createdAt,
  });

  factory PosPaymentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosPayment is missing its id');
    }
    return PosPaymentModel(
      id: id,
      orderId: json['orderId'] as String? ?? '',
      amount: asDouble(json['amount']),
      method: json['method'] as String? ?? 'CASH',
      reference: json['reference'] as String?,
      status: json['status'] as String? ?? 'COMPLETED',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'orderId': orderId,
        'amount': amount,
        'method': method,
        'reference': reference,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PosTerminalModel extends PosTerminal {
  const PosTerminalModel({
    required super.id,
    required super.name,
    super.serialNumber,
    super.location,
    super.isActive,
    super.createdAt,
    super.updatedAt,
  });

  factory PosTerminalModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosTerminal is missing its id');
    }
    return PosTerminalModel(
      id: id,
      name: json['name'] as String? ?? '',
      serialNumber: json['serialNumber'] as String?,
      location: json['location'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'serialNumber': serialNumber,
        'location': location,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PosRegisterModel extends PosRegister {
  const PosRegisterModel({
    required super.id,
    required super.name,
    super.openingBalance,
    super.closingBalance,
    super.status,
    super.location,
    super.createdAt,
    super.updatedAt,
  });

  factory PosRegisterModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosRegister is missing its id');
    }
    return PosRegisterModel(
      id: id,
      name: json['name'] as String? ?? '',
      openingBalance: asDouble(json['openingBalance']),
      closingBalance: asDoubleOrNull(json['closingBalance']),
      status: json['status'] as String? ?? 'CLOSED',
      location: json['location'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'openingBalance': openingBalance,
        'closingBalance': closingBalance,
        'status': status,
        'location': location,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PosShiftModel extends PosShift {
  const PosShiftModel({
    required super.id,
    required super.registerId,
    required super.userId,
    required super.openedAt,
    super.closedAt,
    super.openingBalance,
    super.closingBalance,
    super.cashSales,
    super.cardSales,
    super.totalSales,
    super.status,
    super.createdAt,
  });

  factory PosShiftModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosShift is missing its id');
    }
    return PosShiftModel(
      id: id,
      registerId: json['registerId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      openedAt: DateTime.parse(json['openedAt'] as String),
      closedAt: DateTime.tryParse('${json['closedAt']}'),
      openingBalance: asDouble(json['openingBalance']),
      closingBalance: asDoubleOrNull(json['closingBalance']),
      cashSales: asDouble(json['cashSales']),
      cardSales: asDouble(json['cardSales']),
      totalSales: asDouble(json['totalSales']),
      status: json['status'] as String? ?? 'OPEN',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'registerId': registerId,
        'userId': userId,
        'openedAt': openedAt.toIso8601String(),
        'closedAt': closedAt?.toIso8601String(),
        'openingBalance': openingBalance,
        'closingBalance': closingBalance,
        'cashSales': cashSales,
        'cardSales': cardSales,
        'totalSales': totalSales,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PosDiscountModel extends PosDiscount {
  const PosDiscountModel({
    required super.id,
    required super.name,
    required super.type,
    required super.value,
    super.isActive,
    super.applicableOn,
    super.minAmount,
    super.maxDiscount,
    super.createdAt,
  });

  factory PosDiscountModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosDiscount is missing its id');
    }
    return PosDiscountModel(
      id: id,
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'PERCENTAGE',
      value: asDouble(json['value']),
      isActive: json['isActive'] as bool? ?? true,
      applicableOn: json['applicableOn'] as String?,
      minAmount: asDoubleOrNull(json['minAmount']),
      maxDiscount: asDoubleOrNull(json['maxDiscount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'type': type,
        'value': value,
        'isActive': isActive,
        'applicableOn': applicableOn,
        'minAmount': minAmount,
        'maxDiscount': maxDiscount,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PosLoyaltyProgramModel extends PosLoyaltyProgram {
  const PosLoyaltyProgramModel({
    required super.id,
    required super.name,
    super.pointsPerAmount,
    super.redemptionRate,
    super.isActive,
    super.createdAt,
  });

  factory PosLoyaltyProgramModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosLoyaltyProgram is missing its id');
    }
    return PosLoyaltyProgramModel(
      id: id,
      name: json['name'] as String? ?? '',
      pointsPerAmount: asDouble(json['pointsPerAmount']),
      redemptionRate: asDouble(json['redemptionRate']),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'pointsPerAmount': pointsPerAmount,
        'redemptionRate': redemptionRate,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PosLoyaltyMemberModel extends PosLoyaltyMember {
  const PosLoyaltyMemberModel({
    required super.id,
    required super.customerId,
    required super.customerName,
    required super.programId,
    super.points,
    super.totalPoints,
    super.createdAt,
    super.updatedAt,
  });

  factory PosLoyaltyMemberModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosLoyaltyMember is missing its id');
    }
    return PosLoyaltyMemberModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      programId: json['programId'] as String? ?? '',
      points: asDouble(json['points']),
      totalPoints: asDouble(json['totalPoints']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'customerName': customerName,
        'programId': programId,
        'points': points,
        'totalPoints': totalPoints,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PosGiftCardModel extends PosGiftCard {
  const PosGiftCardModel({
    required super.id,
    required super.code,
    super.initialBalance,
    super.currentBalance,
    super.customerId,
    super.customerName,
    super.expiryDate,
    super.isActive,
    super.createdAt,
  });

  factory PosGiftCardModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('PosGiftCard is missing its id');
    }
    return PosGiftCardModel(
      id: id,
      code: json['code'] as String? ?? '',
      initialBalance: asDouble(json['initialBalance']),
      currentBalance: asDouble(json['currentBalance']),
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      expiryDate: DateTime.tryParse('${json['expiryDate']}'),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'code': code,
        'initialBalance': initialBalance,
        'currentBalance': currentBalance,
        'customerId': customerId,
        'customerName': customerName,
        'expiryDate': expiryDate?.toIso8601String(),
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

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

double? asDoubleOrNull(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v),
      _ => null,
    };
