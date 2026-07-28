import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/contracts/error_envelope.dart';
import 'package:unerp_mobile/core/error/error_mapper.dart';
import 'package:unerp_mobile/core/error/exceptions.dart';
import 'package:unerp_mobile/core/error/failures.dart';

void main() {
  group('mapExceptionToFailure', () {
    test('a Failure passes through unchanged', () {
      const Failure original = UnauthorizedFailure('expired');
      expect(mapExceptionToFailure(original), same(original));
    });

    test('NetworkException becomes NetworkFailure', () {
      const NetworkException error = NetworkException('no connection');
      final Failure failure = mapExceptionToFailure(error);
      expect(failure, isA<NetworkFailure>());
      expect(failure.message, 'no connection');
    });

    test('ParseException becomes ParseFailure', () {
      const ParseException error = ParseException('bad shape');
      expect(mapExceptionToFailure(error), isA<ParseFailure>());
    });

    test('CacheException becomes CacheFailure', () {
      const CacheException error = CacheException('storage down');
      expect(mapExceptionToFailure(error), isA<CacheFailure>());
    });

    test('an unrecognised error becomes a generic ServerFailure', () {
      final Failure failure = mapExceptionToFailure(StateError('boom'));
      expect(failure, isA<ServerFailure>());
      expect(failure.code, 'INTERNAL_ERROR');
    });

    group('ApiException status mapping — mirrors error-envelope.ts', () {
      Failure mapStatus(int status) => mapExceptionToFailure(
            ApiException(
              ErrorEnvelope(statusCode: status, code: codeForStatus(status), message: 'm'),
            ),
          );

      test('400 and 422 map to ValidationFailure', () {
        expect(mapStatus(400), isA<ValidationFailure>());
        expect(mapStatus(422), isA<ValidationFailure>());
      });

      test('401 maps to UnauthorizedFailure', () {
        expect(mapStatus(401), isA<UnauthorizedFailure>());
      });

      test('403 maps to ForbiddenFailure', () {
        expect(mapStatus(403), isA<ForbiddenFailure>());
      });

      test('404 maps to NotFoundFailure', () {
        expect(mapStatus(404), isA<NotFoundFailure>());
      });

      test('409 maps to ConflictFailure', () {
        expect(mapStatus(409), isA<ConflictFailure>());
      });

      test('429 maps to RateLimitFailure', () {
        expect(mapStatus(429), isA<RateLimitFailure>());
      });

      test('500+ maps to ServerFailure', () {
        expect(mapStatus(500), isA<ServerFailure>());
        expect(mapStatus(503), isA<ServerFailure>());
      });
    });

    test('validation failure carries field errors from a Zod-style envelope', () {
      const ApiException error = ApiException(
        ErrorEnvelope(
          statusCode: 400,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          errors: <Map<String, dynamic>>[
            <String, dynamic>{
              'path': <String>['email'],
              'message': 'Invalid email',
            },
          ],
        ),
      );

      final Failure failure = mapExceptionToFailure(error);
      expect(failure, isA<ValidationFailure>());
      expect(
        (failure as ValidationFailure).fieldErrors,
        <String, String>{'email': 'Invalid email'},
      );
    });
  });

  group('codeForStatus', () {
    test('known statuses map to their stable code', () {
      expect(codeForStatus(400), 'BAD_REQUEST');
      expect(codeForStatus(401), 'UNAUTHORIZED');
      expect(codeForStatus(404), 'NOT_FOUND');
      expect(codeForStatus(429), 'RATE_LIMITED');
    });

    test('unknown 5xx falls back to INTERNAL_ERROR', () {
      expect(codeForStatus(599), 'INTERNAL_ERROR');
    });

    test('unknown 4xx falls back to ERROR', () {
      expect(codeForStatus(499), 'ERROR');
    });
  });
}
