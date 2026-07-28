import 'package:equatable/equatable.dart';

class AiModel extends Equatable {
  const AiModel({
    required this.id,
    required this.name,
    this.provider,
    this.version,
    this.status = 'ACTIVE',
    this.capabilities = const <String>[],
    this.config,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? provider;
  final String? version;
  final String status;
  final List<String> capabilities;
  final Map<String, dynamic>? config;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, provider, version, status,
        capabilities, config, createdAt, updatedAt,
      ];
}

class AiPrompt extends Equatable {
  const AiPrompt({
    required this.id,
    this.title,
    required this.prompt,
    this.modelId,
    this.status = 'ACTIVE',
    this.responseTime,
    this.createdAt,
  });

  final String id;
  final String? title;
  final String prompt;
  final String? modelId;
  final String status;
  final double? responseTime;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, prompt, modelId, status,
        responseTime, createdAt,
      ];
}

class AiTrainingData extends Equatable {
  const AiTrainingData({
    required this.id,
    required this.name,
    this.dataType,
    this.status = 'PENDING',
    this.recordsCount = 0,
    this.fileUrl,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? dataType;
  final String status;
  final int recordsCount;
  final String? fileUrl;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, dataType, status, recordsCount, fileUrl, createdAt,
      ];
}

class AiPrediction extends Equatable {
  const AiPrediction({
    required this.id,
    this.modelId,
    this.modelName,
    required this.input,
    this.output,
    this.confidence,
    this.processingTime,
    this.createdAt,
  });

  final String id;
  final String? modelId;
  final String? modelName;
  final Map<String, dynamic> input;
  final Map<String, dynamic>? output;
  final double? confidence;
  final double? processingTime;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, modelId, modelName, input, output,
        confidence, processingTime, createdAt,
      ];
}
