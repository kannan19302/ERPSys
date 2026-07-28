import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/session.dart';
import '../../domain/usecases/auth_usecases.dart';
import 'auth_providers.dart';
import 'register_state.dart';

final NotifierProvider<RegisterController, RegisterState>
    registerControllerProvider =
    NotifierProvider<RegisterController, RegisterState>(
  RegisterController.new,
);

class RegisterController extends Notifier<RegisterState> {
  @override
  RegisterState build() => const RegisterState();

  Future<void> submit({
    required String email,
    required String password,
    required String confirmPassword,
    required String firstName,
    required String lastName,
    required String organizationName,
    String? industry,
    String? country,
  }) async {
    state = state.copyWith(isSubmitting: true, clearFailure: true);

    final Result<RegisteredAccount> result =
        await RegisterUseCase(ref.read(authRepositoryProvider))(
      RegisterParams(
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        firstName: firstName,
        lastName: lastName,
        organizationName: organizationName,
        industry: industry,
        country: country,
      ),
    );

    state = result.fold(
      (Failure failure) => state.copyWith(isSubmitting: false, failure: failure),
      (RegisteredAccount account) => state.copyWith(
        isSubmitting: false,
        account: account,
        clearFailure: true,
      ),
    );
  }

  Future<bool> resendVerification(String email) async {
    final Result<void> result =
        await ResendVerificationUseCase(ref.read(authRepositoryProvider))(email);
    return result.isOk;
  }

  void reset() => state = const RegisterState();
}
