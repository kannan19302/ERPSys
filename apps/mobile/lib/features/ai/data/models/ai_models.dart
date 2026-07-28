import '../../../../core/error/exceptions.dart';
import '../../domain/entities/ai.dart';

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

class AiModelModel extends AiModel {
  const AiModelModel({
    required super.id,
    required super.name,
    super.provider,
    super.version,
    super.status = 'ACTIVE',
    super.capabilities = const <String>[],
    super.config,
    super.createdAt,
    super.updatedAt,
  });

  factory AiModelModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AiModel missing id');
    return AiModelModel(
      id: id,
      name: json['name'] as String? ?? '',
      provider: json['provider'] as String?,
      version: json['version'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      capabilities: (json['capabilities'] as List<dynamic>?)
              ?.map((e) => '$e')
              .toList(growable: false) ??
          const [],
      config: json['config'] as Map<String, dynamic>?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'provider': provider,
        'version': version,
        'status': status,
        'capabilities': capabilities,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AiPromptModel extends AiPrompt {
  const AiPromptModel({
    required super.id,
    super.title,
    required super.prompt,
    super.modelId,
    super.status = 'ACTIVE',
    super.responseTime,
    super.createdAt,
  });

  factory AiPromptModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AiPrompt missing id');
    return AiPromptModel(
      id: id,
      title: json['title'] as String?,
      prompt: json['prompt'] as String? ?? '',
      modelId: json['modelId'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      responseTime: asDouble(json['responseTime']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'prompt': prompt,
        'modelId': modelId,
        'status': status,
        'responseTime': responseTime,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AiTrainingDataModel extends AiTrainingData {
  const AiTrainingDataModel({
    required super.id,
    required super.name,
    super.dataType,
    super.status = 'PENDING',
    super.recordsCount = 0,
    super.fileUrl,
    super.createdAt,
  });

  factory AiTrainingDataModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AiTrainingData missing id');
    return AiTrainingDataModel(
      id: id,
      name: json['name'] as String? ?? '',
      dataType: json['dataType'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      recordsCount: asInt(json['recordsCount']),
      fileUrl: json['fileUrl'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'dataType': dataType,
        'status': status,
        'recordsCount': recordsCount,
        'fileUrl': fileUrl,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AiPredictionModel extends AiPrediction {
  const AiPredictionModel({
    required super.id,
    super.modelId,
    super.modelName,
    required super.input,
    super.output,
    super.confidence,
    super.processingTime,
    super.createdAt,
  });

  factory AiPredictionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AiPrediction missing id');
    return AiPredictionModel(
      id: id,
      modelId: json['modelId'] as String?,
      modelName: json['modelName'] as String?,
      input: json['input'] as Map<String, dynamic>? ?? const <String, dynamic>{},
      output: json['output'] as Map<String, dynamic>?,
      confidence: asDouble(json['confidence']),
      processingTime: asDouble(json['processingTime']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'modelId': modelId,
        'modelName': modelName,
        'input': input,
        'output': output,
        'confidence': confidence,
        'processingTime': processingTime,
        'createdAt': createdAt?.toIso8601String(),
      };
}
