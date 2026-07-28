import 'package:equatable/equatable.dart';

class EcommerceProduct extends Equatable {
  const EcommerceProduct({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.price = 0,
    this.comparePrice,
    this.currency = 'USD',
    this.categoryId,
    this.categoryName,
    this.images = const <String>[],
    this.inventory = 0,
    this.sku,
    this.status = 'ACTIVE',
    this.rating,
    this.reviewCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? slug;
  final String? description;
  final double price;
  final double? comparePrice;
  final String currency;
  final String? categoryId;
  final String? categoryName;
  final List<String> images;
  final int inventory;
  final String? sku;
  final String status;
  final double? rating;
  final int reviewCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, slug, description, price, comparePrice, currency,
        categoryId, categoryName, images, inventory, sku, status,
        rating, reviewCount, createdAt, updatedAt,
      ];
}

class EcommerceCategory extends Equatable {
  const EcommerceCategory({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.parentId,
    this.image,
    this.sortOrder = 0,
    this.productCount = 0,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? slug;
  final String? description;
  final String? parentId;
  final String? image;
  final int sortOrder;
  final int productCount;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, slug, description, parentId, image, sortOrder,
        productCount, status, createdAt, updatedAt,
      ];
}

class EcommerceOrder extends Equatable {
  const EcommerceOrder({
    required this.id,
    required this.orderNumber,
    this.customerId,
    this.customerName,
    this.items = const <EcommerceOrderItem>[],
    this.subtotal = 0,
    this.shippingCost = 0,
    this.taxTotal = 0,
    this.totalAmount = 0,
    this.currency = 'USD',
    this.status = 'PENDING',
    this.paymentStatus,
    this.shippingAddress,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String orderNumber;
  final String? customerId;
  final String? customerName;
  final List<EcommerceOrderItem> items;
  final double subtotal;
  final double shippingCost;
  final double taxTotal;
  final double totalAmount;
  final String currency;
  final String status;
  final String? paymentStatus;
  final String? shippingAddress;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, orderNumber, customerId, customerName, items, subtotal,
        shippingCost, taxTotal, totalAmount, currency, status,
        paymentStatus, shippingAddress, createdAt, updatedAt,
      ];
}

class EcommerceOrderItem extends Equatable {
  const EcommerceOrderItem({
    required this.id,
    this.productId,
    this.productName,
    this.quantity = 1,
    this.unitPrice = 0,
    this.totalPrice = 0,
  });

  final String id;
  final String? productId;
  final String? productName;
  final double quantity;
  final double unitPrice;
  final double totalPrice;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, quantity, unitPrice, totalPrice,
      ];
}

class EcommerceCartItem extends Equatable {
  const EcommerceCartItem({
    required this.id,
    this.productId,
    this.productName,
    this.image,
    this.quantity = 1,
    this.unitPrice = 0,
    this.totalPrice = 0,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? image;
  final double quantity;
  final double unitPrice;
  final double totalPrice;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, image, quantity, unitPrice, totalPrice,
      ];
}