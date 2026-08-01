import '../../../../core/contracts/paginated.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PayrollEntryListPage extends ConsumerStatefulWidget {
  const PayrollEntryListPage({required this.payrollRunId, super.key});

  static const String routeName = 'payroll-entries';
  static const String routePath = '/hr/payroll/:id/entries';

  final String payrollRunId;

  @override
  ConsumerState<PayrollEntryListPage> createState() =>
      _PayrollEntryListPageState();
}

class _PayrollEntryListPageState extends ConsumerState<PayrollEntryListPage> {
  @override
  Widget build(BuildContext context) {
    final AsyncValue<Paginated<Payslip>> asyncSlips =
        ref.watch(payslipsProvider);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Payslips')),
      body: asyncSlips.when(
        loading: () => const LoadingView(),
        error: (Object e, StackTrace _) => FailureView(
          failure: e is Failure ? e : ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(payslipsProvider),
        ),
        data: (Paginated<Payslip> page) {
          if (page.isEmpty) {
            return ListView(
              children: <Widget>[
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.6,
                  child: const EmptyView(
                    title: 'No payslips',
                    message: 'Payslips will appear after payroll is processed.',
                  ),
                ),
              ],
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(Spacing.x4),
            itemCount: page.data.length,
            separatorBuilder: (_, __) => const SizedBox(height: Spacing.x3),
            itemBuilder: (BuildContext context, int index) {
              final Payslip slip = page.data[index];
              return UiCard(
                onTap: () => context.pushNamed(
                  'payroll-entry-detail',
                  pathParameters: <String, String>{'id': slip.id},
                ),
                padding: const EdgeInsets.all(Spacing.x3),
                child: Row(
                  children: <Widget>[
                    CircleAvatar(
                      radius: Spacing.x4,
                      backgroundColor: t.bgSunken,
                      child: Icon(Icons.person_outline,
                          color: t.textSecondary, size: TypeScale.lg,),
                    ),
                    const SizedBox(width: Spacing.x3),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            slip.employeeName,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: Spacing.x0_5),
                          Text(
                            'Base: ${Formatters.currency(slip.baseSalary)}',
                            style: TextStyle(
                              color: t.textTertiary,
                              fontSize: TypeScale.xs,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: <Widget>[
                        Text(
                          Formatters.currency(slip.netPay),
                          style: TextStyle(
                            fontWeight: TypeScale.semibold,
                            color: t.success,
                          ),
                        ),
                        if (slip.status != null)
                          Text(
                            slip.status!,
                            style: TextStyle(
                              color: t.textTertiary,
                              fontSize: TypeScale.xs,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}