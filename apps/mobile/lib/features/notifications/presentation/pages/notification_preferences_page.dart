import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';

class NotificationPreferencesPage extends ConsumerWidget {
  const NotificationPreferencesPage({super.key});
  static const String routeName = 'notification-preferences';
  static const String routePath = '/notifications/preferences';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.notifications_outlined, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Channels', style: Theme.of(context).textTheme.titleLarge),
              Text('Configure how you receive notifications', style: TextStyle(color: t.textSecondary)),
            ],),),
          ],),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Email Notifications'), const Divider(),
          SwitchListTile(title: const Text('Email'), subtitle: const Text('Receive notifications via email'), value: true, onChanged: (_) {}, contentPadding: EdgeInsets.zero),
          SwitchListTile(title: const Text('Daily Digest'), subtitle: const Text('Receive a daily summary instead of individual emails'), value: false, onChanged: (_) {}, contentPadding: EdgeInsets.zero),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Push Notifications'), const Divider(),
          SwitchListTile(title: const Text('Push'), subtitle: const Text('Receive push notifications on this device'), value: true, onChanged: (_) {}, contentPadding: EdgeInsets.zero),
          SwitchListTile(title: const Text('Sound'), value: true, onChanged: (_) {}, contentPadding: EdgeInsets.zero),
          SwitchListTile(title: const Text('Vibrate'), value: true, onChanged: (_) {}, contentPadding: EdgeInsets.zero),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Modules'), const Divider(),
          ...['CRM', 'Finance', 'Inventory', 'HR', 'Projects', 'Sales', 'Support'].map((m) => SwitchListTile(title: Text(m), value: true, onChanged: (_) {}, contentPadding: EdgeInsets.zero)),
        ],),),
      ],),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}
class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title}); final String title;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: Spacing.x3), child: Text(title, style: Theme.of(context).textTheme.titleMedium));
}
