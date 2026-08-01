import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';

class SaasPortalSupportTicketDetailPage extends ConsumerWidget {
  const SaasPortalSupportTicketDetailPage({required this.ticketId, super.key});
  static const String routeName = 'portal-support-ticket-detail';
  static const String routePath = '/saas-portal/support/:id';
  final String ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support Ticket')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        Text('Ticket: $ticketId'),
      ],),
    );
  }
}
