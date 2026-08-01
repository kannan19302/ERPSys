import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../providers/auth_providers.dart';
import '../providers/auth_state.dart';
import 'register_page.dart';

/// Sign-in against `POST /auth/login`.
///
/// The organisation field appears only when the API reports that the email
/// belongs to several tenants — the same progressive disclosure the web app
/// uses, so the common single-tenant case stays a two-field form (Hick's Law).
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  static const String routeName = 'login';
  static const String routePath = '/sign-in';

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _tenantSlug = TextEditingController();
  bool _obscure = true;
  bool _rememberMe = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _tenantSlug.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();

    await ref.read(authControllerProvider.notifier).login(
          email: _email.text,
          password: _password.text,
          tenantSlug: _tenantSlug.text.isEmpty ? null : _tenantSlug.text,
          rememberMe: _rememberMe,
        );
  }

  @override
  Widget build(BuildContext context) {
    final AuthState auth = ref.watch(authControllerProvider);
    final Palette t = context.tokens;
    final Failure? failure = auth.failure;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Spacing.x6),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    const _Brand(),
                    const SizedBox(height: Spacing.x8),
                    Text(
                      'Sign in',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: Spacing.x2),
                    Text(
                      'Use your UniERP account.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: Spacing.x6),

                    if (failure != null && failure is! MfaRequiredFailure)
                      _ErrorBanner(message: failure.message),

                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const <String>[AutofillHints.username],
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Work email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                      onChanged: (_) =>
                          ref.read(authControllerProvider.notifier).clearError(),
                      validator: (String? value) {
                        final String email = (value ?? '').trim();
                        if (email.isEmpty) return 'Enter your email address';
                        if (!email.contains('@') || !email.contains('.')) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: Spacing.x4),

                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      autofillHints: const <String>[AutofillHints.password],
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                          tooltip: _obscure ? 'Show password' : 'Hide password',
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (String? value) =>
                          (value ?? '').isEmpty ? 'Enter your password' : null,
                    ),

                    // Shown only after the API reports a multi-tenant email.
                    if (auth.requiresTenantSlug) ...<Widget>[
                      const SizedBox(height: Spacing.x4),
                      TextFormField(
                        controller: _tenantSlug,
                        textCapitalization: TextCapitalization.none,
                        decoration: const InputDecoration(
                          labelText: 'Organisation slug',
                          helperText: 'This email is used by several organisations.',
                          prefixIcon: Icon(Icons.apartment_outlined),
                        ),
                        validator: (String? value) => (value ?? '').trim().isEmpty
                            ? 'Enter your organisation slug'
                            : null,
                      ),
                    ],

                    const SizedBox(height: Spacing.x3),
                    Row(
                      children: <Widget>[
                        Checkbox(
                          value: _rememberMe,
                          onChanged: (bool? value) =>
                              setState(() => _rememberMe = value ?? false),
                        ),
                        const Text('Keep me signed in'),
                        const Spacer(),
                        TextButton(
                          onPressed: () => _showForgotPassword(context),
                          child: const Text('Forgot password?'),
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.x4),

                    FilledButton(
                      onPressed: auth.isSubmitting ? null : _submit,
                      child: auth.isSubmitting
                          ? const SizedBox(
                              height: Spacing.x5,
                              width: Spacing.x5,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Sign in'),
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextButton(
                      onPressed: () => context.pushNamed(RegisterPage.routeName),
                      child: const Text("Don't have an organisation? Create one"),
                    ),
                    const SizedBox(height: Spacing.x3),
                    Text(
                      'Protected by your organisation’s security policy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: t.textTertiary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showForgotPassword(BuildContext context) async {
    final TextEditingController controller =
        TextEditingController(text: _email.text);

    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Reset password'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Work email'),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Send link'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    await ref
        .read(authRepositoryProvider)
        .forgotPassword(controller.text.trim().toLowerCase());
    controller.dispose();

    if (!context.mounted) return;
    // The endpoint never reveals whether the address exists, and neither do we.
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('If that address has an account, a reset link is on its way.'),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Column(
      children: <Widget>[
        Container(
          height: Spacing.x12,
          width: Spacing.x12,
          decoration: BoxDecoration(
            color: t.primaryLight,
            borderRadius: Radii.card,
          ),
          alignment: Alignment.center,
          child: Text(
            'U',
            style: TextStyle(
              color: t.primary,
              fontSize: TypeScale.x2l,
              fontWeight: TypeScale.bold,
            ),
          ),
        ),
        const SizedBox(height: Spacing.x3),
        Text('UniERP', style: Theme.of(context).textTheme.titleLarge),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      margin: const EdgeInsets.only(bottom: Spacing.x4),
      padding: const EdgeInsets.all(Spacing.x3),
      decoration: BoxDecoration(
        color: t.dangerLight,
        borderRadius: Radii.control,
        border: Border.all(color: t.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(Icons.error_outline, color: t.danger, size: TypeScale.lg),
          const SizedBox(width: Spacing.x2),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: t.danger, fontSize: TypeScale.sm),
            ),
          ),
        ],
      ),
    );
  }
}
