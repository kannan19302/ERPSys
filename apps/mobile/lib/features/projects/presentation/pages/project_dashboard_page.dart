import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/interactive_chart.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/projects_providers.dart';

class ProjectDashboardPage extends ConsumerWidget {
  const ProjectDashboardPage({super.key});
  static const String routeName = 'projects-dashboard';
  static const String routePath = '/projects/dashboard';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final Palette p = t;

    return Scaffold(
      appBar: AppBar(title: const Text('Projects Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: [
          // KPI Row
          Row(
            children: [
              Expanded(
                child: KpiCard(
                  label: 'Active Projects',
                  value: 12,
                  icon: Icons.folder_outlined,
                  previousValue: 10,
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: KpiCard(
                  label: 'In Progress',
                  value: 8,
                  icon: Icons.play_circle_outline,
                  previousValue: 6,
                  format: KpiFormat.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x3),
          Row(
            children: [
              Expanded(
                child: KpiCard(
                  label: 'Total Budget',
                  value: 1250000,
                  icon: Icons.account_balance_wallet_outlined,
                  format: KpiFormat.currency,
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: KpiCard(
                  label: 'Completion',
                  value: 68,
                  icon: Icons.check_circle_outline,
                  previousValue: 55,
                  format: KpiFormat.percent,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x4),

          // Tasks by Status
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const UiSectionHeader(title: 'Tasks by Status'),
                SimpleBarChart(
                  data: [
                    BarChartItem(label: 'Todo', value: 15, color: p.textSecondary),
                    BarChartItem(label: 'In Prog.', value: 22, color: p.info),
                    BarChartItem(label: 'Review', value: 8, color: p.warning),
                    BarChartItem(label: 'Done', value: 30, color: p.success),
                  ],
                  height: 180,
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x4),

          // Budget Distribution
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const UiSectionHeader(title: 'Budget Distribution'),
                SimplePieChart(
                  data: [
                    PieChartItem(label: 'Development', value: 450000, color: p.primary),
                    PieChartItem(label: 'Operations', value: 300000, color: p.info),
                    PieChartItem(label: 'Marketing', value: 250000, color: p.warning),
                    PieChartItem(label: 'Other', value: 250000, color: p.success),
                  ],
                  size: 140,
                  legendPosition: PieLegendPosition.bottom,
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x4),

          // Recent Activity
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const UiSectionHeader(title: 'Recent Activity'),
                _ActivityItem(icon: Icons.add_circle_outline, text: 'New task created in Project Alpha', time: '2h ago'),
                const Divider(height: 1),
                _ActivityItem(icon: Icons.check_circle_outline, text: 'Task "UI Review" completed', time: '4h ago'),
                const Divider(height: 1),
                _ActivityItem(icon: Icons.people_outline, text: 'John assigned to Project Beta', time: '1d ago'),
                const Divider(height: 1),
                _ActivityItem(icon: Icons.trending_up, text: 'Project Gamma budget updated', time: '2d ago'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({required this.icon, required this.text, required this.time});
  final IconData icon;
  final String text;
  final String time;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x2),
      child: Row(
        children: [
          Icon(icon, size: TypeScale.lg, color: t.textTertiary),
          const SizedBox(width: Spacing.x2),
          Expanded(child: Text(text, style: TextStyle(fontSize: TypeScale.sm, color: t.text))),
          Text(time, style: TextStyle(fontSize: TypeScale.xs, color: t.textTertiary)),
        ],
      ),
    );
  }
}