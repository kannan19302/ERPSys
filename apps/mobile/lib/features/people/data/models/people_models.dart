import '../../../../core/error/exceptions.dart';
import '../../domain/entities/people.dart';

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

class PersonModel extends Person {
  const PersonModel({
    required super.id,
    required super.firstName,
    required super.lastName,
    super.email,
    super.phone,
    super.jobTitle,
    super.department,
    super.teamId,
    super.teamName,
    super.reportsTo,
    super.reportsToName,
    super.status = 'ACTIVE',
    super.employeeId,
    super.employmentType,
    super.joinedDate,
    super.location,
    super.bio,
    super.skills = const <String>[],
    super.createdAt,
    super.updatedAt,
  });

  factory PersonModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Person missing id');
    return PersonModel(
      id: id,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      jobTitle: json['jobTitle'] as String?,
      department: json['department'] as String?,
      teamId: json['teamId'] as String?,
      teamName: json['teamName'] as String?,
      reportsTo: json['reportsTo'] as String?,
      reportsToName: json['reportsToName'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      employeeId: json['employeeId'] as String?,
      employmentType: json['employmentType'] as String?,
      joinedDate: DateTime.tryParse('${json['joinedDate']}'),
      location: json['location'] as String?,
      bio: json['bio'] as String?,
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => '$e')
              .toList(growable: false) ??
          const [],
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
        'jobTitle': jobTitle,
        'department': department,
        'teamId': teamId,
        'teamName': teamName,
        'reportsTo': reportsTo,
        'reportsToName': reportsToName,
        'status': status,
        'employeeId': employeeId,
        'employmentType': employmentType,
        'joinedDate': joinedDate?.toIso8601String(),
        'location': location,
        'bio': bio,
        'skills': skills,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PeopleTeamModel extends PeopleTeam {
  const PeopleTeamModel({
    required super.id,
    required super.name,
    super.description,
    super.leadId,
    super.leadName,
    super.department,
    super.memberCount = 0,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory PeopleTeamModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PeopleTeam missing id');
    return PeopleTeamModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      leadId: json['leadId'] as String?,
      leadName: json['leadName'] as String?,
      department: json['department'] as String?,
      memberCount: asInt(json['memberCount']),
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'leadId': leadId,
        'leadName': leadName,
        'department': department,
        'memberCount': memberCount,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PeopleOnboardingTaskModel extends PeopleOnboardingTask {
  const PeopleOnboardingTaskModel({
    required super.id,
    required super.title,
    super.personId,
    super.personName,
    super.assignedTo,
    super.assignedToName,
    super.status = 'PENDING',
    super.category,
    super.description,
    super.dueDate,
    super.completedDate,
    super.isRequired = true,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory PeopleOnboardingTaskModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PeopleOnboardingTask missing id');
    return PeopleOnboardingTaskModel(
      id: id,
      title: json['title'] as String? ?? '',
      personId: json['personId'] as String?,
      personName: json['personName'] as String?,
      assignedTo: json['assignedTo'] as String?,
      assignedToName: json['assignedToName'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      category: json['category'] as String?,
      description: json['description'] as String?,
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      completedDate: DateTime.tryParse('${json['completedDate']}'),
      isRequired: json['isRequired'] == true,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'personId': personId,
        'personName': personName,
        'assignedTo': assignedTo,
        'assignedToName': assignedToName,
        'status': status,
        'category': category,
        'description': description,
        'dueDate': dueDate?.toIso8601String(),
        'completedDate': completedDate?.toIso8601String(),
        'isRequired': isRequired,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PeopleRecognitionEntryModel extends PeopleRecognitionEntry {
  const PeopleRecognitionEntryModel({
    required super.id,
    required super.message,
    super.giverId,
    super.giverName,
    super.receiverId,
    super.receiverName,
    super.category,
    super.badgeType,
    super.status = 'PUBLISHED',
    super.createdAt,
  });

  factory PeopleRecognitionEntryModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PeopleRecognitionEntry missing id');
    return PeopleRecognitionEntryModel(
      id: id,
      message: json['message'] as String? ?? '',
      giverId: json['giverId'] as String?,
      giverName: json['giverName'] as String?,
      receiverId: json['receiverId'] as String?,
      receiverName: json['receiverName'] as String?,
      category: json['category'] as String?,
      badgeType: json['badgeType'] as String?,
      status: json['status'] as String? ?? 'PUBLISHED',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'message': message,
        'giverId': giverId,
        'giverName': giverName,
        'receiverId': receiverId,
        'receiverName': receiverName,
        'category': category,
        'badgeType': badgeType,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}
