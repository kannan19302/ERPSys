import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../../domain/usecases/hr_usecases.dart';
import '../providers/hr_providers.dart';

class PayrollEntryDetailPage extends ConsumerWidget {
  const PayrollEntryDetailPage({required this.payslipId, super.key});

  static const String routeName = 'payroll-entry-detail';
  static const String routePath = '/hr/payroll/entry/:id';

  final String payslipId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final FutureProviderFamily<Payslip, String> provider = payslipDetailProvider;
    final AsyncValue<Payslip> asyncPayslip = ref.watch(provider(payslipId));

    return asyncPayslip.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Payslip')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (Object e, _) => Scaffold(
        appBar: AppBar(title: const Text('Payslip')),
        body: Center(child: Text('$e')),
      ),
      data: (Payslip slip) => _PayslipDetail(payslip: slip),
    );
  }
}

final FutureProviderFamily<Payslip, String> payslipDetailProvider =
    FutureProvider.family<Payslip, String>((Ref ref, String id) async {
  final Result<Payslip> result =
      await GetPayslipUseCase(ref.watch(hrRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Payslip p) => p,
  );
});

class _PayslipDetail extends StatelessWidget {
  const _PayslipDetail({required this.payslip});

  final Payslip payslip;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payslip')),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: <Widget>[
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  payslip.employeeName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: Spacing.x3),
                _Row('Employee', payslip.employeeName),
                _Row('Base Salary', Formatters.currency(payslip.baseSalary)),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Earnings'),
                _Row('Total Earnings', Formatters.currency(payslip.totalEarnings)),
                if (payslip.totalDeductions > 0)
                  _Row('Total Deductions', '-${Formatters.currency(payslip.totalDeductions)}'),
                const Divider(),
                _Row(
                  'Net Pay',
                  Formatters.currency(payslip.netPay),
                ),
              ],
            ),
          ),
          if (payslip.status != null || payslip.generatedDate != null) ...<Widget>[
            const SizedBox(height: Spacing.x4),
            UiCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const UiSectionHeader(title: 'Status'),
                  if (payslip.status != null)
                    _Row('Status', payslip.status!),
                  if (payslip.generatedDate != null)
                    _Row('Generated', Formatters.dateTime(payslip.generatedDate!)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}