import '../contracts/error_envelope.dart';
import 'exceptions.dart';
import 'failures.dart';

/// Single place where transport errors become domain [Failure]s.
///
/// Repositories call this from one `catch`; feature code never inspects status
/// codes. Status semantics follow `packages/shared/src/contracts/error-envelope.ts`.
Failure mapExceptionToFailure(Object error) {
  if (error is Failure) return error;

  if (error is ApiException) return _fromEnvelope(error.envelope);

  if (error is NetworkException) {
    return NetworkFailure(error.message, code: 'NETWORK_UNAVAILABLE');
  }

  if (error is ParseException) {
    return ParseFailure(error.message, code: 'PARSE_ERROR');
  }

  if (error is CacheException) {
    return CacheFailure(error.message, code: 'CACHE_ERROR');
  }

  return const ServerFailure(
    'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
  );
}

Failure _fromEnvelope(ErrorEnvelope envelope) {
  final String message = envelope.message;
  final String code = envelope.code;
  final String? requestId = envelope.requestId;

  return switch (envelope.statusCode) {
    400 || 422 => ValidationFailure(
        message,
        code: code,
        requestId: requestId,
        fieldErrors: envelope.fieldErrors,
      ),
    401 => UnauthorizedFailure(message, code: code, requestId: requestId),
    403 => ForbiddenFailure(message, code: code, requestId: requestId),
    404 => NotFoundFailure(message, code: code, requestId: requestId),
    409 => ConflictFailure(message, code: code, requestId: requestId),
    429 => RateLimitFailure(message, code: code, requestId: requestId),
    final int status when status >= 500 =>
      ServerFailure(message, code: code, requestId: requestId),
    _ => ServerFailure(message, code: code, requestId: requestId),
  };
}
