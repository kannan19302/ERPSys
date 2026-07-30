import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../providers/subscriptions_providers.dart';

class BillingFormPage extends ConsumerStatefulWidget {
  const BillingFormPage({this.billingId, super.key});
  static const String routeName = 'billing-form';
  static const String routePath = '/subscriptions/billing/new';
  static const String routeEditPath = '/subscriptions/billing/:id/edit';
  final String? billingId;

  @override
  ConsumerState<BillingFormPage> createState() => _BillingFormPageState();
}

class _BillingFormPageState extends ConsumerState<BillingFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountCtrl = TextEditingController(); final _invoiceCtrl = TextEditingController();
  String _status = 'PENDING'; String _currency = 'USD'; bool _saving = false;

  @override
  void dispose() { _amountCtrl.dispose(); _invoiceCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{
      'amount': double.tryParse(_amountCtrl.text) ?? 0, 'currency': _currency,
      'status': _status, 'invoiceId': _invoiceCtrl.text.trim().isEmpty ? null : _invoiceCtrl.text.trim(),
    };
    final result = await ref.read(subscriptionBillingCycleListControllerProvider.notifier).save(payload, id: widget.billingId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing Cycle'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _amountCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount *')),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: DropdownButtonFormField<String>(value: _currency, decoration: const InputDecoration(labelText: 'Currency'), items: const [
            DropdownMenuItem(value: 'USD', child: Text('USD')), DropdownMenuItem(value: 'EUR', child: Text('EUR')),
          ], onChanged: (v) { if (v != null) setState(() => _currency = v); })),
          const SizedBox(width: Spacing.x3),
          Expanded(child: DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
            DropdownMenuItem(value: 'PENDING', child: Text('Pending')), DropdownMenuItem(value: 'PAID', child: Text('Paid')),
            DropdownMenuItem(value: 'OVERDUE', child: Text('Overdue')), DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
          ], onChanged: (v) { if (v != null) setState(() => _status = v); })),
        ]),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _invoiceCtrl, decoration: const InputDecoration(labelText: 'Invoice ID')),
      ])),
    );
  }
}
