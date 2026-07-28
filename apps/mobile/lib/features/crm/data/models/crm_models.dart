import '../../../../core/error/exceptions.dart';
import '../../domain/entities/crm.dart';

class CustomerModel extends Customer {
  const CustomerModel({
    required super.id,
    required super.name,
    super.email,
    super.phone,
    super.taxId,
    super.billingAddress,
    super.shippingAddress,
    super.status,
    super.customerType,
    super.industry,
    super.website,
    super.notes,
    super.currency,
    super.creditLimit,
    super.totalRevenue,
    super.totalOrders,
    super.portalAccess,
    super.tags,
    super.createdAt,
    super.updatedAt,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Customer is missing its id');
    }
    return CustomerModel(
      id: id,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      taxId: json['taxId'] as String?,
      billingAddress: json['billingAddress'] as String?,
      shippingAddress: json['shippingAddress'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      customerType: json['customerType'] as String? ?? 'COMPANY',
      industry: json['industry'] as String?,
      website: json['website'] as String?,
      notes: json['notes'] as String?,
      currency: json['currency'] as String?,
      creditLimit: asDouble(json['creditLimit']),
      totalRevenue: asDouble(json['totalRevenue']),
      totalOrders: asInt(json['totalOrders']),
      portalAccess: json['portalAccess'] as bool? ?? false,
      tags: json['tags'] is List ? (json['tags'] as List).cast<String>() : const <String>[],
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'taxId': taxId,
        'billingAddress': billingAddress,
        'shippingAddress': shippingAddress,
        'status': status,
        'customerType': customerType,
        'industry': industry,
        'website': website,
        'notes': notes,
        'currency': currency,
        'creditLimit': creditLimit,
        'totalRevenue': totalRevenue,
        'totalOrders': totalOrders,
        'portalAccess': portalAccess,
        'tags': tags,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ContactModel extends Contact {
  const ContactModel({
    required super.id,
    required super.customerId,
    super.firstName,
    super.lastName,
    super.email,
    super.phone,
    super.mobile,
    super.position,
    super.department,
    super.isPrimary,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory ContactModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Contact is missing its id');
    }
    return ContactModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      mobile: json['mobile'] as String?,
      position: json['position'] as String?,
      department: json['department'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'mobile': mobile,
        'position': position,
        'department': department,
        'isPrimary': isPrimary,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LeadModel extends Lead {
  const LeadModel({
    required super.id,
    super.salutation,
    super.firstName,
    super.lastName,
    super.email,
    super.phone,
    super.company,
    super.title,
    super.source,
    super.status,
    super.industry,
    super.estimatedRevenue,
    super.notes,
    super.assignedTo,
    super.createdAt,
    super.updatedAt,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Lead is missing its id');
    }
    return LeadModel(
      id: id,
      salutation: json['salutation'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      company: json['company'] as String?,
      title: json['title'] as String?,
      source: json['source'] as String?,
      status: json['status'] as String? ?? 'NEW',
      industry: json['industry'] as String?,
      estimatedRevenue: asDoubleOrNull(json['estimatedRevenue']),
      notes: json['notes'] as String?,
      assignedTo: json['assignedTo'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'salutation': salutation,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'company': company,
        'title': title,
        'source': source,
        'status': status,
        'industry': industry,
        'estimatedRevenue': estimatedRevenue,
        'notes': notes,
        'assignedTo': assignedTo,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LeadSourceModel extends LeadSource {
  const LeadSourceModel({
    required super.id,
    required super.name,
    super.createdAt,
  });

  factory LeadSourceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('LeadSource is missing its id');
    }
    return LeadSourceModel(
      id: id,
      name: json['name'] as String? ?? '',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ActivityModel extends Activity {
  const ActivityModel({
    required super.id,
    required super.type,
    required super.subject,
    super.description,
    super.customerId,
    super.contactId,
    super.leadId,
    super.status,
    super.dueDate,
    super.createdAt,
  });

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Activity is missing its id');
    }
    return ActivityModel(
      id: id,
      type: json['type'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String?,
      customerId: json['customerId'] as String?,
      contactId: json['contactId'] as String?,
      leadId: json['leadId'] as String?,
      status: json['status'] as String?,
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type,
        'subject': subject,
        'description': description,
        'customerId': customerId,
        'contactId': contactId,
        'leadId': leadId,
        'status': status,
        'dueDate': dueDate?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class EmailTemplateModel extends EmailTemplate {
  const EmailTemplateModel({
    required super.id,
    required super.name,
    required super.subject,
    super.body,
    super.category,
    super.createdAt,
  });

  factory EmailTemplateModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('EmailTemplate is missing its id');
    }
    return EmailTemplateModel(
      id: id,
      name: json['name'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      body: json['body'] as String?,
      category: json['category'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'subject': subject,
        'body': body,
        'category': category,
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
