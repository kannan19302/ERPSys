import 'package:equatable/equatable.dart';

class Patient extends Equatable {
  const Patient({
    required this.id,
    required this.name,
    this.dateOfBirth,
    this.gender,
    this.phone,
    this.email,
    this.address,
    this.bloodGroup,
    this.allergies,
    this.medicalHistory,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? phone;
  final String? email;
  final String? address;
  final String? bloodGroup;
  final String? allergies;
  final String? medicalHistory;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, dateOfBirth, gender, phone, email, address, bloodGroup,
        allergies, medicalHistory, emergencyContactName, emergencyContactPhone,
        status, createdAt, updatedAt,
      ];
}

class Appointment extends Equatable {
  const Appointment({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.appointmentDate,
    required this.status,
    this.doctorName,
    this.specialty,
    this.reason,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String patientName;
  final DateTime appointmentDate;
  final String status;
  final String? doctorName;
  final String? specialty;
  final String? reason;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, patientId, patientName, appointmentDate, status,
        doctorName, specialty, reason, notes, createdAt, updatedAt,
      ];
}

class Prescription extends Equatable {
  const Prescription({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.prescriptionDate,
    required this.status,
    this.doctorName,
    this.medications,
    this.diagnosis,
    this.notes,
    this.refillCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String patientName;
  final DateTime prescriptionDate;
  final String status;
  final String? doctorName;
  final String? medications;
  final String? diagnosis;
  final String? notes;
  final int refillCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, patientId, patientName, prescriptionDate, status,
        doctorName, medications, diagnosis, notes, refillCount,
        createdAt, updatedAt,
      ];
}

class LabOrder extends Equatable {
  const LabOrder({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.testName,
    required this.status,
    this.orderedBy,
    this.collectedAt,
    this.result,
    this.resultDate,
    this.referenceRange,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String patientName;
  final String testName;
  final String status;
  final String? orderedBy;
  final DateTime? collectedAt;
  final String? result;
  final DateTime? resultDate;
  final String? referenceRange;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, patientId, patientName, testName, status, orderedBy,
        collectedAt, result, resultDate, referenceRange, notes,
        createdAt, updatedAt,
      ];
}

class MedicalRecord extends Equatable {
  const MedicalRecord({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.recordType,
    required this.recordDate,
    this.title,
    this.description,
    this.attachments,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String patientName;
  final String recordType;
  final DateTime recordDate;
  final String? title;
  final String? description;
  final String? attachments;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, patientId, patientName, recordType, recordDate, title,
        description, attachments, createdBy, createdAt, updatedAt,
      ];
}

class InsuranceClaim extends Equatable {
  const InsuranceClaim({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.claimNumber,
    required this.status,
    this.insuranceProvider,
    this.claimAmount = 0,
    this.approvedAmount = 0,
    this.claimDate,
    this.approvalDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String patientName;
  final String claimNumber;
  final String status;
  final String? insuranceProvider;
  final double claimAmount;
  final double approvedAmount;
  final DateTime? claimDate;
  final DateTime? approvalDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, patientId, patientName, claimNumber, status,
        insuranceProvider, claimAmount, approvedAmount, claimDate,
        approvalDate, notes, createdAt, updatedAt,
      ];
}
