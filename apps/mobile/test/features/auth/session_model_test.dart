import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/error/exceptions.dart';
import 'package:unerp_mobile/features/auth/data/models/session_model.dart';

void main() {
  group('SessionModel.fromJson', () {
    // Shape produced by issueSession() in
    // apps/api/src/modules/auth/auth.service.ts — refreshToken/refreshExpiresAt
    // are stripped by the controller before the client ever sees this body.
    Map<String, dynamic> validBody() => <String, dynamic>{
          'token': 'jwt-access-token',
          'user': <String, dynamic>{
            'id': 'user-1',
            'email': 'admin@unerp.dev',
            'firstName': 'Ada',
            'lastName': 'Admin',
            'roles': <String>['admin'],
            'permissions': <String>['*'],
          },
          'tenant': <String, dynamic>{
            'id': 'tenant-1',
            'name': 'System Tenant',
            'slug': 'system',
          },
        };

    test('parses a well-formed login/refresh response', () {
      final SessionModel session = SessionModel.fromJson(validBody());
      expect(session.accessToken, 'jwt-access-token');
      expect(session.user.email, 'admin@unerp.dev');
      expect(session.user.fullName, 'Ada Admin');
      expect(session.tenant.slug, 'system');
    });

    test('throws ParseException when the access token is missing', () {
      final Map<String, dynamic> body = validBody()..remove('token');
      expect(() => SessionModel.fromJson(body), throwsA(isA<ParseException>()));
    });

    test('throws ParseException when the user object is missing', () {
      final Map<String, dynamic> body = validBody()..remove('user');
      expect(() => SessionModel.fromJson(body), throwsA(isA<ParseException>()));
    });

    test('tolerates a missing tenant (e.g. a not-yet-provisioned account)', () {
      final Map<String, dynamic> body = validBody()..remove('tenant');
      final SessionModel session = SessionModel.fromJson(body);
      expect(session.tenant.id, isEmpty);
    });

    test('round-trips through toJson for local persistence', () {
      final SessionModel session = SessionModel.fromJson(validBody());
      final Map<String, dynamic> json = session.userModel.toJson();
      final AuthUserModel restored = AuthUserModel.fromJson(json);
      expect(restored.email, session.user.email);
      expect(restored.permissions, session.user.permissions);
    });
  });

  group('AuthUser presentation helpers', () {
    test('initials fall back to the email when names are blank', () {
      final AuthUserModel user = AuthUserModel.fromJson(<String, dynamic>{
        'id': 'u1',
        'email': 'ops@unerp.dev',
        'firstName': '',
        'lastName': '',
      });
      expect(user.initials, 'O');
    });

    test('initials combine first and last name', () {
      final AuthUserModel user = AuthUserModel.fromJson(<String, dynamic>{
        'id': 'u1',
        'email': 'a@b.com',
        'firstName': 'Grace',
        'lastName': 'Hopper',
      });
      expect(user.initials, 'GH');
    });
  });

  group('MfaChallengeModel.fromJson', () {
    test('parses the MFA branch of POST /auth/login', () {
      final MfaChallengeModel challenge = MfaChallengeModel.fromJson(<String, dynamic>{
        'mfaRequired': true,
        'challengeToken': 'mfa-token',
        'pushSent': true,
        'message': 'MFA authentication required.',
      });
      expect(challenge.challengeToken, 'mfa-token');
      expect(challenge.pushSent, isTrue);
    });
  });
}
