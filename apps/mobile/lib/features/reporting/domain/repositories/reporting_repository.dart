import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/reporting.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ReportingRepository {
  Future<Result<Cacheable<Paginated<ReportTemplate>>>> listTemplates(ListQuery query);
  Future<Result<ReportTemplate>> getTemplate(String id);
  Future<Result<ReportTemplate>> createTemplate(Map<String, dynamic> payload);
  Future<Result<ReportTemplate>> updateTemplate(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTemplate(String id);
  Future<Result<ReportTemplate>> generateTemplate(String id);

  Future<Result<Cacheable<Paginated<ReportJob>>>> listJobs(ListQuery query);
  Future<Result<ReportJob>> getJob(String id);

  Future<Result<Cacheable<Paginated<ReportExport>>>> listExports(ListQuery query);
  Future<Result<ReportExport>> getExport(String id);

  Future<Result<Cacheable<Paginated<ReportCompliance>>>> listCompliance(ListQuery query);
  Future<Result<ReportCompliance>> getCompliance(String id);
  Future<Result<ReportCompliance>> createCompliance(Map<String, dynamic> payload);
  Future<Result<ReportCompliance>> updateCompliance(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteCompliance(String id);



  Future<Result<ReportJob>> createJob(Map<String, dynamic> payload);
  Future<Result<ReportJob>> updateJob(String id, Map<String, dynamic> payload);
  Future<Result<ReportExport>> createExport(Map<String, dynamic> payload);
  Future<Result<ReportExport>> updateExport(String id, Map<String, dynamic> payload);

}