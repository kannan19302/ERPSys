import '../../../../core/error/exceptions.dart';
import '../../domain/entities/reporting.dart';

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

class ReportTemplateModel extends ReportTemplate {
  const ReportTemplateModel({
    required super.id,
    required super.name,
    super.description,
    super.reportType,
    super.config,
    super.format = 'PDF',
    super.status = 'DRAFT',
    super.createdAt,
    super.updatedAt,
  });

  factory ReportTemplateModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ReportTemplate missing id');
    return ReportTemplateModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      reportType: json['reportType'] as String?,
      config: json['config'] as Map<String, dynamic>?,
      format: json['format'] as String? ?? 'PDF',
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'reportType': reportType,
        'format': format,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ReportJobModel extends ReportJob {
  const ReportJobModel({
    required super.id,
    super.templateId,
    super.templateName,
    super.status = 'PENDING',
    super.startedAt,
    super.completedAt,
    super.error,
    super.createdAt,
  });

  factory ReportJobModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ReportJob missing id');
    return ReportJobModel(
      id: id,
      templateId: json['templateId'] as String?,
      templateName: json['templateName'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      startedAt: DateTime.tryParse('${json['startedAt']}'),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
      error: json['error'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'templateId': templateId,
        'templateName': templateName,
        'status': status,
        'startedAt': startedAt?.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
        'error': error,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ReportExportModel extends ReportExport {
  const ReportExportModel({
    required super.id,
    super.reportId,
    super.reportName,
    super.format = 'PDF',
    super.status = 'PENDING',
    super.fileUrl,
    super.fileSize,
    super.createdAt,
  });

  factory ReportExportModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ReportExport missing id');
    return ReportExportModel(
      id: id,
      reportId: json['reportId'] as String?,
      reportName: json['reportName'] as String?,
      format: json['format'] as String? ?? 'PDF',
      status: json['status'] as String? ?? 'PENDING',
      fileUrl: json['fileUrl'] as String?,
      fileSize: asInt(json['fileSize']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'reportId': reportId,
        'reportName': reportName,
        'format': format,
        'status': status,
        'fileUrl': fileUrl,
        'fileSize': fileSize,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ReportComplianceModel extends ReportCompliance {
  const ReportComplianceModel({
    required super.id,
    required super.name,
    super.regulation,
    super.status = 'ACTIVE',
    super.lastRunAt,
    super.nextRunAt,
    super.findings = 0,
    super.createdAt,
  });

  factory ReportComplianceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ReportCompliance missing id');
    return ReportComplianceModel(
      id: id,
      name: json['name'] as String? ?? '',
      regulation: json['regulation'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      lastRunAt: DateTime.tryParse('${json['lastRunAt']}'),
      nextRunAt: DateTime.tryParse('${json['nextRunAt']}'),
      findings: asInt(json['findings']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'regulation': regulation,
        'status': status,
        'lastRunAt': lastRunAt?.toIso8601String(),
        'nextRunAt': nextRunAt?.toIso8601String(),
        'findings': findings,
        'createdAt': createdAt?.toIso8601String(),
      };
}
