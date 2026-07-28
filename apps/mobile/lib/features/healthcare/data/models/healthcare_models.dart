import '../../../../core/error/exceptions.dart';
import '../../domain/entities/healthcare.dart';

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

class PatientModel extends Patient {
  const PatientModel({
    required super.id,
    required super.name,
    super.dateOfBirth,
    super.gender,
    super.phone,
    super.email,
    super.address,
    super.bloodGroup,
    super.allergies,
    super.medicalHistory,
    super.emergencyContactName,
    super.emergencyContactPhone,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Patient missing id');
    return PatientModel(
      id: id,
      name: json['name'] as String? ?? '',
      dateOfBirth: DateTime.tryParse('${json['dateOfBirth']}'),
      gender: json['gender'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      bloodGroup: json['bloodGroup'] as String?,
      allergies: json['allergies'] as String?,
      medicalHistory: json['medicalHistory'] as String?,
      emergencyContactName: json['emergencyContactName'] as String?,
      emergencyContactPhone: json['emergencyContactPhone'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'gender': gender,
        'phone': phone,
        'email': email,
        'address': address,
        'bloodGroup': bloodGroup,
        'allergies': allergies,
        'medicalHistory': medicalHistory,
        'emergencyContactName': emergencyContactName,
        'emergencyContactPhone': emergencyContactPhone,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AppointmentModel extends Appointment {
  const AppointmentModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.appointmentDate,
    required super.status,
    super.doctorName,
    super.specialty,
    super.reason,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Appointment missing id');
    return AppointmentModel(
      id: id,
      patientId: json['patientId'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      appointmentDate: DateTime.parse('${json['appointmentDate']}'),
      status: json['status'] as String? ?? 'SCHEDULED',
      doctorName: json['doctorName'] as String?,
      specialty: json['specialty'] as String?,
      reason: json['reason'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'appointmentDate': appointmentDate.toIso8601String(),
        'status': status,
        'doctorName': doctorName,
        'specialty': specialty,
        'reason': reason,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PrescriptionModel extends Prescription {
  const PrescriptionModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.prescriptionDate,
    required super.status,
    super.doctorName,
    super.medications,
    super.diagnosis,
    super.notes,
    super.refillCount = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory PrescriptionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Prescription missing id');
    return PrescriptionModel(
      id: id,
      patientId: json['patientId'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      prescriptionDate: DateTime.parse('${json['prescriptionDate']}'),
      status: json['status'] as String? ?? 'ACTIVE',
      doctorName: json['doctorName'] as String?,
      medications: json['medications'] as String?,
      diagnosis: json['diagnosis'] as String?,
      notes: json['notes'] as String?,
      refillCount: asInt(json['refillCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'prescriptionDate': prescriptionDate.toIso8601String(),
        'status': status,
        'doctorName': doctorName,
        'medications': medications,
        'diagnosis': diagnosis,
        'notes': notes,
        'refillCount': refillCount,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LabOrderModel extends LabOrder {
  const LabOrderModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.testName,
    required super.status,
    super.orderedBy,
    super.collectedAt,
    super.result,
    super.resultDate,
    super.referenceRange,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory LabOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LabOrder missing id');
    return LabOrderModel(
      id: id,
      patientId: json['patientId'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      testName: json['testName'] as String? ?? '',
      status: json['status'] as String? ?? 'ORDERED',
      orderedBy: json['orderedBy'] as String?,
      collectedAt: DateTime.tryParse('${json['collectedAt']}'),
      result: json['result'] as String?,
      resultDate: DateTime.tryParse('${json['resultDate']}'),
      referenceRange: json['referenceRange'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'testName': testName,
        'status': status,
        'orderedBy': orderedBy,
        'collectedAt': collectedAt?.toIso8601String(),
        'result': result,
        'resultDate': resultDate?.toIso8601String(),
        'referenceRange': referenceRange,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class MedicalRecordModel extends MedicalRecord {
  const MedicalRecordModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.recordType,
    required super.recordDate,
    super.title,
    super.description,
    super.attachments,
    super.createdBy,
    super.createdAt,
    super.updatedAt,
  });

  factory MedicalRecordModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MedicalRecord missing id');
    return MedicalRecordModel(
      id: id,
      patientId: json['patientId'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      recordType: json['recordType'] as String? ?? '',
      recordDate: DateTime.parse('${json['recordDate']}'),
      title: json['title'] as String?,
      description: json['description'] as String?,
      attachments: json['attachments'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'recordType': recordType,
        'recordDate': recordDate.toIso8601String(),
        'title': title,
        'description': description,
        'attachments': attachments,
        'createdBy': createdBy,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class InsuranceClaimModel extends InsuranceClaim {
  const InsuranceClaimModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.claimNumber,
    required super.status,
    super.insuranceProvider,
    super.claimAmount = 0,
    super.approvedAmount = 0,
    super.claimDate,
    super.approvalDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory InsuranceClaimModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('InsuranceClaim missing id');
    return InsuranceClaimModel(
      id: id,
      patientId: json['patientId'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      claimNumber: json['claimNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      insuranceProvider: json['insuranceProvider'] as String?,
      claimAmount: asDouble(json['claimAmount']),
      approvedAmount: asDouble(json['approvedAmount']),
      claimDate: DateTime.tryParse('${json['claimDate']}'),
      approvalDate: DateTime.tryParse('${json['approvalDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'claimNumber': claimNumber,
        'status': status,
        'insuranceProvider': insuranceProvider,
        'claimAmount': claimAmount,
        'approvedAmount': approvedAmount,
        'claimDate': claimDate?.toIso8601String(),
        'approvalDate': approvalDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
