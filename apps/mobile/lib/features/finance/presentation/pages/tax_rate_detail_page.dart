import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';


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
