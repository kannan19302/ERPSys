import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class TaxRateDetailPage extends ConsumerWidget {
  const TaxRateDetailPage({required this.taxRateId, super.key});

  static const String routeName = 'tax-rate-detail';
  static const String routePath = '/finance/tax-rates/:id';

  final String taxRateId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tax Rate')),
      body: const Center(child: Text('Tax rate detail — coming soon')),
    );
  }
}
