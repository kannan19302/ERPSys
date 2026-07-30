import 'package:equatable/equatable.dart';

class PosOrder extends Equatable {
  const PosOrder({
    required this.id,
    required this.orderNumber,
    this.customerId,
    this.customerName,
    required this.status,
    this.items = const <PosOrderItem>[],
    this.payments = const <PosPayment>[],
    this.subtotal = 0,
    this.discountTotal = 0,
    this.taxTotal = 0,
    this.totalAmount = 0,
    this.terminalId,
    this.registerId,
    this.cashierId,
    this.shiftId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orderNumber;
  final String? customerId;
  final String? customerName;
  final String status;
  final List<PosOrderItem> items;
  final List<PosPayment> payments;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double totalAmount;
  final String? terminalId;
  final String? registerId;
  final String? cashierId;
  final String? shiftId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, orderNumber, customerId, customerName, status, items, payments,
        subtotal, discountTotal, taxTotal, totalAmount, terminalId,
        registerId, cashierId, shiftId, createdAt, updatedAt,
      ];
}

class PosOrderItem extends Equatable {
  const PosOrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.rate,
    required this.amount,
    this.discount = 0,
    this.taxRate = 0,
  });

  final String id;
  final String productId;
  final String productName;
  final double quantity;
  final double rate;
  final double amount;
  final double discount;
  final double taxRate;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, quantity, rate, amount, discount, taxRate,
      ];
}

class PosPayment extends Equatable {
  const PosPayment({
    required this.id,
    required this.orderId,
    required this.amount,
    required this.method,
    this.reference,
    this.status = 'COMPLETED',
    this.createdAt,
  });

  final String id;
  final String orderId;
  final double amount;
  final String method;
  final String? reference;
  final String status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, orderId, amount, method, reference, status, createdAt,
      ];
}

class PosTerminal extends Equatable {
  const PosTerminal({
    required this.id,
    required this.name,
    this.serialNumber,
    this.location,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? serialNumber;
  final String? location;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, serialNumber, location, isActive, createdAt, updatedAt,
      ];
}

class PosRegister extends Equatable {
  const PosRegister({
    required this.id,
    required this.name,
    this.openingBalance = 0,
    this.closingBalance,
    this.status = 'CLOSED',
    this.location,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final double openingBalance;
  final double? closingBalance;
  final String status;
  final String? location;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, openingBalance, closingBalance, status, location, createdAt, updatedAt,
      ];
}

class PosShift extends Equatable {
  const PosShift({
    required this.id,
    required this.registerId,
    required this.userId,
    required this.openedAt,
    this.closedAt,
    this.openingBalance = 0,
    this.closingBalance,
    this.cashSales = 0,
    this.cardSales = 0,
    this.totalSales = 0,
    this.status = 'OPEN',
    this.createdAt,
  });

  final String id;
  final String registerId;
  final String userId;
  final DateTime openedAt;
  final DateTime? closedAt;
  final double openingBalance;
  final double? closingBalance;
  final double cashSales;
  final double cardSales;
  final double totalSales;
  final String status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, registerId, userId, openedAt, closedAt, openingBalance,
        closingBalance, cashSales, cardSales, totalSales, status, createdAt,
      ];
}

class PosDiscount extends Equatable {
  const PosDiscount({
    required this.id,
    required this.name,
    required this.type,
    required this.value,
    this.isActive = true,
    this.applicableOn,
    this.minAmount,
    this.maxDiscount,
    this.createdAt,
  });

  final String id;
  final String name;
  final String type;
  final double value;
  final bool isActive;
  final String? applicableOn;
  final double? minAmount;
  final double? maxDiscount;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, type, value, isActive, applicableOn, minAmount, maxDiscount, createdAt,
      ];
}

class PosLoyaltyProgram extends Equatable {
  const PosLoyaltyProgram({
    required this.id,
    required this.name,
    this.type = 'points',
    this.pointsPerAmount = 0,
    this.rewardValue = 0,
    this.validFrom,
    this.validTo,
    this.isActive = true,
    this.memberCount = 0,
    this.createdAt,
  });

  final String id;
  final String name;
  final String type;
  final double pointsPerAmount;
  final double rewardValue;
  final DateTime? validFrom;
  final DateTime? validTo;
  final bool isActive;
  final int memberCount;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, type, pointsPerAmount, rewardValue, validFrom, validTo,
        isActive, memberCount, createdAt,
      ];
}

class PosLoyaltyMember extends Equatable {
  const PosLoyaltyMember({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.programId,
    this.programName,
    this.points = 0,
    this.tier,
    this.joinedAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String customerId;
  final String customerName;
  final String programId;
  final String? programName;
  final double points;
  final String? tier;
  final DateTime? joinedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, customerId, customerName, programId, programName,
        points, tier, joinedAt, createdAt, updatedAt,
      ];
}

class PosLoyaltyTransaction extends Equatable {
  const PosLoyaltyTransaction({
    required this.id,
    required this.memberId,
    this.points = 0,
    this.type = 'earn',
    this.orderId,
    this.description,
    this.createdAt,
  });

  final String id;
  final String memberId;
  final double points;
  final String type;
  final String? orderId;
  final String? description;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, memberId, points, type, orderId, description, createdAt,
      ];
}

class PosCoupon extends Equatable {
  const PosCoupon({
    required this.id,
    required this.code,
    this.discountType = 'percentage',
    this.discountValue = 0,
    this.minOrder = 0,
    this.maxUses,
    this.currentUses = 0,
    this.validFrom,
    this.validTo,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String code;
  final String discountType;
  final double discountValue;
  final double minOrder;
  final int? maxUses;
  final int currentUses;
  final DateTime? validFrom;
  final DateTime? validTo;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, discountType, discountValue, minOrder, maxUses,
        currentUses, validFrom, validTo, isActive, createdAt,
      ];
}

class PosGiftCard extends Equatable {
  const PosGiftCard({
    required this.id,
    required this.code,
    this.initialBalance = 0,
    this.currentBalance = 0,
    this.customerId,
    this.customerName,
    this.expiryDate,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String code;
  final double initialBalance;
  final double currentBalance;
  final String? customerId;
  final String? customerName;
  final DateTime? expiryDate;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, initialBalance, currentBalance, customerId, customerName,
        expiryDate, isActive, createdAt,
      ];
}

class PosPriceListItem extends Equatable {
  const PosPriceListItem({
    required this.productId,
    this.productName,
    this.price = 0,
  });

  final String productId;
  final String? productName;
  final double price;

  @override
  List<Object?> get props => <Object?>[productId, productName, price];
}

class PosPriceList extends Equatable {
  const PosPriceList({
    required this.id,
    required this.name,
    this.currency = 'USD',
    this.isDefault = false,
    this.isActive = true,
    this.items = const <PosPriceListItem>[],
    this.createdAt,
  });

  final String id;
  final String name;
  final String currency;
  final bool isDefault;
  final bool isActive;
  final List<PosPriceListItem> items;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, currency, isDefault, isActive, items, createdAt,
      ];
}