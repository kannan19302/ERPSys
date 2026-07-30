import '../../../../core/error/exceptions.dart';
import '../../domain/entities/ecommerce.dart';

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

List<T> _parseItems<T>(List<dynamic>? list, T Function(Map<String, dynamic>) fromJson) =>
    list?.map((e) => fromJson(e as Map<String, dynamic>)).toList(growable: false) ?? const [];

class EcommerceProductModel extends EcommerceProduct {
  const EcommerceProductModel({
    required super.id,
    required super.name,
    super.slug,
    super.description,
    super.price = 0,
    super.comparePrice,
    super.currency = 'USD',
    super.categoryId,
    super.categoryName,
    super.images = const <String>[],
    super.inventory = 0,
    super.sku,
    super.status = 'ACTIVE',
    super.rating,
    super.reviewCount = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory EcommerceProductModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('EcommerceProduct missing id');
    return EcommerceProductModel(
      id: id,
      name: (json['name'] ?? json['productName']) as String? ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      price: asDouble(json['price'] ?? json['effectivePrice'] ?? json['basePrice']),
      comparePrice: asDouble(json['comparePrice']),
      currency: json['currency'] as String? ?? 'USD',
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      inventory: asInt(json['inventory']),
      sku: (json['sku'] ?? json['productSku']) as String?,
      status: json['status'] as String? ??
          (json['isPublished'] == true ? 'ACTIVE' : 'INACTIVE'),
      rating: asDouble(json['rating']),
      reviewCount: asInt(json['reviewCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'slug': slug,
        'description': description,
        'price': price,
        'comparePrice': comparePrice,
        'currency': currency,
        'categoryId': categoryId,
        'categoryName': categoryName,
        'images': images,
        'inventory': inventory,
        'sku': sku,
        'status': status,
        'rating': rating,
        'reviewCount': reviewCount,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class EcommerceCategoryModel extends EcommerceCategory {
  const EcommerceCategoryModel({
    required super.id,
    required super.name,
    super.slug,
    super.description,
    super.parentId,
    super.image,
    super.sortOrder = 0,
    super.productCount = 0,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory EcommerceCategoryModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('EcommerceCategory missing id');
    return EcommerceCategoryModel(
      id: id,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      parentId: json['parentId'] as String?,
      image: json['image'] as String?,
      sortOrder: asInt(json['sortOrder']),
      productCount: asInt(json['productCount']),
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'slug': slug,
        'description': description,
        'parentId': parentId,
        'image': image,
        'sortOrder': sortOrder,
        'productCount': productCount,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class EcommerceOrderModel extends EcommerceOrder {
  const EcommerceOrderModel({
    required super.id,
    required super.orderNumber,
    super.customerId,
    super.customerName,
    super.items = const <EcommerceOrderItem>[],
    super.subtotal = 0,
    super.shippingCost = 0,
    super.taxTotal = 0,
    super.totalAmount = 0,
    super.currency = 'USD',
    super.status = 'PENDING',
    super.paymentStatus,
    super.shippingAddress,
    super.createdAt,
    super.updatedAt,
  });

  factory EcommerceOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('EcommerceOrder missing id');
    return EcommerceOrderModel(
      id: id,
      orderNumber: json['orderNumber'] as String? ?? '',
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      items: _parseItems(json['items'] as List<dynamic>?, EcommerceOrderItemModel.fromJson),
      subtotal: asDouble(json['subtotal']),
      shippingCost: asDouble(json['shippingCost']),
      taxTotal: asDouble(json['taxTotal']),
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'PENDING',
      paymentStatus: json['paymentStatus'] as String?,
      shippingAddress: json['shippingAddress'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'orderNumber': orderNumber,
        'customerId': customerId,
        'customerName': customerName,
        'subtotal': subtotal,
        'shippingCost': shippingCost,
        'taxTotal': taxTotal,
        'totalAmount': totalAmount,
        'currency': currency,
        'status': status,
        'paymentStatus': paymentStatus,
        'shippingAddress': shippingAddress,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class EcommerceOrderItemModel extends EcommerceOrderItem {
  const EcommerceOrderItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.quantity = 1,
    super.unitPrice = 0,
    super.totalPrice = 0,
  });

  factory EcommerceOrderItemModel.fromJson(Map<String, dynamic> json) =>
      EcommerceOrderItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        quantity: asDouble(json['quantity']),
        unitPrice: asDouble(json['unitPrice']),
        totalPrice: asDouble(json['totalPrice']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'unitPrice': unitPrice,
        'totalPrice': totalPrice,
      };
}

class EcommerceCartItemModel extends EcommerceCartItem {
  const EcommerceCartItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.image,
    super.quantity = 1,
    super.unitPrice = 0,
    super.totalPrice = 0,
  });

  factory EcommerceCartItemModel.fromJson(Map<String, dynamic> json) =>
      EcommerceCartItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        image: json['image'] as String?,
        quantity: asDouble(json['quantity']),
        unitPrice: asDouble(json['unitPrice']),
        totalPrice: asDouble(json['totalPrice']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'image': image,
        'quantity': quantity,
        'unitPrice': unitPrice,
        'totalPrice': totalPrice,
      };
}