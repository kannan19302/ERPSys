import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../../auth/presentation/providers/auth_state.dart';

class AuthProfilePage extends ConsumerWidget {
  const AuthProfilePage({super.key});
  static const String routeName = 'profile';
  static const String routePath = '/profile';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AuthState authState = ref.watch(authControllerProvider);
    final Palette t = context.tokens;
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: user == null
          ? const Center(child: Text('Not signed in'))
          : ListView(
              padding: const EdgeInsets.all(Spacing.x4),
              children: <Widget>[
                Center(
                  child: Column(
                    children: <Widget>[
                      CircleAvatar(
                        radius: Spacing.x10,
                        backgroundColor: t.primaryLight,
                        child: Text(
                          user.initials,
                          style: TextStyle(
                            fontSize: TypeScale.x2l,
                            fontWeight: TypeScale.semibold,
                            color: t.primary,
                          ),
                        ),
                      ),
                      const SizedBox(height: Spacing.x3),
                      Text(user.fullName, style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: Spacing.x1),
                      Text(user.email, style: TextStyle(color: t.textSecondary)),
                    ],
                  ),
                ),
                const SizedBox(height: Spacing.x6),
                _SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const _SectionTitle(title: 'Account'),
                      _FieldRow('Name', user.fullName),
                      _FieldRow('Email', user.email),
                      if (user.roles.isNotEmpty) _FieldRow('Roles', user.roles.join(', ')),
                    ],
                  ),
                ),
                const SizedBox(height: Spacing.x4),
                _SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const _SectionTitle(title: 'Preferences'),
                      SwitchListTile(
                        title: const Text('Email notifications'),
                        value: true,
                        onChanged: (bool _) {},
                        contentPadding: EdgeInsets.zero,
                      ),
                      SwitchListTile(
                        title: const Text('Push notifications'),
                        value: true,
                        onChanged: (bool _) {},
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: Spacing.x4),
                _SectionCard(
                  child: InkWell(
                    onTap: () {
                      showDialog<void>(
                        context: context,
                        builder: (BuildContext dc) => AlertDialog(
                          title: const Text('Change Password'),
                          content: const Text('A password reset link will be sent to your email.'),
                          actions: <Widget>[
                            TextButton(
                              onPressed: () => Navigator.of(dc).pop(),
                              child: const Text('Cancel'),
                            ),
                            FilledButton(
                              onPressed: () {
                                Navigator.of(dc).pop();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Reset link sent')),
                                );
                              },
                              child: const Text('Send Reset Link'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Row(children: <Widget>[
                      Icon(Icons.lock_outline, color: t.textSecondary),
                      const SizedBox(width: Spacing.x2),
                      Expanded(child: Text('Change Password', style: Theme.of(context).textTheme.labelLarge)),
                      Icon(Icons.chevron_right, color: t.textTertiary),
                    ],),
                  ),
                ),
              ],
            ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: <Widget>[
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Flexible(child: Text(value, style: Theme.of(context).textTheme.labelLarge, textAlign: TextAlign.end)),
      ],),
    );
  }
}