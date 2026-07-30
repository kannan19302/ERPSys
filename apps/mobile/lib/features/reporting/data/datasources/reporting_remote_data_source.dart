import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/reporting_models.dart';

abstract class ReportingRemoteDataSource {
  Future<Paginated<ReportTemplateModel>> listTemplates(ListQuery query);
  Future<ReportTemplateModel> getTemplate(String id);
  Future<ReportTemplateModel> createTemplate(Map<String, dynamic> payload);
  Future<ReportTemplateModel> updateTemplate(String id, Map<String, dynamic> payload);
  Future<void> deleteTemplate(String id);
  Future<ReportTemplateModel> generateTemplate(String id);

  Future<Paginated<ReportJobModel>> listJobs(ListQuery query);
  Future<ReportJobModel> getJob(String id);

  Future<Paginated<ReportExportModel>> listExports(ListQuery query);
  Future<ReportExportModel> getExport(String id);

  Future<Paginated<ReportComplianceModel>> listCompliance(ListQuery query);
}

class ReportingRemoteDataSourceImpl implements ReportingRemoteDataSource {
  const ReportingRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ReportTemplateModel>> listTemplates(ListQuery query) =>
      _client.getPaginated<ReportTemplateModel>(
        ApiPaths.reportTemplates, query, ReportTemplateModel.fromJson);

  @override
  Future<ReportTemplateModel> getTemplate(String id) async =>
      ReportTemplateModel.fromJson(
        await _client.getObject(ApiPaths.reportTemplate(id)));

  @override
  Future<ReportTemplateModel> createTemplate(Map<String, dynamic> payload) async =>
      ReportTemplateModel.fromJson(
        await _client.post(ApiPaths.reportTemplates, body: payload));

  @override
  Future<ReportTemplateModel> updateTemplate(
    String id, Map<String, dynamic> payload) async =>
      ReportTemplateModel.fromJson(
        await _client.patch(ApiPaths.reportTemplate(id), body: payload));

  @override
  Future<void> deleteTemplate(String id) =>
      _client.delete(ApiPaths.reportTemplate(id));

  @override
  Future<ReportTemplateModel> generateTemplate(String id) async =>
      ReportTemplateModel.fromJson(
        await _client.post(ApiPaths.reportTemplateGenerate(id)));

  @override
  Future<Paginated<ReportJobModel>> listJobs(ListQuery query) =>
      _client.getPaginated<ReportJobModel>(
        ApiPaths.reportJobs, query, ReportJobModel.fromJson);

  @override
  Future<ReportJobModel> getJob(String id) async =>
      ReportJobModel.fromJson(
        await _client.getObject(ApiPaths.reportJob(id)));

  @override
  Future<Paginated<ReportExportModel>> listExports(ListQuery query) =>
      _client.getPaginated<ReportExportModel>(
        ApiPaths.reportExports, query, ReportExportModel.fromJson);

  @override
  Future<ReportExportModel> getExport(String id) async =>
      ReportExportModel.fromJson(
        await _client.getObject(ApiPaths.reportExport(id)));

  @override
  Future<Paginated<ReportComplianceModel>> listCompliance(ListQuery query) =>
      _client.getPaginated<ReportComplianceModel>(
        ApiPaths.reportCompliance, query, ReportComplianceModel.fromJson);
}


