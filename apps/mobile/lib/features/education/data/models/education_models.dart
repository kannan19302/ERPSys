import '../../../../core/error/exceptions.dart';
import '../../domain/entities/education.dart';

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

class StudentModel extends Student {
  const StudentModel({
    required super.id,
    required super.firstName,
    required super.lastName,
    super.email,
    super.phone,
    super.dateOfBirth,
    super.gender,
    super.address,
    super.enrollmentNumber,
    super.guardianName,
    super.guardianPhone,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Student missing id');
    return StudentModel(
      id: id,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      dateOfBirth: DateTime.tryParse('${json['dateOfBirth']}'),
      gender: json['gender'] as String?,
      address: json['address'] as String?,
      enrollmentNumber: json['enrollmentNumber'] as String?,
      guardianName: json['guardianName'] as String?,
      guardianPhone: json['guardianPhone'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'gender': gender,
        'address': address,
        'enrollmentNumber': enrollmentNumber,
        'guardianName': guardianName,
        'guardianPhone': guardianPhone,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class CourseModel extends Course {
  const CourseModel({
    required super.id,
    required super.code,
    required super.name,
    super.department,
    super.instructor,
    super.credits = 0,
    super.durationHours = 0,
    super.description,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Course missing id');
    return CourseModel(
      id: id,
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      department: json['department'] as String?,
      instructor: json['instructor'] as String?,
      credits: asInt(json['credits']),
      durationHours: asInt(json['durationHours']),
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'code': code,
        'name': name,
        'department': department,
        'instructor': instructor,
        'credits': credits,
        'durationHours': durationHours,
        'description': description,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class EnrollmentModel extends Enrollment {
  const EnrollmentModel({
    required super.id,
    required super.studentId,
    required super.studentName,
    required super.courseId,
    required super.courseName,
    required super.enrollmentDate,
    super.status = 'ACTIVE',
    super.grade,
    super.semester,
    super.academicYear,
    super.createdAt,
    super.updatedAt,
  });

  factory EnrollmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Enrollment missing id');
    return EnrollmentModel(
      id: id,
      studentId: json['studentId'] as String? ?? '',
      studentName: json['studentName'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      courseName: json['courseName'] as String? ?? '',
      enrollmentDate: DateTime.parse('${json['enrollmentDate']}'),
      status: json['status'] as String? ?? 'ACTIVE',
      grade: json['grade'] as String?,
      semester: json['semester'] as String?,
      academicYear: json['academicYear'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'studentId': studentId,
        'studentName': studentName,
        'courseId': courseId,
        'courseName': courseName,
        'enrollmentDate': enrollmentDate.toIso8601String(),
        'status': status,
        'grade': grade,
        'semester': semester,
        'academicYear': academicYear,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class GradeEntryModel extends GradeEntry {
  const GradeEntryModel({
    required super.id,
    required super.studentId,
    required super.studentName,
    required super.courseId,
    required super.courseName,
    super.grade,
    super.score = 0,
    super.maxScore = 100,
    super.gradeDate,
    super.remarks,
    super.createdAt,
    super.updatedAt,
  });

  factory GradeEntryModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('GradeEntry missing id');
    return GradeEntryModel(
      id: id,
      studentId: json['studentId'] as String? ?? '',
      studentName: json['studentName'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      courseName: json['courseName'] as String? ?? '',
      grade: json['grade'] as String?,
      score: asDouble(json['score']),
      maxScore: asDouble(json['maxScore']),
      gradeDate: DateTime.tryParse('${json['gradeDate']}'),
      remarks: json['remarks'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'studentId': studentId,
        'studentName': studentName,
        'courseId': courseId,
        'courseName': courseName,
        'grade': grade,
        'score': score,
        'maxScore': maxScore,
        'gradeDate': gradeDate?.toIso8601String(),
        'remarks': remarks,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class EducationFeeInvoiceModel extends EducationFeeInvoice {
  const EducationFeeInvoiceModel({
    required super.id,
    required super.studentId,
    required super.studentName,
    required super.invoiceNumber,
    required super.status,
    super.amount = 0,
    super.paidAmount = 0,
    super.feeType,
    super.semester,
    super.academicYear,
    super.dueDate,
    super.paidDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory EducationFeeInvoiceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('EducationFeeInvoice missing id');
    return EducationFeeInvoiceModel(
      id: id,
      studentId: json['studentId'] as String? ?? '',
      studentName: json['studentName'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      amount: asDouble(json['amount']),
      paidAmount: asDouble(json['paidAmount']),
      feeType: json['feeType'] as String?,
      semester: json['semester'] as String?,
      academicYear: json['academicYear'] as String?,
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      paidDate: DateTime.tryParse('${json['paidDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'studentId': studentId,
        'studentName': studentName,
        'invoiceNumber': invoiceNumber,
        'status': status,
        'amount': amount,
        'paidAmount': paidAmount,
        'feeType': feeType,
        'semester': semester,
        'academicYear': academicYear,
        'dueDate': dueDate?.toIso8601String(),
        'paidDate': paidDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ExamModel extends Exam {
  const ExamModel({
    required super.id,
    required super.title,
    required super.courseId,
    required super.courseName,
    required super.examDate,
    super.status = 'SCHEDULED',
    super.maxScore = 100,
    super.durationMinutes,
    super.examType,
    super.room,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Exam missing id');
    return ExamModel(
      id: id,
      title: json['title'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      courseName: json['courseName'] as String? ?? '',
      examDate: DateTime.parse('${json['examDate']}'),
      status: json['status'] as String? ?? 'SCHEDULED',
      maxScore: asDouble(json['maxScore']),
      durationMinutes: asInt(json['durationMinutes']),
      examType: json['examType'] as String?,
      room: json['room'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'courseId': courseId,
        'courseName': courseName,
        'examDate': examDate.toIso8601String(),
        'status': status,
        'maxScore': maxScore,
        'durationMinutes': durationMinutes,
        'examType': examType,
        'room': room,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
