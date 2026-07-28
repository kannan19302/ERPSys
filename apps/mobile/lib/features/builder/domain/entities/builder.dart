import 'package:equatable/equatable.dart';

class BuilderForm extends Equatable {
  const BuilderForm({
    required this.id,
    required this.title,
    this.description,
    this.fields = const <BuilderFormField>[],
    this.status = 'DRAFT',
    this.version = 1,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? description;
  final List<BuilderFormField> fields;
  final String status;
  final int version;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, description, fields, status, version, createdAt, updatedAt,
      ];
}

class BuilderFormField extends Equatable {
  const BuilderFormField({
    required this.id,
    required this.label,
    required this.fieldType,
    this.required = false,
    this.placeholder,
    this.options = const <String>[],
    this.defaultValue,
    this.order = 0,
  });

  final String id;
  final String label;
  final String fieldType;
  final bool required;
  final String? placeholder;
  final List<String> options;
  final String? defaultValue;
  final int order;

  @override
  List<Object?> get props => <Object?>[
        id, label, fieldType, required, placeholder, options, defaultValue, order,
      ];
}

class BuilderPage extends Equatable {
  const BuilderPage({
    required this.id,
    required this.title,
    this.slug,
    this.layout = 'default',
    this.sections = const <BuilderPageSection>[],
    this.status = 'DRAFT',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? slug;
  final String layout;
  final List<BuilderPageSection> sections;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, slug, layout, sections, status, createdAt, updatedAt,
      ];
}

class BuilderPageSection extends Equatable {
  const BuilderPageSection({
    required this.id,
    required this.type,
    this.title,
    this.content,
    this.order = 0,
  });

  final String id;
  final String type;
  final String? title;
  final String? content;
  final int order;

  @override
  List<Object?> get props => <Object?>[id, type, title, content, order];
}

class BuilderWorkflow extends Equatable {
  const BuilderWorkflow({
    required this.id,
    required this.name,
    this.description,
    this.steps = const <BuilderWorkflowStep>[],
    this.status = 'DRAFT',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final List<BuilderWorkflowStep> steps;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, steps, status, createdAt, updatedAt,
      ];
}

class BuilderWorkflowStep extends Equatable {
  const BuilderWorkflowStep({
    required this.id,
    required this.name,
    this.type = 'approval',
    this.assigneeRole,
    this.order = 0,
  });

  final String id;
  final String name;
  final String type;
  final String? assigneeRole;
  final int order;

  @override
  List<Object?> get props => <Object?>[id, name, type, assigneeRole, order];
}

class BuilderTemplate extends Equatable {
  const BuilderTemplate({
    required this.id,
    required this.name,
    this.category,
    this.description,
    this.content,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? category;
  final String? description;
  final String? content;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, category, description, content, status, createdAt, updatedAt,
      ];
}