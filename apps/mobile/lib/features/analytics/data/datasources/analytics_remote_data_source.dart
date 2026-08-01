import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/analytics_models.dart';

abstract class AnalyticsRemoteDataSource {
  Future<Paginated<AnalyticsKpiModel>> listKpis(ListQuery query);
  Future<AnalyticsKpiModel> getKpi(String id);
  Future<AnalyticsKpiModel> createKpi(Map<String, dynamic> payload);
  Future<AnalyticsKpiModel> updateKpi(String id, Map<String, dynamic> payload);
  Future<void> deleteKpi(String id);

  Future<Paginated<AnalyticsDashboardModel>> listDashboards(ListQuery query);
  Future<AnalyticsDashboardModel> getDashboard(String id);
  Future<AnalyticsDashboardModel> createDashboard(Map<String, dynamic> payload);
  Future<AnalyticsDashboardModel> updateDashboard(String id, Map<String, dynamic> payload);
  Future<void> deleteDashboard(String id);

  Future<Paginated<AnalyticsReportModel>> listReports(ListQuery query);
  Future<AnalyticsReportModel> getReport(String id);
  Future<AnalyticsReportModel> createReport(Map<String, dynamic> payload);
  Future<AnalyticsReportModel> updateReport(String id, Map<String, dynamic> payload);
  Future<void> deleteReport(String id);

  Future<Paginated<AnalyticsPipelineModel>> listPipelines(ListQuery query);
}

class AnalyticsRemoteDataSourceImpl implements AnalyticsRemoteDataSource {
  const AnalyticsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<AnalyticsKpiModel>> listKpis(ListQuery query) =>
      _client.getPaginated<AnalyticsKpiModel>(
        ApiPaths.analyticsKpi, query, AnalyticsKpiModel.fromJson,);

  @override
  Future<AnalyticsKpiModel> getKpi(String id) async =>
      AnalyticsKpiModel.fromJson(
        await _client.getObject(ApiPaths.analyticsKpiDetail(id)),);

  @override
  Future<AnalyticsKpiModel> createKpi(Map<String, dynamic> payload) async =>
      AnalyticsKpiModel.fromJson(
        await _client.post(ApiPaths.analyticsKpi, body: payload),);

  @override
  Future<AnalyticsKpiModel> updateKpi(
    String id, Map<String, dynamic> payload,) async =>
      AnalyticsKpiModel.fromJson(
        await _client.patch(ApiPaths.analyticsKpiDetail(id), body: payload),);

  @override
  Future<void> deleteKpi(String id) =>
      _client.delete(ApiPaths.analyticsKpiDetail(id));

  @override
  Future<Paginated<AnalyticsDashboardModel>> listDashboards(ListQuery query) =>
      _client.getPaginated<AnalyticsDashboardModel>(
        ApiPaths.analyticsDashboards, query, AnalyticsDashboardModel.fromJson,);

  @override
  Future<AnalyticsDashboardModel> getDashboard(String id) async =>
      AnalyticsDashboardModel.fromJson(
        await _client.getObject(ApiPaths.analyticsDashboard(id)),);

  @override
  Future<AnalyticsDashboardModel> createDashboard(
    Map<String, dynamic> payload,) async =>
      AnalyticsDashboardModel.fromJson(
        await _client.post(ApiPaths.analyticsDashboards, body: payload),);

  @override
  Future<AnalyticsDashboardModel> updateDashboard(
    String id, Map<String, dynamic> payload,) async =>
      AnalyticsDashboardModel.fromJson(
        await _client.patch(ApiPaths.analyticsDashboard(id), body: payload),);

  @override
  Future<void> deleteDashboard(String id) =>
      _client.delete(ApiPaths.analyticsDashboard(id));

  @override
  Future<Paginated<AnalyticsReportModel>> listReports(ListQuery query) =>
      _client.getPaginated<AnalyticsReportModel>(
        ApiPaths.analyticsReports, query, AnalyticsReportModel.fromJson,);

  @override
  Future<AnalyticsReportModel> getReport(String id) async =>
      AnalyticsReportModel.fromJson(
        await _client.getObject(ApiPaths.analyticsReport(id)),);

  @override
  Future<AnalyticsReportModel> createReport(Map<String, dynamic> payload) async =>
      AnalyticsReportModel.fromJson(
        await _client.post(ApiPaths.analyticsReports, body: payload),);

  @override
  Future<AnalyticsReportModel> updateReport(
    String id, Map<String, dynamic> payload,) async =>
      AnalyticsReportModel.fromJson(
        await _client.patch(ApiPaths.analyticsReport(id), body: payload),);

  @override
  Future<void> deleteReport(String id) =>
      _client.delete(ApiPaths.analyticsReport(id));

  @override
  Future<Paginated<AnalyticsPipelineModel>> listPipelines(ListQuery query) =>
      _client.getPaginated<AnalyticsPipelineModel>(
        ApiPaths.analyticsPipelines, query, AnalyticsPipelineModel.fromJson,);
}
