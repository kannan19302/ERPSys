import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

/// `GET /pos/registers/:id`. Read-only.
class PosRegisterDetailPage extends ConsumerWidget {
  const PosRegisterDetailPage({required this.registerId, super.key});

  static const String routeName = 'pos-register-detail';

  final String registerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
        UiCard(
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
                  UiStatusBadge(
                    label: register.status,
                    tone: register.status == 'OPEN' ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Balances'),
              _Row('Opening balance', Formatters.currency(register.openingBalance)),
              _Row(
                'Closing balance',
                register.closingBalance == null
                    ? '—'
                    : Formatters.currency(register.closingBalance!),
              ),
              _Row('Location', register.location ?? '—'),
            ],
          ),
        ),
      ],
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
