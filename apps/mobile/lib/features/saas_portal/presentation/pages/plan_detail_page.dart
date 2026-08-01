import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../providers/saas_portal_providers.dart';

class PortalPlanDetailPage extends ConsumerWidget {
  const PortalPlanDetailPage({required this.planId, super.key});
  static const String routeName = 'saas-portal-plan-detail';
  static const String routePath = '/saas-portal/plans/:id';
  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plan Details')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.card_membership, color: context.tokens.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Plan', style: Theme.of(context).textTheme.titleLarge), Text('ID: $planId', style: TextStyle(color: context.tokens.textSecondary)),
            ],),),
          ],),
        ],),),
      ],),
    );
  }
}

class PortalSupportTicketDetailPage extends ConsumerWidget {
  const PortalSupportTicketDetailPage({required this.ticketId, super.key});
  static const String routeName = 'portal-ticket-detail';
  static const String routePath = '/saas-portal/support/:id';
  final String ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support Ticket')),
      body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.support_agent, color: context.tokens.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Support Ticket', style: Theme.of(context).textTheme.titleLarge), Text('ID: $ticketId', style: TextStyle(color: context.tokens.textSecondary)),
            ],),),
          ],),
        ],),),
      ],),
    );
  }
}

class PortalSupportTicketFormPage extends ConsumerStatefulWidget {
  const PortalSupportTicketFormPage({this.ticketId, super.key});
  static const String routeName = 'portal-ticket-new';
  static const String routeEditName = 'portal-ticket-edit';
  static const String routePath = '/saas-portal/support/new';
  static const String routeEditPath = '/saas-portal/support/:id/edit';
  final String? ticketId;

  @override
  ConsumerState<PortalSupportTicketFormPage> createState() => _PortalSupportTicketFormPageState();
}

class _PortalSupportTicketFormPageState extends ConsumerState<PortalSupportTicketFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _subjectCtrl = TextEditingController(); final _descriptionCtrl = TextEditingController();
  String _priority = 'MEDIUM'; String _category = 'GENERAL'; bool _saving = false;
  bool get _isEditing => widget.ticketId != null;

  @override
  void dispose() { _subjectCtrl.dispose(); _descriptionCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{
      'subject': _subjectCtrl.text.trim(), 'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'priority': _priority, 'category': _category,
    };
    final result = await ref.read(portalSupportTicketListControllerProvider.notifier).save(payload, id: widget.ticketId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Ticket' : 'New Ticket'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Submit'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _subjectCtrl, decoration: const InputDecoration(labelText: 'Subject *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _descriptionCtrl, maxLines: 5, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(initialValue: _priority, decoration: const InputDecoration(labelText: 'Priority'), items: const [
          DropdownMenuItem(value: 'LOW', child: Text('Low')), DropdownMenuItem(value: 'MEDIUM', child: Text('Medium')),
          DropdownMenuItem(value: 'HIGH', child: Text('High')), DropdownMenuItem(value: 'URGENT', child: Text('Urgent')),
        ], onChanged: (v) { if (v != null) setState(() => _priority = v); },),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(initialValue: _category, decoration: const InputDecoration(labelText: 'Category'), items: const [
          DropdownMenuItem(value: 'GENERAL', child: Text('General')), DropdownMenuItem(value: 'BILLING', child: Text('Billing')),
          DropdownMenuItem(value: 'TECHNICAL', child: Text('Technical')), DropdownMenuItem(value: 'FEATURE', child: Text('Feature Request')),
        ], onChanged: (v) { if (v != null) setState(() => _category = v); },),
      ],),),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}