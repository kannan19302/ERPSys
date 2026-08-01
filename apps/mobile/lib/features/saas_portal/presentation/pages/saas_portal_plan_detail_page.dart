import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';

class SaasPortalPlanDetailPage extends ConsumerWidget {
  const SaasPortalPlanDetailPage({required this.planId, super.key});
  static const String routeName = 'portal-plan-detail';
  static const String routePath = '/saas-portal/plans/:id';
  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plan Details')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: const [
        Text('Portal plan details'),
      ],),
    );
  }
}
