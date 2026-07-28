import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/session.dart';
import '../providers/auth_providers.dart';
import '../providers/auth_state.dart';

/// Second factor for `POST /auth/mfa/verify-login`.
///
/// When the API reports that a push challenge was delivered, the page also
/// polls `POST /auth/mfa/push/status` so an approval on another device
/// completes sign-in without typing anything.
class MfaChallengePage extends ConsumerStatefulWidget {
  const MfaChallengePage({super.key});

  static const String routeName = 'mfa';
  static const String routePath = '/sign-in/mfa';

  @override
  ConsumerState<MfaChallengePage> createState() => _MfaChallengePageState();
}

class _MfaChallengePageState extends ConsumerState<MfaChallengePage> {
  static const Duration _pollInterval = Duration(seconds: 3);

  final TextEditingController _code = TextEditingController();
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    // Only poll when the server actually pushed a challenge.
    if (ref.read(authControllerProvider).mfaPushSent) {
      _pollTimer = Timer.periodic(_pollInterval, (_) => _pollPushApproval());
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _code.dispose();
    super.dispose();
  }

  Future<void> _pollPushApproval() async {
    final String? challenge = ref.read(authControllerProvider).mfaChallengeToken;
    if (challenge == null) return;

    final Result<Session?> result = await ref
        .read(authRepositoryProvider)
        .pollMfaPush(challengeToken: challenge);

    result.fold(
      (Failure _) => null,
      (Session? session) {
        if (session == null) return;
        _pollTimer?.cancel();
        // Re-enter through the controller so state and routing stay in sync.
        unawaited(ref.read(authControllerProvider.notifier).restore());
      },
    );
  }

  Future<void> _submit() async {
    if (_code.text.trim().length < 6) return;
    FocusScope.of(context).unfocus();
    await ref.read(authControllerProvider.notifier).verifyMfa(_code.text);
  }

  @override
  Widget build(BuildContext context) {
    final AuthState auth = ref.watch(authControllerProvider);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Two-factor authentication'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Back to sign in',
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(Spacing.x6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Icon(Icons.shield_outlined, size: Spacing.x12, color: t.primary),
              const SizedBox(height: Spacing.x4),
              Text(
                'Enter your 6-digit code',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                auth.mfaPushSent
                    ? 'We also sent an approval request to your registered device.'
                    : 'Open your authenticator app to get the current code.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: Spacing.x6),
              TextField(
                controller: _code,
                autofocus: true,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 6,
                style: const TextStyle(
                  fontSize: TypeScale.x2l,
                  letterSpacing: Spacing.x2,
                ),
                inputFormatters: <TextInputFormatter>[
                  FilteringTextInputFormatter.digitsOnly,
                ],
                decoration: const InputDecoration(counterText: ''),
                onChanged: (String value) {
                  if (value.length == 6) _submit();
                },
              ),
              if (auth.failure != null) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Text(
                  auth.failure!.message,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: t.danger, fontSize: TypeScale.sm),
                ),
              ],
              const SizedBox(height: Spacing.x6),
              FilledButton(
                onPressed: auth.isSubmitting ? null : _submit,
                child: const Text('Verify'),
              ),
              if (auth.mfaPushSent) ...<Widget>[
                const SizedBox(height: Spacing.x4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    const SizedBox(
                      height: TypeScale.base,
                      width: TypeScale.base,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: Spacing.x2),
                    Text(
                      'Waiting for device approval…',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
