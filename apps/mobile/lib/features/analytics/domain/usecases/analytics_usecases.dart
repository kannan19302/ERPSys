import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/analytics.dart';
import '../repositories/analytics_repository.dart';

class ListKpisUseCase extends UseCase<Cacheable<Paginated<AnalyticsKpi>>, ListQuery> {
  const ListKpisUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AnalyticsKpi>>>> call(ListQuery params) =>
      _repository.listKpis(params);
}

class GetKpiUseCase extends UseCase<AnalyticsKpi, String> {
  const GetKpiUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsKpi>> call(String id) => _repository.getKpi(id);
}

class SaveKpiParams {
  const SaveKpiParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveKpiUseCase extends UseCase<AnalyticsKpi, SaveKpiParams> {
  const SaveKpiUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsKpi>> call(SaveKpiParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createKpi(params.payload)
        : _repository.updateKpi(id, params.payload);
  }
}

class DeleteKpiUseCase extends UseCase<void, String> {
  const DeleteKpiUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteKpi(id);
}

class ListDashboardsUseCase extends UseCase<Cacheable<Paginated<AnalyticsDashboard>>, ListQuery> {
  const ListDashboardsUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AnalyticsDashboard>>>> call(ListQuery params) =>
      _repository.listDashboards(params);
}

class GetDashboardUseCase extends UseCase<AnalyticsDashboard, String> {
  const GetDashboardUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsDashboard>> call(String id) => _repository.getDashboard(id);
}

class SaveDashboardParams {
  const SaveDashboardParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDashboardUseCase extends UseCase<AnalyticsDashboard, SaveDashboardParams> {
  const SaveDashboardUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsDashboard>> call(SaveDashboardParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDashboard(params.payload)
        : _repository.updateDashboard(id, params.payload);
  }
}

class DeleteDashboardUseCase extends UseCase<void, String> {
  const DeleteDashboardUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteDashboard(id);
}

class ListReportsUseCase extends UseCase<Cacheable<Paginated<AnalyticsReport>>, ListQuery> {
  const ListReportsUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AnalyticsReport>>>> call(ListQuery params) =>
      _repository.listReports(params);
}

class GetReportUseCase extends UseCase<AnalyticsReport, String> {
  const GetReportUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsReport>> call(String id) => _repository.getReport(id);
}

class SaveReportParams {
  const SaveReportParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveReportUseCase extends UseCase<AnalyticsReport, SaveReportParams> {
  const SaveReportUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<AnalyticsReport>> call(SaveReportParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createReport(params.payload)
        : _repository.updateReport(id, params.payload);
  }
}

class DeleteReportUseCase extends UseCase<void, String> {
  const DeleteReportUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteReport(id);
}

class ListPipelinesUseCase extends UseCase<Cacheable<Paginated<AnalyticsPipeline>>, ListQuery> {
  const ListPipelinesUseCase(this._repository);
  final AnalyticsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AnalyticsPipeline>>>> call(ListQuery params) =>
      _repository.listPipelines(params);
}
