import '../../../../core/error/exceptions.dart';
import '../../domain/entities/analytics.dart';

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

List<T> _parseItems<T>(
  Object? raw,
  T Function(Map<String, dynamic>) fromJson,
) =>
    raw is List
        ? raw
            .whereType<Map<String, dynamic>>()
            .map(fromJson)
            .toList(growable: false)
        : const <Never>[];

class AnalyticsKpiModel extends AnalyticsKpi {
  const AnalyticsKpiModel({
    required super.id,
    required super.name,
    super.value = 0,
    super.target,
    super.unit,
    super.period,
    super.trend,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory AnalyticsKpiModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AnalyticsKpi missing id');
    return AnalyticsKpiModel(
      id: id,
      name: json['name'] as String? ?? '',
      value: asDouble(json['value']),
      target: asDouble(json['target']),
      unit: json['unit'] as String?,
      period: json['period'] as String?,
      trend: json['trend'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'value': value,
        'target': target,
        'unit': unit,
        'period': period,
        'trend': trend,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class DashboardWidgetModel extends DashboardWidget {
  const DashboardWidgetModel({
    required super.id,
    super.widgetType,
    super.title,
    super.config,
    super.position,
  });

  factory DashboardWidgetModel.fromJson(Map<String, dynamic> json) =>
      DashboardWidgetModel(
        id: json['id'] as String? ?? '',
        widgetType: json['widgetType'] as String?,
        title: json['title'] as String?,
        config: json['config'] as Map<String, dynamic>?,
        position: asInt(json['position']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'widgetType': widgetType,
        'title': title,
        'config': config,
        'position': position,
      };
}

class AnalyticsDashboardModel extends AnalyticsDashboard {
  const AnalyticsDashboardModel({
    required super.id,
    required super.title,
    super.description,
    super.layout = const <String>[],
    super.widgets = const <DashboardWidget>[],
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory AnalyticsDashboardModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AnalyticsDashboard missing id');
    return AnalyticsDashboardModel(
      id: id,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      layout: (json['layout'] as List<dynamic>?)
              ?.map((e) => '$e')
              .toList(growable: false) ??
          const [],
      widgets: _parseItems(json['widgets'], DashboardWidgetModel.fromJson),
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'description': description,
        'layout': layout,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AnalyticsReportModel extends AnalyticsReport {
  const AnalyticsReportModel({
    required super.id,
    required super.title,
    super.description,
    super.reportType,
    super.config,
    super.status = 'DRAFT',
    super.createdAt,
    super.updatedAt,
  });

  factory AnalyticsReportModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AnalyticsReport missing id');
    return AnalyticsReportModel(
      id: id,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      reportType: json['reportType'] as String?,
      config: json['config'] as Map<String, dynamic>?,
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'description': description,
        'reportType': reportType,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PipelineStageModel extends PipelineStage {
  const PipelineStageModel({
    required super.id,
    super.name,
    super.value = 0,
    super.count = 0,
    super.probability,
  });

  factory PipelineStageModel.fromJson(Map<String, dynamic> json) =>
      PipelineStageModel(
        id: json['id'] as String? ?? '',
        name: json['name'] as String?,
        value: asDouble(json['value']),
        count: asInt(json['count']),
        probability: asDouble(json['probability']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'value': value,
        'count': count,
        'probability': probability,
      };
}

class AnalyticsPipelineModel extends AnalyticsPipeline {
  const AnalyticsPipelineModel({
    required super.id,
    required super.name,
    super.stages = const <PipelineStage>[],
    super.totalValue = 0,
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory AnalyticsPipelineModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AnalyticsPipeline missing id');
    return AnalyticsPipelineModel(
      id: id,
      name: json['name'] as String? ?? '',
      stages: _parseItems(json['stages'], PipelineStageModel.fromJson),
      totalValue: asDouble(json['totalValue']),
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'stages': stages.map((e) => (e as PipelineStageModel).toJson()).toList(),
        'totalValue': totalValue,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
