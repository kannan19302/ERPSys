import 'package:equatable/equatable.dart';

class Person extends Equatable {
  const Person({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.jobTitle,
    this.department,
    this.teamId,
    this.teamName,
    this.reportsTo,
    this.reportsToName,
    this.status = 'ACTIVE',
    this.employeeId,
    this.employmentType,
    this.joinedDate,
    this.location,
    this.bio,
    this.skills = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String? jobTitle;
  final String? department;
  final String? teamId;
  final String? teamName;
  final String? reportsTo;
  final String? reportsToName;
  final String status;
  final String? employeeId;
  final String? employmentType;
  final DateTime? joinedDate;
  final String? location;
  final String? bio;
  final List<String> skills;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => <Object?>[
        id, firstName, lastName, email, phone, jobTitle, department,
        teamId, teamName, reportsTo, reportsToName, status, employeeId,
        employmentType, joinedDate, location, bio, skills,
        createdAt, updatedAt,
      ];
}

class PeopleTeam extends Equatable {
  const PeopleTeam({
    required this.id,
    required this.name,
    this.description,
    this.leadId,
    this.leadName,
    this.department,
    this.memberCount = 0,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? leadId;
  final String? leadName;
  final String? department;
  final int memberCount;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, leadId, leadName, department, memberCount,
        status, createdAt, updatedAt,
      ];
}

class PeopleOnboardingTask extends Equatable {
  const PeopleOnboardingTask({
    required this.id,
    required this.title,
    this.personId,
    this.personName,
    this.assignedTo,
    this.assignedToName,
    this.status = 'PENDING',
    this.category,
    this.description,
    this.dueDate,
    this.completedDate,
    this.isRequired = true,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? personId;
  final String? personName;
  final String? assignedTo;
  final String? assignedToName;
  final String status;
  final String? category;
  final String? description;
  final DateTime? dueDate;
  final DateTime? completedDate;
  final bool isRequired;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, personId, personName, assignedTo, assignedToName,
        status, category, description, dueDate, completedDate, isRequired,
        notes, createdAt, updatedAt,
      ];
}

class PeopleRecognitionEntry extends Equatable {
  const PeopleRecognitionEntry({
    required this.id,
    required this.message,
    this.giverId,
    this.giverName,
    this.receiverId,
    this.receiverName,
    this.category,
    this.badgeType,
    this.status = 'PUBLISHED',
    this.createdAt,
  });

  final String id;
  final String message;
  final String? giverId;
  final String? giverName;
  final String? receiverId;
  final String? receiverName;
  final String? category;
  final String? badgeType;
  final String status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, message, giverId, giverName, receiverId, receiverName,
        category, badgeType, status, createdAt,
      ];
}
