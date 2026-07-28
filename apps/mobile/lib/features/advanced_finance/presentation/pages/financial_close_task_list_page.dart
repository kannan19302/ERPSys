import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/advanced_finance_providers.dart';

class FinancialCloseTaskListPage extends ConsumerStatefulWidget {
  const FinancialCloseTaskListPage({super.key});
  static const String routeName = 'financial-close-tasks';
  static const String routePath = '/advanced-finance/close-tasks';
  @override
  ConsumerState<FinancialCloseTaskListPage> createState() => _FinancialCloseTaskListPageState();
}

class _FinancialCloseTaskListPageState extends ConsumerState<FinancialCloseTaskListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(multiCurrencyRateListControllerProvider);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Close Tasks'),
      ),
      body: state.isLoading && state.items.isEmpty
          ? const LoadingView()
          : Center(child: Text('Close tasks module', style: TextStyle(color: t.textSecondary))),
    );
  }
}
