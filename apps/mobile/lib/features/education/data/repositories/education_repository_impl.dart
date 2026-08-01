import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/education.dart';
import '../../domain/repositories/education_repository.dart';
import '../datasources/education_remote_data_source.dart';
import '../models/education_models.dart';

class EducationRepositoryImpl implements EducationRepository {
  const EducationRepositoryImpl({
    required EducationRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _studentNamespace = 'education.students';
  static const String _courseNamespace = 'education.courses';
  static const String _enrollmentNamespace = 'education.enrollments';
  static const String _gradeNamespace = 'education.grades';
  static const String _feeNamespace = 'education.fees';
  static const String _examNamespace = 'education.exams';

  final EducationRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<Student>>>> listStudents(ListQuery q) =>
      _paginated(_studentNamespace, q, () => _remote.listStudents(q),
        StudentModel.fromJson,);

  @override
  Future<Result<Student>> getStudent(String id) =>
      _single(() => _remote.getStudent(id));

  @override
  Future<Result<Student>> createStudent(Map<String, dynamic> p) =>
      _write(() => _remote.createStudent(p));

  @override
  Future<Result<Student>> updateStudent(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateStudent(id, p));

  @override
  Future<Result<void>> deleteStudent(String id) =>
      _delete(() => _remote.deleteStudent(id));

  @override
  Future<Result<Cacheable<Paginated<Course>>>> listCourses(ListQuery q) =>
      _paginated(_courseNamespace, q, () => _remote.listCourses(q),
        CourseModel.fromJson,);

  @override
  Future<Result<Course>> getCourse(String id) =>
      _single(() => _remote.getCourse(id));

  @override
  Future<Result<Course>> createCourse(Map<String, dynamic> p) =>
      _write(() => _remote.createCourse(p));

  @override
  Future<Result<Course>> updateCourse(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCourse(id, p));

  @override
  Future<Result<void>> deleteCourse(String id) =>
      _delete(() => _remote.deleteCourse(id));

  @override
  Future<Result<Cacheable<Paginated<Enrollment>>>> listEnrollments(ListQuery q) =>
      _paginated(_enrollmentNamespace, q, () => _remote.listEnrollments(q),
        EnrollmentModel.fromJson,);

  @override
  Future<Result<Enrollment>> getEnrollment(String id) =>
      _single(() => _remote.getEnrollment(id));

  @override
  Future<Result<Enrollment>> createEnrollment(Map<String, dynamic> p) =>
      _write(() => _remote.createEnrollment(p));

  @override
  Future<Result<void>> deleteEnrollment(String id) =>
      _delete(() => _remote.deleteEnrollment(id));

  @override
  Future<Result<Cacheable<Paginated<GradeEntry>>>> listGradeEntries(ListQuery q) =>
      _paginated(_gradeNamespace, q, () => _remote.listGradeEntries(q),
        GradeEntryModel.fromJson,);

  @override
  Future<Result<GradeEntry>> createGradeEntry(Map<String, dynamic> p) =>
      _write(() => _remote.createGradeEntry(p));

  @override
  Future<Result<GradeEntry>> updateGradeEntry(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateGradeEntry(id, p));

  @override
  Future<Result<Cacheable<Paginated<EducationFeeInvoice>>>> listEducationFeeInvoices(ListQuery q) =>
      _paginated(_feeNamespace, q, () => _remote.listEducationFeeInvoices(q),
        EducationFeeInvoiceModel.fromJson,);

  @override
  Future<Result<EducationFeeInvoice>> getEducationFeeInvoice(String id) =>
      _single(() => _remote.getEducationFeeInvoice(id));

  @override
  Future<Result<EducationFeeInvoice>> createEducationFeeInvoice(Map<String, dynamic> p) =>
      _write(() => _remote.createEducationFeeInvoice(p));

  @override
  Future<Result<Cacheable<Paginated<Exam>>>> listExams(ListQuery q) =>
      _paginated(_examNamespace, q, () => _remote.listExams(q),
        ExamModel.fromJson,);

  @override
  Future<Result<Exam>> createExam(Map<String, dynamic> p) =>
      _write(() => _remote.createExam(p));

  @override
  Future<Result<Exam>> getExam(String id) async => throw UnimplementedError();

  @override
  Future<Result<Exam>> updateExam(String id, Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<void>> deleteExam(String id) async => throw UnimplementedError();

  @override
  Future<Result<GradeEntry>> getGradeEntry(String id) async => throw UnimplementedError();

  @override
  Future<Result<Enrollment>> updateEnrollment(String id, Map<String, dynamic> p) async => throw UnimplementedError();

}
