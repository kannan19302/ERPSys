import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/education_models.dart';

abstract class EducationRemoteDataSource {
  Future<Paginated<StudentModel>> listStudents(ListQuery query);
  Future<StudentModel> getStudent(String id);
  Future<StudentModel> createStudent(Map<String, dynamic> payload);
  Future<StudentModel> updateStudent(String id, Map<String, dynamic> payload);
  Future<void> deleteStudent(String id);

  Future<Paginated<CourseModel>> listCourses(ListQuery query);
  Future<CourseModel> getCourse(String id);
  Future<CourseModel> createCourse(Map<String, dynamic> payload);
  Future<CourseModel> updateCourse(String id, Map<String, dynamic> payload);
  Future<void> deleteCourse(String id);

  Future<Paginated<EnrollmentModel>> listEnrollments(ListQuery query);
  Future<EnrollmentModel> getEnrollment(String id);
  Future<EnrollmentModel> createEnrollment(Map<String, dynamic> payload);
  Future<void> deleteEnrollment(String id);

  Future<Paginated<GradeEntryModel>> listGradeEntries(ListQuery query);
  Future<GradeEntryModel> createGradeEntry(Map<String, dynamic> payload);
  Future<GradeEntryModel> updateGradeEntry(String id, Map<String, dynamic> payload);

  Future<Paginated<EducationFeeInvoiceModel>> listEducationFeeInvoices(ListQuery query);
  Future<EducationFeeInvoiceModel> getEducationFeeInvoice(String id);
  Future<EducationFeeInvoiceModel> createEducationFeeInvoice(Map<String, dynamic> payload);

  Future<Paginated<ExamModel>> listExams(ListQuery query);
  Future<ExamModel> createExam(Map<String, dynamic> payload);
}

class EducationRemoteDataSourceImpl implements EducationRemoteDataSource {
  const EducationRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<StudentModel>> listStudents(ListQuery query) =>
      _client.getPaginated<StudentModel>(
        ApiPaths.students, query, StudentModel.fromJson,);

  @override
  Future<StudentModel> getStudent(String id) async =>
      StudentModel.fromJson(await _client.getObject(ApiPaths.student(id)));

  @override
  Future<StudentModel> createStudent(Map<String, dynamic> payload) async =>
      StudentModel.fromJson(
        await _client.post(ApiPaths.students, body: payload),);

  @override
  Future<StudentModel> updateStudent(String id, Map<String, dynamic> payload) async =>
      StudentModel.fromJson(
        await _client.patch(ApiPaths.student(id), body: payload),);

  @override
  Future<void> deleteStudent(String id) =>
      _client.delete(ApiPaths.student(id));

  @override
  Future<Paginated<CourseModel>> listCourses(ListQuery query) =>
      _client.getPaginated<CourseModel>(
        ApiPaths.courses, query, CourseModel.fromJson,);

  @override
  Future<CourseModel> getCourse(String id) async =>
      CourseModel.fromJson(await _client.getObject(ApiPaths.course(id)));

  @override
  Future<CourseModel> createCourse(Map<String, dynamic> payload) async =>
      CourseModel.fromJson(
        await _client.post(ApiPaths.courses, body: payload),);

  @override
  Future<CourseModel> updateCourse(String id, Map<String, dynamic> payload) async =>
      CourseModel.fromJson(
        await _client.patch(ApiPaths.course(id), body: payload),);

  @override
  Future<void> deleteCourse(String id) =>
      _client.delete(ApiPaths.course(id));

  @override
  Future<Paginated<EnrollmentModel>> listEnrollments(ListQuery query) =>
      _client.getPaginated<EnrollmentModel>(
        ApiPaths.enrollments, query, EnrollmentModel.fromJson,);

  @override
  Future<EnrollmentModel> getEnrollment(String id) async =>
      EnrollmentModel.fromJson(await _client.getObject(ApiPaths.enrollment(id)));

  @override
  Future<EnrollmentModel> createEnrollment(Map<String, dynamic> payload) async =>
      EnrollmentModel.fromJson(
        await _client.post(ApiPaths.enrollments, body: payload),);

  @override
  Future<void> deleteEnrollment(String id) =>
      _client.delete(ApiPaths.enrollment(id));

  @override
  Future<Paginated<GradeEntryModel>> listGradeEntries(ListQuery query) =>
      _client.getPaginated<GradeEntryModel>(
        ApiPaths.gradebook, query, GradeEntryModel.fromJson,);

  @override
  Future<GradeEntryModel> createGradeEntry(Map<String, dynamic> payload) async =>
      GradeEntryModel.fromJson(
        await _client.post(ApiPaths.gradebook, body: payload),);

  @override
  Future<GradeEntryModel> updateGradeEntry(
    String id, Map<String, dynamic> payload,) async =>
      GradeEntryModel.fromJson(
        await _client.patch('${ApiPaths.gradebook}/$id', body: payload),);

  @override
  Future<Paginated<EducationFeeInvoiceModel>> listEducationFeeInvoices(
    ListQuery query,) =>
      _client.getPaginated<EducationFeeInvoiceModel>(
        ApiPaths.educationFees, query, EducationFeeInvoiceModel.fromJson,);

  @override
  Future<EducationFeeInvoiceModel> getEducationFeeInvoice(String id) async =>
      EducationFeeInvoiceModel.fromJson(
        await _client.getObject(ApiPaths.educationFeeInvoice(id)),);

  @override
  Future<EducationFeeInvoiceModel> createEducationFeeInvoice(
    Map<String, dynamic> payload,) async =>
      EducationFeeInvoiceModel.fromJson(
        await _client.post(ApiPaths.educationFees, body: payload),);

  @override
  Future<Paginated<ExamModel>> listExams(ListQuery query) =>
      _client.getPaginated<ExamModel>(
        ApiPaths.exams, query, ExamModel.fromJson,);

  @override
  Future<ExamModel> createExam(Map<String, dynamic> payload) async =>
      ExamModel.fromJson(
        await _client.post(ApiPaths.exams, body: payload),);
}
