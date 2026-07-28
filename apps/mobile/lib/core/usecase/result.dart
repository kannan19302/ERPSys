import '../error/failures.dart';

/// Explicit success/failure channel returned by every use case.
/// Keeps `try/catch` inside the data layer and makes error handling total.
sealed class Result<T> {
  const Result();

  const factory Result.ok(T value) = Ok<T>;
  const factory Result.err(Failure failure) = Err<T>;

  bool get isOk => this is Ok<T>;
  bool get isErr => this is Err<T>;

  T? get valueOrNull => switch (this) {
        Ok<T>(:final T value) => value,
        Err<T>() => null,
      };

  Failure? get failureOrNull => switch (this) {
        Ok<T>() => null,
        Err<T>(:final Failure failure) => failure,
      };

  R fold<R>(R Function(Failure) onErr, R Function(T) onOk) => switch (this) {
        Ok<T>(:final T value) => onOk(value),
        Err<T>(:final Failure failure) => onErr(failure),
      };

  Result<R> map<R>(R Function(T) transform) => switch (this) {
        Ok<T>(:final T value) => Ok<R>(transform(value)),
        Err<T>(:final Failure failure) => Err<R>(failure),
      };

  Future<Result<R>> flatMap<R>(Future<Result<R>> Function(T) next) async =>
      switch (this) {
        Ok<T>(:final T value) => await next(value),
        Err<T>(:final Failure failure) => Err<R>(failure),
      };
}

final class Ok<T> extends Result<T> {
  const Ok(this.value);

  final T value;
}

final class Err<T> extends Result<T> {
  const Err(this.failure);

  final Failure failure;
}
