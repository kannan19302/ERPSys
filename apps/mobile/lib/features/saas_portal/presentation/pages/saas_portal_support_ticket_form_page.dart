import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/saas_portal_providers.dart';

class SaasPortalSupportTicketFormPage extends ConsumerStatefulWidget {
  const SaasPortalSupportTicketFormPage({this.ticketId, super.key});
  static const String routeName = 'portal-support-ticket-new';
  static const String routeEditName = 'portal-support-ticket-edit';
  static const String routePath = '/saas-portal/support/new';
  static const String routeEditPath = '/saas-portal/support/:id/edit';
  final String? ticketId;

  @override
  ConsumerState<SaasPortalSupportTicketFormPage> createState() => _SaasPortalSupportTicketFormPageState();
}

class _SaasPortalSupportTicketFormPageState extends ConsumerState<SaasPortalSupportTicketFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _subjectCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  String _priority = 'MEDIUM';
  String _category = 'GENERAL';
  bool _saving = false;

  bool get _isEditing => widget.ticketId != null;

  @override
  void dispose() { _subjectCtrl.dispose(); _descriptionCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'subject': _subjectCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'priority': _priority,
      'category': _category,
    };
    final result = await ref.read(portalSupportTicketListControllerProvider.notifier).save(payload, id: widget.ticketId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Ticket' : 'New Ticket'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit'),
          ),
        ],
      ),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _subjectCtrl, decoration: const InputDecoration(labelText: 'Subject *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _descriptionCtrl, maxLines: 5, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _priority, decoration: const InputDecoration(labelText: 'Priority'), items: const [
          DropdownMenuItem(value: 'LOW', child: Text('Low')), DropdownMenuItem(value: 'MEDIUM', child: Text('Medium')),
          DropdownMenuItem(value: 'HIGH', child: Text('High')), DropdownMenuItem(value: 'URGENT', child: Text('Urgent')),
        ], onChanged: (v) { if (v != null) setState(() => _priority = v); }),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _category, decoration: const InputDecoration(labelText: 'Category'), items: const [
          DropdownMenuItem(value: 'GENERAL', child: Text('General')), DropdownMenuItem(value: 'BILLING', child: Text('Billing')),
          DropdownMenuItem(value: 'TECHNICAL', child: Text('Technical')), DropdownMenuItem(value: 'FEATURE', child: Text('Feature Request')),
        ], onChanged: (v) { if (v != null) setState(() => _category = v); }),
      ])),
    );
  }
}
