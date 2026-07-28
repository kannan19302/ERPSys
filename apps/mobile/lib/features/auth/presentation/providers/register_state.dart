import 'package:equatable/equatable.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/session.dart';

/// State for the registration form — deliberately separate from [AuthState]
/// since a successful register never signs the user in (email verification
/// is required first); merging the two would make "authenticated" ambiguous.
class RegisterState extends Equatable {
  const RegisterState({
    this.isSubmitting = false,
    this.failure,
    this.account,
  });

  final bool isSubmitting;
  final Failure? failure;

  /// Set once `POST /auth/register` succeeds.
  final RegisteredAccount? account;

  bool get succeeded => account != null;

  RegisterState copyWith({
    bool? isSubmitting,
    Failure? failure,
    bool clearFailure = false,
    RegisteredAccount? account,
  }) =>
      RegisterState(
        isSubmitting: isSubmitting ?? this.isSubmitting,
        failure: clearFailure ? null : (failure ?? this.failure),
        account: account ?? this.account,
      );

  @override
  List<Object?> get props => <Object?>[isSubmitting, failure, account];
}
