import '../../../../core/error/exceptions.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/di/providers.dart';

class AuthSessionsPage extends ConsumerStatefulWidget {
  const AuthSessionsPage({super.key});
  static const String routeName = 'sessions';
  static const String routePath = '/sessions';
  @override
  ConsumerState<AuthSessionsPage> createState() => _AuthSessionsPageState();
}

class _AuthSessionsPageState extends ConsumerState<AuthSessionsPage> {
  List<Map<String, dynamic>>? _sessions;
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
      final List<dynamic> raw = await client.getList(ApiPaths.sessions);
      _sessions = raw.cast<Map<String, dynamic>>();
      _failure = null;
    } on Object catch (e) {
      _failure = e is Failure ? e : const ServerFailure('Could not load sessions.');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _revoke(String id) async {
    try {
      final ApiClient client = ref.read(apiClientProvider);
      await client.delete(ApiPaths.revokeSession(id));
      await _load();
    } on Object catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is Failure ? e.message : 'Failed to revoke session')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Active Sessions')),
      body: _loading
          ? const LoadingView()
          : _failure != null
              ? FailureView(failure: _failure!, onRetry: _load)
              : _sessions == null || _sessions!.isEmpty
                  ? const Center(child: Text('No active sessions'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(Spacing.x4),
                      itemCount: _sessions!.length,
                      itemBuilder: (BuildContext context, int index) {
                        final Map<String, dynamic> session = _sessions![index];
                        final bool isCurrent = session['isCurrent'] == true;
                        final String device = session['device'] as String? ?? 'Unknown device';
                        final String browser = session['browser'] as String? ?? '';
                        final String location = session['location'] as String? ?? '';
                        final String ip = session['ipAddress'] as String? ?? '';
                        final String lastActive = session['lastActiveAt'] as String? ?? '';
                        final String id = '${session['id']}';

                        return Padding(
                          padding: const EdgeInsets.only(bottom: Spacing.x3),
                          child: Container(
                            padding: const EdgeInsets.all(Spacing.x4),
                            decoration: BoxDecoration(
                              color: t.bgElevated, borderRadius: Radii.card,
                              border: Border.all(color: isCurrent ? t.primary : t.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Row(children: <Widget>[
                                  Icon(Icons.devices_outlined, size: TypeScale.xl, color: isCurrent ? t.primary : t.textSecondary),
                                  const SizedBox(width: Spacing.x2),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: <Widget>[
                                        Text(device, style: Theme.of(context).textTheme.labelLarge),
                                        if (browser.isNotEmpty)
                                          Text(browser, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                                      ],
                                    ),
                                  ),
                                  if (isCurrent)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2, vertical: Spacing.x0_5),
                                      decoration: BoxDecoration(color: t.primaryLight, borderRadius: Radii.pill),
                                      child: Text('Current', style: TextStyle(color: t.primary, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
                                    ),
                                ]),
                                const SizedBox(height: Spacing.x2),
                                if (location.isNotEmpty)
                                  Text(location, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                                if (ip.isNotEmpty)
                                  Text(ip, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                                if (lastActive.isNotEmpty)
                                  Text('Last active: ${_parseDate(lastActive)}',
                                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                                if (!isCurrent) ...<Widget>[
                                  const SizedBox(height: Spacing.x2),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () => _confirmRevoke(context, id),
                                      style: TextButton.styleFrom(foregroundColor: t.danger),
                                      child: const Text('Revoke'),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }

  Future<void> _confirmRevoke(BuildContext context, String id) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dc) => AlertDialog(
        title: const Text('Revoke session?'),
        content: const Text('The device will be signed out immediately.'),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.of(dc).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(dc).pop(true), child: const Text('Revoke')),
        ],
      ),
    );
    if (confirmed == true) await _revoke(id);
  }

  String _parseDate(String iso) {
    final DateTime? dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}