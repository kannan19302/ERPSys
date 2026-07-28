import '../../../../core/error/exceptions.dart';
import '../../domain/entities/builder.dart';

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

List<T> _parseItems<T>(List<dynamic>? list, T Function(Map<String, dynamic>) fromJson) =>
    list?.map((e) => fromJson(e as Map<String, dynamic>)).toList(growable: false) ?? const [];

class BuilderFormModel extends BuilderForm {
  const BuilderFormModel({
    required super.id,
    required super.title,
    super.description,
    super.fields = const <BuilderFormField>[],
    super.status = 'DRAFT',
    super.version = 1,
    super.createdAt,
    super.updatedAt,
  });

  factory BuilderFormModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('BuilderForm missing id');
    return BuilderFormModel(
      id: id,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      fields: _parseItems(json['fields'] as List<dynamic>?, BuilderFormFieldModel.fromJson),
      status: json['status'] as String? ?? 'DRAFT',
      version: asInt(json['version']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'description': description,
        'status': status,
        'version': version,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class BuilderFormFieldModel extends BuilderFormField {
  const BuilderFormFieldModel({
    required super.id,
    required super.label,
    required super.fieldType,
    super.required = false,
    super.placeholder,
    super.options = const <String>[],
    super.defaultValue,
    super.order = 0,
  });

  factory BuilderFormFieldModel.fromJson(Map<String, dynamic> json) =>
      BuilderFormFieldModel(
        id: json['id'] as String? ?? '',
        label: json['label'] as String? ?? '',
        fieldType: json['fieldType'] as String? ?? 'text',
        required: json['required'] as bool? ?? false,
        placeholder: json['placeholder'] as String?,
        options: (json['options'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList(growable: false) ??
            const [],
        defaultValue: json['defaultValue'] as String?,
        order: asInt(json['order']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'label': label,
        'fieldType': fieldType,
        'required': required,
        'placeholder': placeholder,
        'options': options,
        'defaultValue': defaultValue,
        'order': order,
      };
}

class BuilderPageModel extends BuilderPage {
  const BuilderPageModel({
    required super.id,
    required super.title,
    super.slug,
    super.layout = 'default',
    super.sections = const <BuilderPageSection>[],
    super.status = 'DRAFT',
    super.createdAt,
    super.updatedAt,
  });

  factory BuilderPageModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('BuilderPage missing id');
    return BuilderPageModel(
      id: id,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String?,
      layout: json['layout'] as String? ?? 'default',
      sections: _parseItems(json['sections'] as List<dynamic>?, BuilderPageSectionModel.fromJson),
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'slug': slug,
        'layout': layout,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class BuilderPageSectionModel extends BuilderPageSection {
  const BuilderPageSectionModel({
    required super.id,
    required super.type,
    super.title,
    super.content,
    super.order = 0,
  });

  factory BuilderPageSectionModel.fromJson(Map<String, dynamic> json) =>
      BuilderPageSectionModel(
        id: json['id'] as String? ?? '',
        type: json['type'] as String? ?? 'content',
        title: json['title'] as String?,
        content: json['content'] as String?,
        order: asInt(json['order']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type,
        'title': title,
        'content': content,
        'order': order,
      };
}

class BuilderWorkflowModel extends BuilderWorkflow {
  const BuilderWorkflowModel({
    required super.id,
    required super.name,
    super.description,
    super.steps = const <BuilderWorkflowStep>[],
    super.status = 'DRAFT',
    super.createdAt,
    super.updatedAt,
  });

  factory BuilderWorkflowModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('BuilderWorkflow missing id');
    return BuilderWorkflowModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      steps: _parseItems(json['steps'] as List<dynamic>?, BuilderWorkflowStepModel.fromJson),
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class BuilderWorkflowStepModel extends BuilderWorkflowStep {
  const BuilderWorkflowStepModel({
    required super.id,
    required super.name,
    super.type = 'approval',
    super.assigneeRole,
    super.order = 0,
  });

  factory BuilderWorkflowStepModel.fromJson(Map<String, dynamic> json) =>
      BuilderWorkflowStepModel(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        type: json['type'] as String? ?? 'approval',
        assigneeRole: json['assigneeRole'] as String?,
        order: asInt(json['order']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'type': type,
        'assigneeRole': assigneeRole,
        'order': order,
      };
}

class BuilderTemplateModel extends BuilderTemplate {
  const BuilderTemplateModel({
    required super.id,
    required super.name,
    super.category,
    super.description,
    super.content,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory BuilderTemplateModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('BuilderTemplate missing id');
    return BuilderTemplateModel(
      id: id,
      name: json['name'] as String? ?? '',
      category: json['category'] as String?,
      description: json['description'] as String?,
      content: json['content'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'category': category,
        'description': description,
        'content': content,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}