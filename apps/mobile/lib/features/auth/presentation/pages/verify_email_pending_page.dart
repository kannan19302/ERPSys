import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/session.dart';
import '../providers/register_providers.dart';
import 'login_page.dart';

/// Shown right after a successful `POST /auth/register`. The account exists
/// but is unverified, so this is a dead end until the user clicks the email
/// link — deep-linking that link straight back into the app (Android App
/// Links / iOS Universal Links) is a platform-config task not done here; for
/// now verification completes in a browser and the user returns to sign in.
class VerifyEmailPendingPage extends ConsumerStatefulWidget {
  const VerifyEmailPendingPage({required this.account, super.key});

  final RegisteredAccount account;

  static const String routeName = 'verify-email-pending';
  static const String routePath = '/verify-email-pending';

  @override
  ConsumerState<VerifyEmailPendingPage> createState() =>
      _VerifyEmailPendingPageState();
}

class _VerifyEmailPendingPageState extends ConsumerState<VerifyEmailPendingPage> {
  bool _resending = false;
  bool _resent = false;

  Future<void> _resend() async {
    setState(() => _resending = true);
    final bool ok = await ref
        .read(registerControllerProvider.notifier)
        .resendVerification(widget.account.email);
    if (!mounted) return;
    setState(() {
      _resending = false;
      _resent = ok;
    });
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final String? devLink = widget.account.developerVerificationLink;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Spacing.x6),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Container(
                    height: Spacing.x12,
                    width: Spacing.x12,
                    decoration: BoxDecoration(
                      color: t.primaryLight,
                      borderRadius: Radii.card,
                    ),
                    alignment: Alignment.center,
                    child: Icon(Icons.mark_email_read_outlined, color: t.primary, size: TypeScale.x2l),
                  ),
                  const SizedBox(height: Spacing.x6),
                  Text(
                    'Check your inbox',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Spacing.x3),
                  Text(
                    'We sent a verification link to ${widget.account.email}. '
                    'Open it to activate "${widget.account.organizationName}", then come back and sign in.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: Spacing.x6),

                  if (devLink != null) ...<Widget>[
                    Container(
                      padding: const EdgeInsets.all(Spacing.x3),
                      decoration: BoxDecoration(
                        color: t.warningLight,
                        borderRadius: Radii.control,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'Dev build only — production never returns this link.',
                            style: TextStyle(color: t.warning, fontSize: TypeScale.xs),
                          ),
                          const SizedBox(height: Spacing.x1),
                          SelectableText(devLink, style: const TextStyle(fontSize: TypeScale.xs)),
                        ],
                      ),
                    ),
                    const SizedBox(height: Spacing.x6),
                  ],

                  OutlinedButton(
                    onPressed: _resending ? null : _resend,
                    child: Text(_resent ? 'Verification link resent' : 'Resend verification email'),
                  ),
                  const SizedBox(height: Spacing.x4),
                  FilledButton(
                    onPressed: () => context.goNamed(LoginPage.routeName),
                    child: const Text('Back to sign in'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
