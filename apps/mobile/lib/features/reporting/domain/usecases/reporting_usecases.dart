import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/reporting.dart';
import '../repositories/reporting_repository.dart';

class ListReportTemplatesUseCase extends UseCase<Cacheable<Paginated<ReportTemplate>>, ListQuery> {
  const ListReportTemplatesUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ReportTemplate>>>> call(ListQuery params) =>
      _repository.listTemplates(params);
}

class GetReportTemplateUseCase extends UseCase<ReportTemplate, String> {
  const GetReportTemplateUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<ReportTemplate>> call(String id) => _repository.getTemplate(id);
}

class SaveReportTemplateParams {
  const SaveReportTemplateParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveReportTemplateUseCase extends UseCase<ReportTemplate, SaveReportTemplateParams> {
  const SaveReportTemplateUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<ReportTemplate>> call(SaveReportTemplateParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTemplate(params.payload)
        : _repository.updateTemplate(id, params.payload);
  }
}

class DeleteReportTemplateUseCase extends UseCase<void, String> {
  const DeleteReportTemplateUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTemplate(id);
}

class GenerateReportTemplateUseCase extends UseCase<ReportTemplate, String> {
  const GenerateReportTemplateUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<ReportTemplate>> call(String id) => _repository.generateTemplate(id);
}

class ListReportJobsUseCase extends UseCase<Cacheable<Paginated<ReportJob>>, ListQuery> {
  const ListReportJobsUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ReportJob>>>> call(ListQuery params) =>
      _repository.listJobs(params);
}

class GetReportJobUseCase extends UseCase<ReportJob, String> {
  const GetReportJobUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<ReportJob>> call(String id) => _repository.getJob(id);
}

class ListReportExportsUseCase extends UseCase<Cacheable<Paginated<ReportExport>>, ListQuery> {
  const ListReportExportsUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ReportExport>>>> call(ListQuery params) =>
      _repository.listExports(params);
}

class GetReportExportUseCase extends UseCase<ReportExport, String> {
  const GetReportExportUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<ReportExport>> call(String id) => _repository.getExport(id);
}

class ListReportComplianceUseCase extends UseCase<Cacheable<Paginated<ReportCompliance>>, ListQuery> {
  const ListReportComplianceUseCase(this._repository);
  final ReportingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ReportCompliance>>>> call(ListQuery params) =>
      _repository.listCompliance(params);
}
