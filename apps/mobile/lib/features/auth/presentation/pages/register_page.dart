import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../providers/register_providers.dart';
import '../providers/register_state.dart';
import 'verify_email_pending_page.dart';

/// Creates a new organisation + administrator account against
/// `POST /auth/register`. Matches the web registration wizard's fields but as
/// a single scrollable form (Hick's Law doesn't apply the same way on a
/// phone — a multi-step wizard costs more taps than one long form here).
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  static const String routeName = 'register';
  static const String routePath = '/register';

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

const List<(String, String)> _industries = <(String, String)>[
  ('healthcare', 'Healthcare'),
  ('education', 'Education'),
  ('real-estate', 'Real Estate'),
  ('manufacturing', 'Manufacturing'),
  ('services', 'Professional Services'),
  ('retail', 'Retail'),
  ('field-service', 'Field Service'),
];

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstName = TextEditingController();
  final TextEditingController _lastName = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _organizationName = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _confirmPassword = TextEditingController();
  String? _industry;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _termsAccepted = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _organizationName.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You must agree to the Terms of Service and Privacy Policy'),
        ),
      );
      return;
    }
    FocusScope.of(context).unfocus();

    await ref.read(registerControllerProvider.notifier).submit(
          email: _email.text,
          password: _password.text,
          confirmPassword: _confirmPassword.text,
          firstName: _firstName.text,
          lastName: _lastName.text,
          organizationName: _organizationName.text,
          industry: _industry,
        );

    final RegisterState state = ref.read(registerControllerProvider);
    if (state.succeeded && mounted) {
      context.pushReplacementNamed(
        VerifyEmailPendingPage.routeName,
        extra: state.account,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final RegisterState state = ref.watch(registerControllerProvider);
    final Failure? failure = state.failure;

    return Scaffold(
      appBar: AppBar(title: const Text('Create your organisation')),
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
                    Text(
                      'Set up UniERP',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: Spacing.x2),
                    Text(
                      'You will be the administrator of this new workspace.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: Spacing.x6),

                    if (failure != null) _ErrorBanner(message: failure.message),

                    Row(
                      children: <Widget>[
                        Expanded(
                          child: TextFormField(
                            controller: _firstName,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'First name'),
                            validator: (String? v) =>
                                (v ?? '').trim().isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: Spacing.x3),
                        Expanded(
                          child: TextFormField(
                            controller: _lastName,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Last name'),
                            validator: (String? v) =>
                                (v ?? '').trim().isEmpty ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.x4),

                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const <String>[AutofillHints.newUsername],
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Work email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
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
                      controller: _organizationName,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Organisation name',
                        prefixIcon: Icon(Icons.apartment_outlined),
                      ),
                      validator: (String? v) =>
                          (v ?? '').trim().isEmpty ? 'Enter your organisation name' : null,
                    ),
                    const SizedBox(height: Spacing.x4),

                    DropdownButtonFormField<String>(
                      initialValue: _industry,
                      decoration: const InputDecoration(
                        labelText: 'Industry (optional)',
                        prefixIcon: Icon(Icons.category_outlined),
                      ),
                      items: <DropdownMenuItem<String>>[
                        for (final (String value, String label) in _industries)
                          DropdownMenuItem<String>(value: value, child: Text(label)),
                      ],
                      onChanged: (String? value) => setState(() => _industry = value),
                    ),
                    const SizedBox(height: Spacing.x4),

                    TextFormField(
                      controller: _password,
                      obscureText: _obscurePassword,
                      autofillHints: const <String>[AutofillHints.newPassword],
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        helperText: '12+ characters, upper/lowercase, number, symbol',
                        helperMaxLines: 2,
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,),
                          onPressed: () =>
                              setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      validator: _validatePassword,
                    ),
                    const SizedBox(height: Spacing.x4),

                    TextFormField(
                      controller: _confirmPassword,
                      obscureText: _obscureConfirm,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Confirm password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirm
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,),
                          onPressed: () =>
                              setState(() => _obscureConfirm = !_obscureConfirm),
                        ),
                      ),
                      validator: (String? v) => v != _password.text
                          ? 'Passwords do not match'
                          : null,
                    ),
                    const SizedBox(height: Spacing.x4),

                    CheckboxListTile(
                      value: _termsAccepted,
                      onChanged: (bool? v) => setState(() => _termsAccepted = v ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'I agree to the Terms of Service and Privacy Policy',
                      ),
                    ),
                    const SizedBox(height: Spacing.x4),

                    FilledButton(
                      onPressed: state.isSubmitting ? null : _submit,
                      child: state.isSubmitting
                          ? const SizedBox(
                              height: Spacing.x5,
                              width: Spacing.x5,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Create workspace'),
                    ),
                    const SizedBox(height: Spacing.x4),

                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Already have an account? Sign in'),
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

  String? _validatePassword(String? value) {
    final String v = value ?? '';
    if (v.length < 12) return 'At least 12 characters';
    if (!RegExp('[A-Z]').hasMatch(v)) return 'Add an uppercase letter';
    if (!RegExp('[a-z]').hasMatch(v)) return 'Add a lowercase letter';
    if (!RegExp('[0-9]').hasMatch(v)) return 'Add a number';
    if (!RegExp(r'[^A-Za-z0-9]').hasMatch(v)) return 'Add a special character';
    return null;
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
            child: Text(message, style: TextStyle(color: t.danger, fontSize: TypeScale.sm)),
          ),
        ],
      ),
    );
  }
}
