import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/saas_portal.dart';
import '../providers/saas_portal_providers.dart';

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
      ]),
    );
  }
}
