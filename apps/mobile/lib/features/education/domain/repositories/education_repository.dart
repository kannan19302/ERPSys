import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/education.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class EducationRepository {
  Future<Result<Cacheable<Paginated<Student>>>> listStudents(ListQuery query);
  Future<Result<Student>> getStudent(String id);
  Future<Result<Student>> createStudent(Map<String, dynamic> payload);
  Future<Result<Student>> updateStudent(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteStudent(String id);

  Future<Result<Cacheable<Paginated<Course>>>> listCourses(ListQuery query);
  Future<Result<Course>> getCourse(String id);
  Future<Result<Course>> createCourse(Map<String, dynamic> payload);
  Future<Result<Course>> updateCourse(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteCourse(String id);

  Future<Result<Cacheable<Paginated<Enrollment>>>> listEnrollments(ListQuery query);
  Future<Result<Enrollment>> getEnrollment(String id);
  Future<Result<Enrollment>> createEnrollment(Map<String, dynamic> payload);
  Future<Result<Enrollment>> updateEnrollment(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteEnrollment(String id);

  Future<Result<Cacheable<Paginated<GradeEntry>>>> listGradeEntries(ListQuery query);
  Future<Result<GradeEntry>> getGradeEntry(String id);
  Future<Result<GradeEntry>> createGradeEntry(Map<String, dynamic> payload);
  Future<Result<GradeEntry>> updateGradeEntry(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<EducationFeeInvoice>>>> listEducationFeeInvoices(ListQuery query);
  Future<Result<EducationFeeInvoice>> getEducationFeeInvoice(String id);
  Future<Result<EducationFeeInvoice>> createEducationFeeInvoice(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<Exam>>>> listExams(ListQuery query);
  Future<Result<Exam>> getExam(String id);
  Future<Result<Exam>> createExam(Map<String, dynamic> payload);
  Future<Result<Exam>> updateExam(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteExam(String id);
}
