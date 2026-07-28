import 'package:equatable/equatable.dart';

class ServiceTicket extends Equatable {
  const ServiceTicket({
    required this.id,
    required this.ticketNumber,
    required this.title,
    required this.status,
    this.customerName,
    this.technicianId,
    this.technicianName,
    this.priority = 'MEDIUM',
    this.description,
    this.scheduledDate,
    this.completedAt,
    this.resolution,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String ticketNumber;
  final String title;
  final String status;
  final String? customerName;
  final String? technicianId;
  final String? technicianName;
  final String priority;
  final String? description;
  final DateTime? scheduledDate;
  final DateTime? completedAt;
  final String? resolution;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, ticketNumber, title, status, customerName, technicianId,
        technicianName, priority, description, scheduledDate,
        completedAt, resolution, createdAt, updatedAt,
      ];
}

class Technician extends Equatable {
  const Technician({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.specialization,
    this.status = 'AVAILABLE',
    this.skillLevel,
    this.vehicleInfo,
    this.serviceArea,
    this.rating,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? specialization;
  final String status;
  final String? skillLevel;
  final String? vehicleInfo;
  final String? serviceArea;
  final double? rating;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, email, phone, specialization, status, skillLevel,
        vehicleInfo, serviceArea, rating, createdAt, updatedAt,
      ];
}

class ServiceSchedule extends Equatable {
  const ServiceSchedule({
    required this.id,
    required this.ticketId,
    required this.ticketNumber,
    required this.technicianId,
    required this.technicianName,
    required this.scheduledDate,
    required this.status,
    this.customerName,
    this.timeSlot,
    this.location,
    this.notes,
    this.actualStart,
    this.actualEnd,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String ticketId;
  final String ticketNumber;
  final String technicianId;
  final String technicianName;
  final DateTime scheduledDate;
  final String status;
  final String? customerName;
  final String? timeSlot;
  final String? location;
  final String? notes;
  final DateTime? actualStart;
  final DateTime? actualEnd;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, ticketId, ticketNumber, technicianId, technicianName,
        scheduledDate, status, customerName, timeSlot, location, notes,
        actualStart, actualEnd, createdAt, updatedAt,
      ];
}

class ServiceContract extends Equatable {
  const ServiceContract({
    required this.id,
    required this.contractNumber,
    required this.customerName,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.serviceType,
    this.contractValue = 0,
    this.billingCycle,
    this.terms,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String contractNumber;
  final String customerName;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final String? serviceType;
  final double contractValue;
  final String? billingCycle;
  final String? terms;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, contractNumber, customerName, status, startDate, endDate,
        serviceType, contractValue, billingCycle, terms, notes,
        createdAt, updatedAt,
      ];
}
