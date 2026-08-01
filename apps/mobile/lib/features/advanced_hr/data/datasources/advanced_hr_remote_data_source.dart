import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/advanced_hr_models.dart';

abstract class AdvancedHrRemoteDataSource {
  Future<Paginated<CompensationBandModel>> listCompensationBands(ListQuery query);
  Future<CompensationBandModel> getCompensationBand(String id);
  Future<CompensationBandModel> createCompensationBand(Map<String, dynamic> payload);
  Future<CompensationBandModel> updateCompensationBand(String id, Map<String, dynamic> payload);
  Future<void> deleteCompensationBand(String id);

  Future<Paginated<BenefitPlanModel>> listBenefitPlans(ListQuery query);
  Future<BenefitPlanModel> getBenefitPlan(String id);
  Future<BenefitPlanModel> createBenefitPlan(Map<String, dynamic> payload);
  Future<BenefitPlanModel> updateBenefitPlan(String id, Map<String, dynamic> payload);
  Future<void> deleteBenefitPlan(String id);

  Future<Paginated<SuccessionPlanModel>> listSuccessionPlans(ListQuery query);
  Future<SuccessionPlanModel> getSuccessionPlan(String id);
  Future<SuccessionPlanModel> createSuccessionPlan(Map<String, dynamic> payload);
  Future<SuccessionPlanModel> updateSuccessionPlan(String id, Map<String, dynamic> payload);

  Future<Paginated<WorkforceAnalyticModel>> listWorkforceAnalytics(ListQuery query);
  Future<WorkforceAnalyticModel> getWorkforceAnalytic(String id);

  Future<Paginated<LearningPathModel>> listLearningPaths(ListQuery query);
  Future<LearningPathModel> getLearningPath(String id);
  Future<LearningPathModel> createLearningPath(Map<String, dynamic> payload);
  Future<LearningPathModel> updateLearningPath(String id, Map<String, dynamic> payload);
}

class AdvancedHrRemoteDataSourceImpl implements AdvancedHrRemoteDataSource {
  const AdvancedHrRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<CompensationBandModel>> listCompensationBands(ListQuery query) =>
      _client.getPaginated<CompensationBandModel>(
        ApiPaths.compensationBands, query, CompensationBandModel.fromJson,);

  @override
  Future<CompensationBandModel> getCompensationBand(String id) async =>
      CompensationBandModel.fromJson(
        await _client.getObject(ApiPaths.compensationBands),);

  @override
  Future<CompensationBandModel> createCompensationBand(Map<String, dynamic> payload) async =>
      CompensationBandModel.fromJson(
        await _client.post(ApiPaths.compensationBands, body: payload),);

  @override
  Future<CompensationBandModel> updateCompensationBand(
    String id, Map<String, dynamic> payload,) async =>
      CompensationBandModel.fromJson(
        await _client.patch(ApiPaths.compensationBands, body: payload),);

  @override
  Future<void> deleteCompensationBand(String id) =>
      _client.delete(ApiPaths.compensationBands);

  @override
  Future<Paginated<BenefitPlanModel>> listBenefitPlans(ListQuery query) =>
      _client.getPaginated<BenefitPlanModel>(
        ApiPaths.benefitsAdministration, query, BenefitPlanModel.fromJson,);

  @override
  Future<BenefitPlanModel> getBenefitPlan(String id) async =>
      BenefitPlanModel.fromJson(
        await _client.getObject(ApiPaths.benefitsAdministration),);

  @override
  Future<BenefitPlanModel> createBenefitPlan(Map<String, dynamic> payload) async =>
      BenefitPlanModel.fromJson(
        await _client.post(ApiPaths.benefitsAdministration, body: payload),);

  @override
  Future<BenefitPlanModel> updateBenefitPlan(
    String id, Map<String, dynamic> payload,) async =>
      BenefitPlanModel.fromJson(
        await _client.patch(ApiPaths.benefitsAdministration, body: payload),);

  @override
  Future<void> deleteBenefitPlan(String id) =>
      _client.delete(ApiPaths.benefitsAdministration);

  @override
  Future<Paginated<SuccessionPlanModel>> listSuccessionPlans(ListQuery query) =>
      _client.getPaginated<SuccessionPlanModel>(
        ApiPaths.successionPlans, query, SuccessionPlanModel.fromJson,);

  @override
  Future<SuccessionPlanModel> getSuccessionPlan(String id) async =>
      SuccessionPlanModel.fromJson(
        await _client.getObject(ApiPaths.successionPlans),);

  @override
  Future<SuccessionPlanModel> createSuccessionPlan(Map<String, dynamic> payload) async =>
      SuccessionPlanModel.fromJson(
        await _client.post(ApiPaths.successionPlans, body: payload),);

  @override
  Future<SuccessionPlanModel> updateSuccessionPlan(
    String id, Map<String, dynamic> payload,) async =>
      SuccessionPlanModel.fromJson(
        await _client.patch(ApiPaths.successionPlans, body: payload),);

  @override
  Future<Paginated<WorkforceAnalyticModel>> listWorkforceAnalytics(ListQuery query) =>
      _client.getPaginated<WorkforceAnalyticModel>(
        ApiPaths.workforceAnalytics, query, WorkforceAnalyticModel.fromJson,);

  @override
  Future<WorkforceAnalyticModel> getWorkforceAnalytic(String id) async =>
      WorkforceAnalyticModel.fromJson(
        await _client.getObject(ApiPaths.workforceAnalytics),);

  @override
  Future<Paginated<LearningPathModel>> listLearningPaths(ListQuery query) =>
      _client.getPaginated<LearningPathModel>(
        ApiPaths.learningPaths, query, LearningPathModel.fromJson,);

  @override
  Future<LearningPathModel> getLearningPath(String id) async =>
      LearningPathModel.fromJson(
        await _client.getObject(ApiPaths.learningPaths),);

  @override
  Future<LearningPathModel> createLearningPath(Map<String, dynamic> payload) async =>
      LearningPathModel.fromJson(
        await _client.post(ApiPaths.learningPaths, body: payload),);

  @override
  Future<LearningPathModel> updateLearningPath(
    String id, Map<String, dynamic> payload,) async =>
      LearningPathModel.fromJson(
        await _client.patch(ApiPaths.learningPaths, body: payload),);
}
