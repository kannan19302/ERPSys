import 'package:equatable/equatable.dart';

class ReportTemplate extends Equatable {
  const ReportTemplate({
    required this.id,
    required this.name,
    this.description,
    this.reportType,
    this.config,
    this.format = 'PDF',
    this.status = 'DRAFT',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? reportType;
  final Map<String, dynamic>? config;
  final String format;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, reportType, config,
        format, status, createdAt, updatedAt,
      ];
}

class ReportJob extends Equatable {
  const ReportJob({
    required this.id,
    this.templateId,
    this.templateName,
    this.status = 'PENDING',
    this.startedAt,
    this.completedAt,
    this.error,
    this.createdAt,
  });

  final String id;
  final String? templateId;
  final String? templateName;
  final String status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final String? error;
  final DateTime? createdAt;

  Duration? get duration {
    if (startedAt == null || completedAt == null) return null;
    return completedAt!.difference(startedAt!);
  }

  @override
  List<Object?> get props => <Object?>[
        id, templateId, templateName, status,
        startedAt, completedAt, error, createdAt,
      ];
}

class ReportExport extends Equatable {
  const ReportExport({
    required this.id,
    this.reportId,
    this.reportName,
    this.format = 'PDF',
    this.status = 'PENDING',
    this.fileUrl,
    this.fileSize,
    this.createdAt,
  });

  final String id;
  final String? reportId;
  final String? reportName;
  final String format;
  final String status;
  final String? fileUrl;
  final int? fileSize;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, reportId, reportName, format, status,
        fileUrl, fileSize, createdAt,
      ];
}

class ReportCompliance extends Equatable {
  const ReportCompliance({
    required this.id,
    required this.name,
    this.regulation,
    this.status = 'ACTIVE',
    this.lastRunAt,
    this.nextRunAt,
    this.findings = 0,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? regulation;
  final String status;
  final DateTime? lastRunAt;
  final DateTime? nextRunAt;
  final int findings;
  final DateTime? createdAt;

  bool get isOverdue =>
      nextRunAt != null && nextRunAt!.isBefore(DateTime.now());

  @override
  List<Object?> get props => <Object?>[
        id, name, regulation, status,
        lastRunAt, nextRunAt, findings, createdAt,
      ];
}
