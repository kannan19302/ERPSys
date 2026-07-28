import 'package:equatable/equatable.dart';

class Customer extends Equatable {
  const Customer({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.taxId,
    this.billingAddress,
    this.shippingAddress,
    this.status = 'ACTIVE',
    this.customerType = 'COMPANY',
    this.industry,
    this.website,
    this.notes,
    this.currency,
    this.creditLimit = 0,
    this.totalRevenue = 0,
    this.totalOrders = 0,
    this.portalAccess = false,
    this.tags = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? taxId;
  final String? billingAddress;
  final String? shippingAddress;
  final String status;
  final String customerType;
  final String? industry;
  final String? website;
  final String? notes;
  final String? currency;
  final double creditLimit;
  final double totalRevenue;
  final int totalOrders;
  final bool portalAccess;
  final List<String> tags;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, email, phone, taxId, billingAddress, shippingAddress,
        status, customerType, industry, website, notes, currency,
        creditLimit, totalRevenue, totalOrders, portalAccess, tags,
        createdAt, updatedAt,
      ];
}

class Contact extends Equatable {
  const Contact({
    required this.id,
    required this.customerId,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
    this.mobile,
    this.position,
    this.department,
    this.isPrimary = false,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String customerId;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;
  final String? mobile;
  final String? position;
  final String? department;
  final bool isPrimary;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, customerId, firstName, lastName, email, phone, mobile,
        position, department, isPrimary, notes, createdAt, updatedAt,
      ];
}

class Lead extends Equatable {
  const Lead({
    required this.id,
    this.salutation,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
    this.company,
    this.title,
    this.source,
    this.status = 'NEW',
    this.industry,
    this.estimatedRevenue,
    this.notes,
    this.assignedTo,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? salutation;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;
  final String? company;
  final String? title;
  final String? source;
  final String status;
  final String? industry;
  final double? estimatedRevenue;
  final String? notes;
  final String? assignedTo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, salutation, firstName, lastName, email, phone, company,
        title, source, status, industry, estimatedRevenue, notes,
        assignedTo, createdAt, updatedAt,
      ];
}

class LeadSource extends Equatable {
  const LeadSource({
    required this.id,
    required this.name,
    this.createdAt,
  });

  final String id;
  final String name;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[id, name, createdAt];
}

class Activity extends Equatable {
  const Activity({
    required this.id,
    required this.type,
    required this.subject,
    this.description,
    this.customerId,
    this.contactId,
    this.leadId,
    this.status,
    this.dueDate,
    this.createdAt,
  });

  final String id;
  final String type;
  final String subject;
  final String? description;
  final String? customerId;
  final String? contactId;
  final String? leadId;
  final String? status;
  final DateTime? dueDate;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, type, subject, description, customerId, contactId,
        leadId, status, dueDate, createdAt,
      ];
}

class EmailTemplate extends Equatable {
  const EmailTemplate({
    required this.id,
    required this.name,
    required this.subject,
    this.body,
    this.category,
    this.createdAt,
  });

  final String id;
  final String name;
  final String subject;
  final String? body;
  final String? category;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[id, name, subject, body, category, createdAt];
}
