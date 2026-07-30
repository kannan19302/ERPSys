import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class BankAccountDetailPage extends ConsumerWidget {
  const BankAccountDetailPage({required this.bankAccountId, super.key});

  static const String routeName = 'bank-account-detail';
  static const String routePath = '/finance/bank-accounts/:id';

  final String bankAccountId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<BankAccount> accountAsync =
        ref.watch(bankAccountDetailProvider(bankAccountId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bank Account'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete account',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: accountAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load bank account.'),
          onRetry: () => ref.invalidate(bankAccountDetailProvider(bankAccountId)),
        ),
        data: (BankAccount acc) => _BankAccountDetail(account: acc),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete bank account?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(bankAccountsProvider.notifier)
        .delete(bankAccountId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _BankAccountDetail extends StatelessWidget {
  const _BankAccountDetail({required this.account});

  final BankAccount account;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      account.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: account.isActive ? 'Active' : 'Inactive',
                    tone: account.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(account.bankName, style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Account Details'),
              _FieldRow('Name', account.name),
              _FieldRow('Account Number', account.accountNumber),
              _FieldRow('Bank Name', account.bankName),
              _FieldRow('Branch', account.branch ?? '—'),
              _FieldRow('Currency', account.currency),
              _FieldRow('Balance', Formatters.currency(account.balance, currencyCode: account.currency)),
              _FieldRow('Status', account.isActive ? 'Active' : 'Inactive'),
            ],
          ),
        ),
      ],
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
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(
        color: t.bgElevated,
        borderRadius: Radii.card,
        border: Border.all(color: t.border),
      ),
      child: child,
    );
  }
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
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
