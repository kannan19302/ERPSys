import '../../../../core/error/exceptions.dart';
import '../../domain/entities/field_service.dart';

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

class ServiceTicketModel extends ServiceTicket {
  const ServiceTicketModel({
    required super.id,
    required super.ticketNumber,
    required super.title,
    required super.status,
    super.customerName,
    super.technicianId,
    super.technicianName,
    super.priority = 'MEDIUM',
    super.description,
    super.scheduledDate,
    super.completedAt,
    super.resolution,
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceTicketModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceTicket missing id');
    return ServiceTicketModel(
      id: id,
      ticketNumber: json['ticketNumber'] as String? ?? '',
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'OPEN',
      customerName: json['customerName'] as String?,
      technicianId: json['technicianId'] as String?,
      technicianName: json['technicianName'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      description: json['description'] as String?,
      scheduledDate: DateTime.tryParse('${json['scheduledDate']}'),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
      resolution: json['resolution'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'ticketNumber': ticketNumber,
        'title': title,
        'status': status,
        'customerName': customerName,
        'technicianId': technicianId,
        'technicianName': technicianName,
        'priority': priority,
        'description': description,
        'scheduledDate': scheduledDate?.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
        'resolution': resolution,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class TechnicianModel extends Technician {
  const TechnicianModel({
    required super.id,
    required super.name,
    super.email,
    super.phone,
    super.specialization,
    super.status = 'AVAILABLE',
    super.skillLevel,
    super.vehicleInfo,
    super.serviceArea,
    super.rating,
    super.createdAt,
    super.updatedAt,
  });

  factory TechnicianModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Technician missing id');
    return TechnicianModel(
      id: id,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      specialization: json['specialization'] as String?,
      status: json['status'] as String? ?? 'AVAILABLE',
      skillLevel: json['skillLevel'] as String?,
      vehicleInfo: json['vehicleInfo'] as String?,
      serviceArea: json['serviceArea'] as String?,
      rating: asDouble(json['rating']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'specialization': specialization,
        'status': status,
        'skillLevel': skillLevel,
        'vehicleInfo': vehicleInfo,
        'serviceArea': serviceArea,
        'rating': rating,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ServiceScheduleModel extends ServiceSchedule {
  const ServiceScheduleModel({
    required super.id,
    required super.ticketId,
    required super.ticketNumber,
    required super.technicianId,
    required super.technicianName,
    required super.scheduledDate,
    required super.status,
    super.customerName,
    super.timeSlot,
    super.location,
    super.notes,
    super.actualStart,
    super.actualEnd,
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceScheduleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceSchedule missing id');
    return ServiceScheduleModel(
      id: id,
      ticketId: json['ticketId'] as String? ?? '',
      ticketNumber: json['ticketNumber'] as String? ?? '',
      technicianId: json['technicianId'] as String? ?? '',
      technicianName: json['technicianName'] as String? ?? '',
      scheduledDate: DateTime.parse('${json['scheduledDate']}'),
      status: json['status'] as String? ?? 'SCHEDULED',
      customerName: json['customerName'] as String?,
      timeSlot: json['timeSlot'] as String?,
      location: json['location'] as String?,
      notes: json['notes'] as String?,
      actualStart: DateTime.tryParse('${json['actualStart']}'),
      actualEnd: DateTime.tryParse('${json['actualEnd']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'ticketId': ticketId,
        'ticketNumber': ticketNumber,
        'technicianId': technicianId,
        'technicianName': technicianName,
        'scheduledDate': scheduledDate.toIso8601String(),
        'status': status,
        'customerName': customerName,
        'timeSlot': timeSlot,
        'location': location,
        'notes': notes,
        'actualStart': actualStart?.toIso8601String(),
        'actualEnd': actualEnd?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ServiceContractModel extends ServiceContract {
  const ServiceContractModel({
    required super.id,
    required super.contractNumber,
    required super.customerName,
    required super.status,
    required super.startDate,
    required super.endDate,
    super.serviceType,
    super.contractValue = 0,
    super.billingCycle,
    super.terms,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory ServiceContractModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ServiceContract missing id');
    return ServiceContractModel(
      id: id,
      contractNumber: json['contractNumber'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      startDate: DateTime.parse('${json['startDate']}'),
      endDate: DateTime.parse('${json['endDate']}'),
      serviceType: json['serviceType'] as String?,
      contractValue: asDouble(json['contractValue']),
      billingCycle: json['billingCycle'] as String?,
      terms: json['terms'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'contractNumber': contractNumber,
        'customerName': customerName,
        'status': status,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'serviceType': serviceType,
        'contractValue': contractValue,
        'billingCycle': billingCycle,
        'terms': terms,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
