import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';

class SearchConfigPage extends ConsumerWidget {
  const SearchConfigPage({super.key});
  static const String routeName = 'search-config';
  static const String routePath = '/search/config';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Search Configuration')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.tune, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Search Settings', style: Theme.of(context).textTheme.titleLarge),
              Text('Configure index and search behaviour', style: TextStyle(color: t.textSecondary)),
            ],),),
          ],),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Indexed Resources'),
          const Divider(),
          _resourceTile(t, 'Customers', true), _resourceTile(t, 'Contacts', true),
          _resourceTile(t, 'Leads', true), _resourceTile(t, 'Products', true),
          _resourceTile(t, 'Invoices', false), _resourceTile(t, 'Orders', true),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Fuzzy Search'),
          const Divider(),
          ListTile(title: const Text('Fuzzy Level'), subtitle: const Text('1 - Low (default)'), trailing: const Icon(Icons.chevron_right), contentPadding: EdgeInsets.zero, onTap: () {}),
          ListTile(title: const Text('Minimum Score'), subtitle: const Text('0.5'), trailing: const Icon(Icons.chevron_right), contentPadding: EdgeInsets.zero, onTap: () {}),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Actions'),
          const Divider(),
          SizedBox(width: double.infinity, child: OutlinedButton.icon(icon: const Icon(Icons.refresh), label: const Text('Reindex All'), onPressed: () {})),
          const SizedBox(height: Spacing.x2),
          SizedBox(width: double.infinity, child: OutlinedButton.icon(icon: const Icon(Icons.delete_sweep), label: const Text('Clear Search Cache'), onPressed: () {})),
        ],),),
      ],),
    );
  }

  Widget _resourceTile(Palette t, String name, bool enabled) {
    return SwitchListTile(title: Text(name), value: enabled, onChanged: (_) {}, contentPadding: EdgeInsets.zero);
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
