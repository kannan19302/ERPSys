import 'package:equatable/equatable.dart';

class AnalyticsKpi extends Equatable {
  const AnalyticsKpi({
    required this.id,
    required this.name,
    this.value = 0,
    this.target,
    this.unit,
    this.period,
    this.trend,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final double value;
  final double? target;
  final String? unit;
  final String? period;
  final String? trend;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  double? get percentAchieved =>
      target != null && target! > 0 ? (value / target!) * 100 : null;

  @override
  List<Object?> get props => <Object?>[
        id, name, value, target, unit, period, trend,
        status, createdAt, updatedAt,
      ];
}

class AnalyticsDashboard extends Equatable {
  const AnalyticsDashboard({
    required this.id,
    required this.title,
    this.description,
    this.layout = const <String>[],
    this.widgets = const <DashboardWidget>[],
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? description;
  final List<String> layout;
  final List<DashboardWidget> widgets;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, description, layout, widgets,
        status, createdAt, updatedAt,
      ];
}

class DashboardWidget extends Equatable {
  const DashboardWidget({
    required this.id,
    this.widgetType,
    this.title,
    this.config,
    this.position,
  });

  final String id;
  final String? widgetType;
  final String? title;
  final Map<String, dynamic>? config;
  final int? position;

  @override
  List<Object?> get props => <Object?>[id, widgetType, title, config, position];
}

class AnalyticsReport extends Equatable {
  const AnalyticsReport({
    required this.id,
    required this.title,
    this.description,
    this.reportType,
    this.config,
    this.status = 'DRAFT',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? description;
  final String? reportType;
  final Map<String, dynamic>? config;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, description, reportType, config,
        status, createdAt, updatedAt,
      ];
}

class AnalyticsPipeline extends Equatable {
  const AnalyticsPipeline({
    required this.id,
    required this.name,
    this.stages = const <PipelineStage>[],
    this.totalValue = 0,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final List<PipelineStage> stages;
  final double totalValue;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, stages, totalValue, status, createdAt, updatedAt,
      ];
}

class PipelineStage extends Equatable {
  const PipelineStage({
    required this.id,
    this.name,
    this.value = 0,
    this.count = 0,
    this.probability,
  });

  final String id;
  final String? name;
  final double value;
  final int count;
  final double? probability;

  @override
  List<Object?> get props => <Object?>[id, name, value, count, probability];
}
