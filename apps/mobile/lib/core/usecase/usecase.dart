import 'result.dart';

/// Contract for every application use case (Clean Architecture domain layer).
///
/// A use case owns one piece of business intent, depends only on repository
/// abstractions, and knows nothing about Flutter, Dio, or storage.
abstract class UseCase<Output, Input> {
  const UseCase();

  Future<Result<Output>> call(Input params);
}

/// Marker for use cases that take no input.
class NoParams {
  const NoParams();
}
