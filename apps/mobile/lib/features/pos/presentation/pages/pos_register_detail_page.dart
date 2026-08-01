import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

class PosRegisterDetailPage extends ConsumerWidget {
  const PosRegisterDetailPage({super.key, this.id});
  final String? id;

  static const String routeName = 'pos-register-detail';
  static const String routePath = '/pos/registers/:id';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String registerId = id ?? '';
    final AsyncValue<PosRegister> registerAsync =
        ref.watch(posRegisterDetailProvider(registerId));

    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: registerAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load register.'),
          onRetry: () => ref.invalidate(posRegisterDetailProvider(registerId)),
        ),
        data: (PosRegister register) => _PosRegisterDetail(register: register),
      ),
    );
  }
}

class _PosRegisterDetail extends StatelessWidget {
  const _PosRegisterDetail({required this.register});

  final PosRegister register;

  @override
  Widget build(BuildContext context) {
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
                      register.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: register.status, tone: _statusTone(register.status)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Balances'),
              _FieldRow('Opening balance', Formatters.currency(register.openingBalance)),
              if (register.closingBalance != null)
                _FieldRow('Closing balance', Formatters.currency(register.closingBalance!)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _FieldRow('Location', register.location ?? '—'),
            ],
          ),
        ),
      ],
    );
  }

  static UiTone _statusTone(String status) => switch (status) {
        'OPEN' => UiTone.success,
        'CLOSED' => UiTone.neutral,
        _ => UiTone.warning,
      };
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return UiCard(child: child);
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
