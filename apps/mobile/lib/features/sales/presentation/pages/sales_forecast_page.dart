import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/ui_card.dart';

class SalesForecastPage extends ConsumerWidget {
  const SalesForecastPage({super.key});

  static const String routeName = 'sales-forecast';
  static const String routePath = '/sales/forecast';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Forecast'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.date_range),
            tooltip: 'Period',
            onSelected: (String v) {},
            itemBuilder: (_) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(value: 'monthly', child: Text('Monthly')),
              const PopupMenuItem<String>(value: 'quarterly', child: Text('Quarterly')),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _KpiCard(
                  title: 'Pipeline Value',
                  value: Formatters.compact(1250000),
                  color: t.primary,
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: _KpiCard(
                  title: 'Weighted Forecast',
                  value: Formatters.compact(780000),
                  color: t.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x3),
          Row(
            children: <Widget>[
              Expanded(
                child: _KpiCard(
                  title: 'Closed Won',
                  value: Formatters.compact(450000),
                  color: t.success,
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: _KpiCard(
                  title: 'Win Rate',
                  value: '68%',
                  color: t.info,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x6),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Forecast by Period'),
                SizedBox(
                  height: 200,
                  child: Center(
                    child: Text(
                      'Chart placeholder',
                      style: TextStyle(color: t.textTertiary),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x6),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Opportunities in Period'),
                const SizedBox(height: Spacing.x2),
                Text(
                  'No opportunities for this period.',
                  style: TextStyle(color: t.textTertiary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.color,
  });

  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            title,
            style: TextStyle(
              fontSize: TypeScale.xs,
              color: context.tokens.textSecondary,
            ),
          ),
          const SizedBox(height: Spacing.x1),
          Text(
            value,
            style: TextStyle(
              fontSize: TypeScale.x2l,
              fontWeight: TypeScale.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
