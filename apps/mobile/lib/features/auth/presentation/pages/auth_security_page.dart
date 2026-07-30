import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/di/providers.dart';

class AuthSecurityPage extends ConsumerStatefulWidget {
  const AuthSecurityPage({super.key});
  static const String routeName = 'security';
  static const String routePath = '/security';
  @override
  ConsumerState<AuthSecurityPage> createState() => _AuthSecurityPageState();
}

class _AuthSecurityPageState extends ConsumerState<AuthSecurityPage> {
  bool _mfaEnabled = false;
  bool _loading = true;
  Failure? _failure;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final ApiClient client = ref.read(apiClientProvider);
      final Map<String, dynamic> profile = await client.getObject(ApiPaths.me);
      _mfaEnabled = profile['mfaEnabled'] == true;
      _failure = null;
    } on Object catch (e) {
      _failure = e is Failure ? e : const ServerFailure('Could not load security settings.');
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: _loading
          ? const LoadingView()
          : _failure != null
              ? FailureView(failure: _failure!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(Spacing.x4),
                  children: <Widget>[
                    _SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          const _SectionTitle(title: 'Multi-Factor Authentication'),
                          SwitchListTile(
                            title: const Text('MFA Protection'),
                            subtitle: const Text('Add an extra layer of security to your account'),
                            value: _mfaEnabled,
                            onChanged: (bool v) {
                              setState(() => _mfaEnabled = v);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(v ? 'MFA has been enabled' : 'MFA has been disabled')),
                              );
                            },
                            contentPadding: EdgeInsets.zero,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: Spacing.x4),
                    _SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          const _SectionTitle(title: 'Passkeys'),
                          ListTile(
                            leading: Icon(Icons.fingerprint, color: t.primary),
                            title: const Text('Passkeys'),
                            subtitle: const Text('Sign in with fingerprint, face, or a security key'),
                            trailing: const Icon(Icons.chevron_right),
                            contentPadding: EdgeInsets.zero,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Passkey management coming soon')),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: Spacing.x4),
                    _SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          const _SectionTitle(title: 'Recent Activity'),
                          ListTile(
                            leading: Icon(Icons.history, color: t.textSecondary),
                            title: const Text('Login History'),
                            trailing: const Icon(Icons.chevron_right),
                            contentPadding: EdgeInsets.zero,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Login history coming soon')),
                              );
                            },
                          ),
                          const Divider(),
                          ListTile(
                            leading: Icon(Icons.devices, color: t.textSecondary),
                            title: const Text('Active Sessions'),
                            trailing: const Icon(Icons.chevron_right),
                            contentPadding: EdgeInsets.zero,
                            onTap: () {
                              // Navigate to sessions page
                              Navigator.of(context).pushNamed('sessions');
                            },
                          ),
                        ],
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