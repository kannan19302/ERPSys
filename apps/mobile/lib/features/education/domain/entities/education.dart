import 'package:equatable/equatable.dart';

class Student extends Equatable {
  const Student({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.enrollmentNumber,
    this.guardianName,
    this.guardianPhone,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? address;
  final String? enrollmentNumber;
  final String? guardianName;
  final String? guardianPhone;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => <Object?>[
        id, firstName, lastName, email, phone, dateOfBirth, gender,
        address, enrollmentNumber, guardianName, guardianPhone,
        status, createdAt, updatedAt,
      ];
}

class Course extends Equatable {
  const Course({
    required this.id,
    required this.code,
    required this.name,
    this.department,
    this.instructor,
    this.credits = 0,
    this.durationHours = 0,
    this.description,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String code;
  final String name;
  final String? department;
  final String? instructor;
  final int credits;
  final int durationHours;
  final String? description;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, name, department, instructor, credits, durationHours,
        description, status, createdAt, updatedAt,
      ];
}

class Enrollment extends Equatable {
  const Enrollment({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.courseId,
    required this.courseName,
    required this.enrollmentDate,
    this.status = 'ACTIVE',
    this.grade,
    this.semester,
    this.academicYear,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String studentId;
  final String studentName;
  final String courseId;
  final String courseName;
  final DateTime enrollmentDate;
  final String status;
  final String? grade;
  final String? semester;
  final String? academicYear;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, studentId, studentName, courseId, courseName,
        enrollmentDate, status, grade, semester, academicYear,
        createdAt, updatedAt,
      ];
}

class GradeEntry extends Equatable {
  const GradeEntry({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.courseId,
    required this.courseName,
    this.grade,
    this.score = 0,
    this.maxScore = 100,
    this.gradeDate,
    this.remarks,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String studentId;
  final String studentName;
  final String courseId;
  final String courseName;
  final String? grade;
  final double score;
  final double maxScore;
  final DateTime? gradeDate;
  final String? remarks;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, studentId, studentName, courseId, courseName, grade,
        score, maxScore, gradeDate, remarks, createdAt, updatedAt,
      ];
}

class EducationFeeInvoice extends Equatable {
  const EducationFeeInvoice({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.invoiceNumber,
    required this.status,
    this.amount = 0,
    this.paidAmount = 0,
    this.feeType,
    this.semester,
    this.academicYear,
    this.dueDate,
    this.paidDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String studentId;
  final String studentName;
  final String invoiceNumber;
  final String status;
  final double amount;
  final double paidAmount;
  final String? feeType;
  final String? semester;
  final String? academicYear;
  final DateTime? dueDate;
  final DateTime? paidDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, studentId, studentName, invoiceNumber, status, amount,
        paidAmount, feeType, semester, academicYear, dueDate, paidDate,
        notes, createdAt, updatedAt,
      ];
}

class Exam extends Equatable {
  const Exam({
    required this.id,
    required this.title,
    required this.courseId,
    required this.courseName,
    required this.examDate,
    this.status = 'SCHEDULED',
    this.maxScore = 100,
    this.durationMinutes,
    this.examType,
    this.room,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String courseId;
  final String courseName;
  final DateTime examDate;
  final String status;
  final double maxScore;
  final int? durationMinutes;
  final String? examType;
  final String? room;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, courseId, courseName, examDate, status, maxScore,
        durationMinutes, examType, room, notes, createdAt, updatedAt,
      ];
}
