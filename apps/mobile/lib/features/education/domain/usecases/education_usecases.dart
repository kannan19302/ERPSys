import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/education.dart';
import '../repositories/education_repository.dart';

class ListStudentsUseCase extends UseCase<Cacheable<Paginated<Student>>, ListQuery> {
  const ListStudentsUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Student>>>> call(ListQuery params) =>
      _repository.listStudents(params);
}

class GetStudentUseCase extends UseCase<Student, String> {
  const GetStudentUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Student>> call(String id) => _repository.getStudent(id);
}

class SaveStudentParams {
  const SaveStudentParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveStudentUseCase extends UseCase<Student, SaveStudentParams> {
  const SaveStudentUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Student>> call(SaveStudentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createStudent(params.payload)
        : _repository.updateStudent(id, params.payload);
  }
}

class DeleteStudentUseCase extends UseCase<void, String> {
  const DeleteStudentUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteStudent(id);
}

class ListCoursesUseCase extends UseCase<Cacheable<Paginated<Course>>, ListQuery> {
  const ListCoursesUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Course>>>> call(ListQuery params) =>
      _repository.listCourses(params);
}

class GetCourseUseCase extends UseCase<Course, String> {
  const GetCourseUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Course>> call(String id) => _repository.getCourse(id);
}

class SaveCourseParams {
  const SaveCourseParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveCourseUseCase extends UseCase<Course, SaveCourseParams> {
  const SaveCourseUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Course>> call(SaveCourseParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createCourse(params.payload)
        : _repository.updateCourse(id, params.payload);
  }
}

class DeleteCourseUseCase extends UseCase<void, String> {
  const DeleteCourseUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteCourse(id);
}

class ListEnrollmentsUseCase extends UseCase<Cacheable<Paginated<Enrollment>>, ListQuery> {
  const ListEnrollmentsUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Enrollment>>>> call(ListQuery params) =>
      _repository.listEnrollments(params);
}

class ListGradeEntriesUseCase extends UseCase<Cacheable<Paginated<GradeEntry>>, ListQuery> {
  const ListGradeEntriesUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<GradeEntry>>>> call(ListQuery params) =>
      _repository.listGradeEntries(params);
}

class ListEducationFeeInvoicesUseCase extends UseCase<Cacheable<Paginated<EducationFeeInvoice>>, ListQuery> {
  const ListEducationFeeInvoicesUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<EducationFeeInvoice>>>> call(ListQuery params) =>
      _repository.listEducationFeeInvoices(params);
}

class ListExamsUseCase extends UseCase<Cacheable<Paginated<Exam>>, ListQuery> {
  const ListExamsUseCase(this._repository);
  final EducationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Exam>>>> call(ListQuery params) =>
      _repository.listExams(params);
}
