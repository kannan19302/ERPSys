import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';


class PaymentDetailPage extends ConsumerWidget {
  const PaymentDetailPage({required this.paymentId, super.key});

  static const String routeName = 'payment-detail';
  static const String routePath = '/finance/payments/:id';

  final String paymentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: const Center(child: Text('Payment detail — coming soon')),
    );
  }
}
