import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/analytics.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class AnalyticsRepository {
  Future<Result<Cacheable<Paginated<AnalyticsKpi>>>> listKpis(ListQuery query);
  Future<Result<AnalyticsKpi>> getKpi(String id);
  Future<Result<AnalyticsKpi>> createKpi(Map<String, dynamic> payload);
  Future<Result<AnalyticsKpi>> updateKpi(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteKpi(String id);

  Future<Result<Cacheable<Paginated<AnalyticsDashboard>>>> listDashboards(ListQuery query);
  Future<Result<AnalyticsDashboard>> getDashboard(String id);
  Future<Result<AnalyticsDashboard>> createDashboard(Map<String, dynamic> payload);
  Future<Result<AnalyticsDashboard>> updateDashboard(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteDashboard(String id);

  Future<Result<Cacheable<Paginated<AnalyticsReport>>>> listReports(ListQuery query);
  Future<Result<AnalyticsReport>> getReport(String id);
  Future<Result<AnalyticsReport>> createReport(Map<String, dynamic> payload);
  Future<Result<AnalyticsReport>> updateReport(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteReport(String id);

  Future<Result<Cacheable<Paginated<AnalyticsPipeline>>>> listPipelines(ListQuery query);
}
